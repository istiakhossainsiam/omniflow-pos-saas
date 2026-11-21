import random
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.time_utils import dhaka_now, dhaka_today_str, dhaka_current_month
from app.models.user import User, EmployeeProfile, MonthlyTarget, PayrollDisbursement
from app.models.tenant import Branch, Tenant, Expense, AttendancePolicy
from app.models.order import Order, OrderItem, PaymentRecord, OrderExchange
from app.models.incentive import CommissionRecord
from app.models.attendance import AttendanceRecord
from app.models.product import ProductVariant, InventoryStock, Product

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/overview")
async def get_multi_branch_overview(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Multi-Branch Consolidated Dashboard in Asia/Dhaka Time:
    - Today's Total Sales, Orders, Average Ticket Size
    - Weekly & Monthly Revenue
    - Branch-wise Comparative Revenue
    - Top Selling Clothing Sizes and Products
    - Low Stock Warnings
    """
    now = dhaka_now()
    today_str = dhaka_today_str()
    month_str = dhaka_current_month()
    seven_days_ago = (now - timedelta(days=7)).replace(tzinfo=None)

    # 1. Fetch Orders
    query = (
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.payments))
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.status == "COMPLETED"
        )
    )
    if branch_id:
        query = query.where(Order.branch_id == branch_id)

    res = await db.execute(query)
    orders = res.scalars().all()

    today_sales = 0.0
    today_orders = 0
    today_cash = 0.0
    today_mfs = 0.0
    today_card = 0.0
    
    weekly_sales = 0.0
    monthly_sales = 0.0
    total_cost = 0.0
    
    product_sales_map = {}
    size_popularity_map = {}

    for o in orders:
        o_date_str = o.created_at.strftime("%Y-%m-%d")
        o_month_str = o.created_at.strftime("%Y-%m")

        if o_month_str == month_str:
            monthly_sales += o.total_amount

        o_created = o.created_at.replace(tzinfo=None) if o.created_at.tzinfo else o.created_at
        if o_created >= seven_days_ago:
            weekly_sales += o.total_amount

        if o_date_str == today_str:
            today_sales += o.total_amount
            today_orders += 1
            for p in o.payments:
                if p.payment_method == "CASH":
                    today_cash += p.amount
                elif p.payment_method in ["BKASH", "NAGAD", "ROCKET"]:
                    today_mfs += p.amount
                elif p.payment_method == "CARD":
                    today_card += p.amount

        # Item level aggregates
        for it in o.items:
            total_cost += (it.cost_price * it.quantity)
            product_sales_map[it.product_name] = product_sales_map.get(it.product_name, 0) + it.quantity
            if it.size:
                size_popularity_map[it.size] = size_popularity_map.get(it.size, 0) + it.quantity

    # 2. Branch-wise Comparison
    branches_res = await db.execute(
        select(Branch).where(Branch.tenant_id == current_user.tenant_id, Branch.is_active == True)
    )
    branches = branches_res.scalars().all()
    branch_comparison = []

    for b in branches:
        b_orders = [o for o in orders if o.branch_id == b.id]
        b_month_rev = sum(o.total_amount for o in b_orders if o.created_at.strftime("%Y-%m") == month_str)
        b_today_rev = sum(o.total_amount for o in b_orders if o.created_at.strftime("%Y-%m-%d") == today_str)
        branch_comparison.append({
            "branch_id": b.id,
            "branch_name": b.name,
            "branch_code": b.code,
            "is_warehouse": b.is_warehouse,
            "today_revenue": b_today_rev,
            "month_revenue": b_month_rev,
            "total_orders_count": len(b_orders)
        })

    # 3. Low Stock Alerts
    stocks_res = await db.execute(
        select(InventoryStock)
        .options(selectinload(InventoryStock.variant).selectinload(ProductVariant.product), selectinload(InventoryStock.branch))
        .where(InventoryStock.tenant_id == current_user.tenant_id)
    )
    all_stocks = stocks_res.scalars().all()
    low_stock_alerts = []

    for s in all_stocks:
        if s.variant and s.quantity <= s.variant.min_stock_alert:
            low_stock_alerts.append({
                "product_name": s.variant.product.name if s.variant.product else "Product",
                "size": s.variant.size,
                "color": s.variant.color,
                "sku": s.variant.sku,
                "branch_name": s.branch.name if s.branch else "Branch",
                "current_stock": s.quantity,
                "min_stock_alert": s.variant.min_stock_alert
            })

    # Sort Top Selling
    top_products = sorted(
        [{"name": k, "sold_qty": v} for k, v in product_sales_map.items()],
        key=lambda x: x["sold_qty"],
        reverse=True
    )[:5]

    top_sizes = sorted(
        [{"size": k, "count": v} for k, v in size_popularity_map.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:5]

    return {
        "today_sales": today_sales,
        "today_orders": today_orders,
        "avg_ticket_size": round(today_sales / today_orders, 2) if today_orders > 0 else 0.0,
        "payment_split": {
            "cash": today_cash,
            "mfs": today_mfs,
            "card": today_card
        },
        "weekly_sales": weekly_sales,
        "monthly_sales": monthly_sales,
        "estimated_gross_profit": round(monthly_sales - total_cost, 2),
        "branch_comparison": branch_comparison,
        "top_selling_products": top_products,
        "top_popular_sizes": top_sizes,
        "low_stock_alerts": low_stock_alerts[:8]
    }


# =========================================================================
# FEATURE 5: OWNER'S NIGHTLY BUSINESS SUMMARY & WHATSAPP DIGEST
# =========================================================================

@router.get("/daily-digest")
async def get_owner_daily_digest(
    date_str: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Consolidated 1-Click Executive Daily Digest for Store Owner with copyable WhatsApp format.
    """
    target_date_str = date_str or dhaka_today_str()
    try:
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except Exception:
        target_date = datetime.strptime(dhaka_today_str(), "%Y-%m-%d").date()
        target_date_str = dhaka_today_str()

    start_dt = datetime.combine(target_date, datetime.min.time())
    end_dt = datetime.combine(target_date, datetime.max.time())

    # 1. Fetch Orders for target date
    ord_query = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payments),
            selectinload(Order.salesman),
            selectinload(Order.customer)
        )
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.status == "COMPLETED",
            Order.created_at >= start_dt,
            Order.created_at <= end_dt
        )
    )
    if branch_id:
        ord_query = ord_query.where(Order.branch_id == branch_id)

    ord_res = await db.execute(ord_query)
    orders = ord_res.scalars().all()

    total_sales = sum(o.total_amount for o in orders)
    total_discounts = sum(o.discount_amount for o in orders)
    total_vat = sum(o.tax_vat_amount for o in orders)
    total_orders = len(orders)
    avg_ticket = round(total_sales / total_orders, 2) if total_orders > 0 else 0.0

    total_cogs = 0.0
    cash_sales = 0.0
    bkash_sales = 0.0
    card_sales = 0.0
    due_sales = sum(o.due_amount for o in orders)

    product_sales_map = {}
    salesman_sales_map = {}

    for o in orders:
        for p in o.payments:
            pm = p.payment_method.upper()
            if pm == "CASH":
                cash_sales += p.amount
            elif pm in ["BKASH", "NAGAD", "ROCKET", "MFS"]:
                bkash_sales += p.amount
            elif pm in ["CARD", "VISA", "MASTERCARD", "AMEX"]:
                card_sales += p.amount

        for it in o.items:
            total_cogs += (it.cost_price * it.quantity)
            key = f"{it.product_name} ({it.size or ''} {it.color or ''})".strip()
            product_sales_map[key] = product_sales_map.get(key, 0) + it.quantity

        if o.salesman:
            s_name = o.salesman.full_name
            salesman_sales_map[s_name] = salesman_sales_map.get(s_name, 0.0) + o.total_amount

    estimated_profit = round(total_sales - total_cogs, 2)
    profit_margin = round((estimated_profit / total_sales) * 100, 1) if total_sales > 0 else 0.0

    top_items = sorted([{"name": k, "qty": v} for k, v in product_sales_map.items()], key=lambda x: x["qty"], reverse=True)[:5]
    top_staff = sorted([{"name": k, "sales": v} for k, v in salesman_sales_map.items()], key=lambda x: x["sales"], reverse=True)[:3]

    # Generate Structured WhatsApp Markdown Digest
    top_items_text = "\n".join([f"  • {item['name']}: *{item['qty']} pcs*" for item in top_items]) if top_items else "  • No item breakdown"
    top_staff_text = "\n".join([f"  • {s['name']}: *৳{int(s['sales']):,}*" for s in top_staff]) if top_staff else "  • N/A"

    whatsapp_digest = f"""📊 *DAILY BUSINESS CLOSING SUMMARY*
📅 Date: *{target_date_str}*
🏢 Store: *{current_user.tenant_id[:8]}...*
━━━━━━━━━━━━━━━━━━━━
💰 *Gross Sales:* ৳{int(total_sales):,}
📦 *Orders Completed:* {total_orders}
🎯 *Avg. Basket Size:* ৳{int(avg_ticket):,}
📈 *Est. Gross Profit:* ৳{int(estimated_profit):,} ({profit_margin}%)

💳 *Payment Breakdown:*
  💵 Cash in Register: ৳{int(cash_sales):,}
  📱 bKash / MFS: ৳{int(bkash_sales):,}
  💳 Card / POS: ৳{int(card_sales):,}
  📒 New Customer Due: ৳{int(due_sales):,}

🏆 *Top Selling Items:*
{top_items_text}

🌟 *Top Sales Performers:*
{top_staff_text}
━━━━━━━━━━━━━━━━━━━━
Generated automatically by OmniFlow POS Cloud ⚡"""

    return {
        "date": target_date_str,
        "total_sales": total_sales,
        "total_orders": total_orders,
        "avg_ticket_size": avg_ticket,
        "total_discounts": total_discounts,
        "total_vat": total_vat,
        "estimated_cogs": total_cogs,
        "estimated_profit": estimated_profit,
        "profit_margin_pct": profit_margin,
        "payment_breakdown": {
            "cash": cash_sales,
            "bkash": bkash_sales,
            "card": card_sales,
            "due": due_sales
        },
        "top_items": top_items,
        "top_salesmen": top_staff,
        "whatsapp_digest_text": whatsapp_digest
    }


# =========================================================================
# FEATURE 6: MONTHLY COSTING, EXPENSES & NET PROFIT (P&L) ANALYTICS ENGINE
# =========================================================================

@router.get("/monthly-pnl")
async def get_monthly_profit_and_loss(
    month_year: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Consolidated Monthly P&L and Costing Analytics:
    - Net Sales Revenue (Gross Sales - Returns)
    - Cost of Goods Sold (COGS) & Gross Profit
    - Staff Payroll (Base Salaries + Realized Commissions + Target Bonuses)
    - Categorized Operating Overheads (Rent, Utilities, Marketing, Logistics, Packaging, Misc)
    - Total Operating Cost (OPEX) & Total Business Costing (COGS + OPEX)
    - Net Operating Profit (EBITDA) & Profit Margin %
    - Break-Even Sales Volume
    """
    target_month = month_year or dhaka_current_month() # e.g. "2026-10"
    
    # 1. Fetch Orders in this Month
    ord_query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.status == "COMPLETED"
        )
    )
    if branch_id:
        ord_query = ord_query.where(Order.branch_id == branch_id)

    res = await db.execute(ord_query)
    all_orders = res.scalars().all()
    
    # Filter by month
    month_orders = [o for o in all_orders if o.created_at.strftime("%Y-%m") == target_month]
    
    gross_sales = sum(o.total_amount for o in month_orders)
    total_discounts = sum(o.discount_amount for o in month_orders)
    total_vat = sum(o.tax_vat_amount for o in month_orders)
    orders_count = len(month_orders)
    avg_ticket = round(gross_sales / orders_count, 2) if orders_count > 0 else 0.0

    # 2. Direct Product Cost (COGS)
    cogs_total = 0.0
    items_sold_qty = 0
    for o in month_orders:
        for it in o.items:
            cogs_total += (it.cost_price * it.quantity)
            items_sold_qty += it.quantity

    # 3. Returns & Refunds in this Month
    exc_query = (
        select(OrderExchange)
        .where(
            OrderExchange.tenant_id == current_user.tenant_id,
            OrderExchange.adjustment_type == "CASH_REFUNDED"
        )
    )
    if branch_id:
        exc_query = exc_query.where(OrderExchange.branch_id == branch_id)
    exc_res = await db.execute(exc_query)
    exchanges = [ex for ex in exc_res.scalars().all() if ex.created_at.strftime("%Y-%m") == target_month]
    returns_refunded = sum(ex.adjustment_amount for ex in exchanges)

    net_revenue = max(0.0, gross_sales - returns_refunded)
    gross_profit = round(net_revenue - cogs_total, 2)
    gross_profit_margin_pct = round((gross_profit / net_revenue) * 100, 1) if net_revenue > 0 else 0.0

    # 4. Staff & Payroll Costs
    staff_query = (
        select(User)
        .options(selectinload(User.profile))
        .where(
            User.tenant_id == current_user.tenant_id,
            User.is_active == True,
            User.role != "SUPER_ADMIN"
        )
    )
    if branch_id:
        staff_query = staff_query.where(User.branch_id == branch_id)
    staff_res = await db.execute(staff_query)
    staff_list = staff_res.scalars().all()

    total_base_salaries = sum((s.profile.base_salary if s.profile else 0.0) or 0.0 for s in staff_list)

    # Realized Commissions & Bonuses for this month
    comm_query = (
        select(CommissionRecord)
        .where(
            CommissionRecord.tenant_id == current_user.tenant_id,
            CommissionRecord.month_year == target_month
        )
    )
    if branch_id:
        comm_query = comm_query.where(CommissionRecord.branch_id == branch_id)
    comm_res = await db.execute(comm_query)
    comm_records = comm_res.scalars().all()
    total_commissions = sum(c.commission_amount for c in comm_records)

    # Monthly targets bonuses
    tgt_query = (
        select(MonthlyTarget)
        .where(
            MonthlyTarget.tenant_id == current_user.tenant_id,
            MonthlyTarget.month_year == target_month
        )
    )
    tgt_res = await db.execute(tgt_query)
    all_targets = tgt_res.scalars().all()
    
    # Calculate bonus per staff
    staff_payroll_breakdown = []
    total_bonuses = 0.0

    for s in staff_list:
        s_base = (s.profile.base_salary if s.profile else 0.0) or 0.0
        s_comms = sum(c.commission_amount for c in comm_records if c.salesman_id == s.id)
        
        # Check targets
        s_target = next((t for t in all_targets if t.user_id == s.id), None)
        s_sales = sum(o.total_amount for o in month_orders if o.salesman_id == s.id)
        s_bonus = 0.0
        if s_target and s_sales >= s_target.target_amount:
            s_bonus = s_target.bonus_on_achieve or 0.0
            total_bonuses += s_bonus

        staff_payroll_breakdown.append({
            "employee_id": s.id,
            "name": s.full_name,
            "phone": s.phone or "",
            "role": s.role,
            "base_salary": s_base,
            "commission_earned": round(s_comms, 2),
            "target_bonus": round(s_bonus, 2),
            "total_payout": round(s_base + s_comms + s_bonus, 2)
        })

    total_payroll_cost = round(total_base_salaries + total_commissions + total_bonuses, 2)

    # 5. Categorized Operating Expenses
    exp_query = (
        select(Expense)
        .where(
            Expense.tenant_id == current_user.tenant_id,
            Expense.month_year == target_month
        )
        .order_by(Expense.expense_date.desc())
    )
    if branch_id:
        exp_query = exp_query.where(Expense.branch_id == branch_id)
    exp_res = await db.execute(exp_query)
    expenses = exp_res.scalars().all()

    expense_category_map = {
        "RENT": 0.0,
        "UTILITIES": 0.0,
        "MARKETING": 0.0,
        "PACKAGING": 0.0,
        "LOGISTICS": 0.0,
        "MAINTENANCE": 0.0,
        "ENTERTAINMENT": 0.0,
        "MISC": 0.0
    }
    expenses_list = []
    for e in expenses:
        cat = e.category.upper() if e.category else "MISC"
        expense_category_map[cat] = expense_category_map.get(cat, 0.0) + e.amount
        expenses_list.append({
            "id": e.id,
            "title": e.title,
            "category": e.category,
            "amount": e.amount,
            "expense_date": e.expense_date.strftime("%Y-%m-%d") if e.expense_date else "",
            "month_year": e.month_year,
            "payment_method": e.payment_method,
            "receipt_voucher_no": e.receipt_voucher_no or "",
            "paid_to": e.paid_to or "",
            "notes": e.notes or ""
        })

    total_recorded_expenses = sum(e.amount for e in expenses)

    # 6. Total Costing & Net Profit
    total_opex = round(total_payroll_cost + total_recorded_expenses, 2)
    total_business_costing = round(cogs_total + total_opex, 2)
    net_profit = round(net_revenue - total_business_costing, 2)
    net_profit_margin_pct = round((net_profit / net_revenue) * 100, 1) if net_revenue > 0 else 0.0

    # Break-even sales volume required to cover fixed overheads
    break_even_sales = round(total_opex / (gross_profit_margin_pct / 100), 2) if gross_profit_margin_pct > 0 else 0.0

    return {
        "month_year": target_month,
        # Flat properties for direct UI access
        "net_sales_revenue": net_revenue,
        "gross_sales": gross_sales,
        "total_discounts": total_discounts,
        "returns_amount": returns_refunded,
        "returns_count": len(exchanges),
        "completed_orders_count": orders_count,
        "total_cogs": round(cogs_total, 2),
        "gross_profit": gross_profit,
        "gross_profit_margin_pct": gross_profit_margin_pct,
        "total_payroll_cost": total_payroll_cost,
        "total_direct_expenses": round(total_recorded_expenses, 2),
        "total_operating_expenses": total_opex,
        "total_business_costing": total_business_costing,
        "net_operating_profit": net_profit,
        "net_profit_margin_pct": net_profit_margin_pct,
        "break_even_sales_revenue": break_even_sales,
        "category_breakdown": expense_category_map,
        "expenses_list": expenses_list,
        "staff_payroll_breakdown": staff_payroll_breakdown,
        "salesmen_count": len(staff_list),
        "total_base_salaries": total_base_salaries,
        "total_sales_commissions": round(total_commissions, 2),
        "total_target_bonuses": round(total_bonuses, 2),
        # Structured nested objects
        "revenue": {
            "gross_sales": gross_sales,
            "discounts_given": total_discounts,
            "vat_collected": total_vat,
            "returns_refunded": returns_refunded,
            "net_revenue": net_revenue,
            "orders_count": orders_count,
            "items_sold_qty": items_sold_qty,
            "avg_ticket_size": avg_ticket
        },
        "cogs": {
            "cogs_total": cogs_total,
            "gross_profit": gross_profit,
            "gross_profit_margin_pct": gross_profit_margin_pct
        },
        "payroll": {
            "staff_count": len(staff_list),
            "base_salaries": total_base_salaries,
            "commissions_earned": total_commissions,
            "target_bonuses": total_bonuses,
            "total_payroll_cost": total_payroll_cost
        },
        "operating_expenses": {
            "categories": expense_category_map,
            "total_recorded_expenses": total_recorded_expenses,
            "expenses_count": len(expenses)
        },
        "summary": {
            "total_opex": total_opex,
            "total_business_costing": total_business_costing,
            "net_profit": net_profit,
            "net_profit_margin_pct": net_profit_margin_pct,
            "is_profitable": net_profit >= 0,
            "break_even_sales_required": break_even_sales
        }
    }


@router.get("/expenses")
async def list_expenses(
    month_year: Optional[str] = None,
    category: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List recorded monthly expenses with category filters.
    """
    target_month = month_year or dhaka_current_month()
    query = (
        select(Expense)
        .options(selectinload(Expense.branch))
        .where(
            Expense.tenant_id == current_user.tenant_id,
            Expense.month_year == target_month
        )
        .order_by(Expense.expense_date.desc())
    )
    if category:
        query = query.where(Expense.category == category.upper())
    if branch_id:
        query = query.where(Expense.branch_id == branch_id)

    res = await db.execute(query)
    expenses = res.scalars().all()

    output = []
    for e in expenses:
        output.append({
            "id": e.id,
            "title": e.title,
            "category": e.category,
            "amount": e.amount,
            "expense_date": e.expense_date.strftime("%Y-%m-%d") if e.expense_date else "",
            "month_year": e.month_year,
            "payment_method": e.payment_method,
            "paid_to": e.paid_to,
            "receipt_voucher_no": e.receipt_voucher_no,
            "notes": e.notes,
            "branch_name": e.branch.name if e.branch else "All Outlets / HQ",
            "created_at": e.created_at.strftime("%Y-%m-%d %I:%M %p") if e.created_at else ""
        })

    total_amount = sum(e["amount"] for e in output)
    return {
        "month_year": target_month,
        "total_amount": total_amount,
        "count": len(output),
        "expenses": output
    }


@router.post("/expenses")
async def create_expense(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Records a new business expense (Rent, Electricity, Marketing, Packaging, Logistics, etc.).
    """
    title = req.get("title")
    amount = float(req.get("amount", 0.0))
    category = req.get("category", "MISC").upper()
    month_year = req.get("month_year") or dhaka_current_month()
    payment_method = req.get("payment_method", "CASH")
    paid_to = req.get("paid_to", "")
    receipt_voucher_no = req.get("receipt_voucher_no", "")
    notes = req.get("notes", "")
    branch_id = req.get("branch_id") or current_user.branch_id

    if not title or amount <= 0:
        raise HTTPException(status_code=400, detail="Expense title and valid positive amount are required")

    if not receipt_voucher_no:
        receipt_voucher_no = f"EXP-{month_year.replace('-', '')}-{random.randint(1000, 9999)}"

    expense_date_str = req.get("expense_date")
    try:
        expense_date = datetime.strptime(expense_date_str, "%Y-%m-%d") if expense_date_str else datetime.utcnow()
    except Exception:
        expense_date = datetime.utcnow()

    new_exp = Expense(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        title=title.strip(),
        amount=amount,
        category=category,
        month_year=month_year,
        expense_date=expense_date,
        payment_method=payment_method,
        paid_to=paid_to.strip() if paid_to else None,
        receipt_voucher_no=receipt_voucher_no,
        notes=notes.strip() if notes else None,
        created_by_user_id=current_user.id
    )
    db.add(new_exp)
    await db.commit()
    await db.refresh(new_exp)

    return {
        "success": True,
        "message": f"Expense '{title}' of ৳{amount} recorded successfully! Voucher #{receipt_voucher_no}",
        "expense_id": new_exp.id,
        "voucher_no": receipt_voucher_no
    }


@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes an expense entry.
    """
    res = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.tenant_id == current_user.tenant_id)
    )
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense record not found")

    await db.delete(exp)
    await db.commit()
    return {"success": True, "message": "Expense record deleted successfully"}


@router.get("/salary-sheet")
async def get_monthly_salary_sheet(
    month_year: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    1-Click Dynamic Monthly Salary Sheet Engine.
    Aggregates Base Salary, Attendance Days & Deductions, Sales Commissions,
    Target Bonuses, Custom Allowances, and Disbursement Status per staff member.
    """
    target_month = month_year or dhaka_current_month()  # e.g. "2026-10"

    # 1. Fetch Active Staff
    staff_query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(
            User.tenant_id == current_user.tenant_id,
            User.is_active == True,
            User.role != "SUPER_ADMIN"
        )
        .order_by(User.full_name.asc())
    )
    if branch_id:
        staff_query = staff_query.where(User.branch_id == branch_id)
    
    staff_res = await db.execute(staff_query)
    staff_list = staff_res.scalars().all()

    # 2. Fetch Attendance Policy for Late Deductions
    pol_res = await db.execute(
        select(AttendancePolicy).where(AttendancePolicy.tenant_id == current_user.tenant_id)
    )
    policy = pol_res.scalar_one_or_none()
    penalty_per_late = policy.penalty_deduction_amount if (policy and policy.late_penalty_type == "INCENTIVE_DEDUCTION") else 0.0

    # 3. Fetch Monthly Targets
    tgt_res = await db.execute(
        select(MonthlyTarget).where(
            MonthlyTarget.tenant_id == current_user.tenant_id,
            MonthlyTarget.month_year == target_month
        )
    )
    all_targets = tgt_res.scalars().all()

    # 4. Fetch Completed Orders for Salesmen in this month
    ord_res = await db.execute(
        select(Order).where(
            Order.tenant_id == current_user.tenant_id,
            Order.status == "COMPLETED"
        )
    )
    all_orders = ord_res.scalars().all()
    month_orders = [o for o in all_orders if o.created_at.strftime("%Y-%m") == target_month]

    # 5. Fetch Commission Records
    comm_res = await db.execute(
        select(CommissionRecord).where(
            CommissionRecord.tenant_id == current_user.tenant_id,
            CommissionRecord.month_year == target_month
        )
    )
    all_comms = comm_res.scalars().all()

    # 6. Fetch Existing Payroll Disbursement Records for this month
    pay_res = await db.execute(
        select(PayrollDisbursement).where(
            PayrollDisbursement.tenant_id == current_user.tenant_id,
            PayrollDisbursement.month_year == target_month
        )
    )
    existing_payrolls = {p.user_id: p for p in pay_res.scalars().all()}

    # 7. Fetch Attendance Records for this month
    att_res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == current_user.tenant_id
        )
    )
    all_atts = att_res.scalars().all()
    month_atts = [a for a in all_atts if (a.date_str and a.date_str.startswith(target_month))]

    # Build individual employee salary lines
    sheet_entries = []
    total_base_sum = 0.0
    total_comm_sum = 0.0
    total_bonus_sum = 0.0
    total_allowance_sum = 0.0
    total_deduction_sum = 0.0
    total_net_sum = 0.0
    paid_count = 0
    unpaid_count = 0

    total_days_in_month = 30

    for s in staff_list:
        base_salary = float(s.profile.base_salary if s.profile else 0.0) or 0.0
        designation = s.profile.designation if s.profile else (s.role.replace('_', ' ').title())
        shift = s.profile.shift if s.profile else "General"
        department = s.profile.department if s.profile else "Showroom"
        branch_name = s.branch.name if s.branch else "Head Office / All"

        # Attendance calculation
        user_atts = [a for a in month_atts if a.user_id == s.id]
        present_count = len([a for a in user_atts if a.status in ["ON_TIME", "LATE", "HALF_DAY"]])
        late_count = len([a for a in user_atts if a.status == "LATE"])
        absent_count = max(0, total_days_in_month - present_count)
        
        # Calculate attendance penalty
        att_deduction = round(late_count * penalty_per_late, 2)

        # Sales commission
        user_comms = sum(c.commission_amount for c in all_comms if c.salesman_id == s.id)

        # Target Bonus
        s_target = next((t for t in all_targets if t.user_id == s.id), None)
        s_sales = sum(o.total_amount for o in month_orders if o.salesman_id == s.id)
        target_amount = s_target.target_amount if s_target else 0.0
        target_bonus = 0.0
        is_target_achieved = False
        if s_target and target_amount > 0 and s_sales >= target_amount:
            target_bonus = s_target.bonus_on_achieve or 0.0
            is_target_achieved = True

        # Existing record check
        p_record = existing_payrolls.get(s.id)
        other_allowance = p_record.other_allowance if p_record else 0.0
        advance_deduction = p_record.advance_deduction if p_record else 0.0
        payment_status = p_record.payment_status if p_record else "UNPAID"
        payment_method = p_record.payment_method if p_record else "CASH"
        disbursed_at = p_record.disbursed_at.strftime("%Y-%m-%d %I:%M %p") if (p_record and p_record.disbursed_at) else None
        transaction_ref = p_record.transaction_reference if p_record else None
        notes = p_record.notes if p_record else ""

        # Total deductions & Net Payable
        total_emp_deductions = round(att_deduction + advance_deduction, 2)
        gross_earnings = round(base_salary + user_comms + target_bonus + other_allowance, 2)
        net_payable = max(0.0, round(gross_earnings - total_emp_deductions, 2))

        if payment_status == "PAID":
            paid_count += 1
        else:
            unpaid_count += 1

        total_base_sum += base_salary
        total_comm_sum += user_comms
        total_bonus_sum += target_bonus
        total_allowance_sum += other_allowance
        total_deduction_sum += total_emp_deductions
        total_net_sum += net_payable

        sheet_entries.append({
            "employee_id": s.id,
            "employee_code": s.employee_code,
            "name": s.full_name,
            "email": s.email,
            "phone": s.phone or "",
            "role": s.role,
            "designation": designation,
            "department": department,
            "shift": shift,
            "branch_id": s.branch_id,
            "branch_name": branch_name,
            # Attendance Stats
            "total_working_days": total_days_in_month,
            "present_days": present_count,
            "late_days": late_count,
            "absent_days": absent_count,
            "attendance_deduction": att_deduction,
            # Sales Stats
            "monthly_sales_achieved": round(s_sales, 2),
            "target_amount": round(target_amount, 2),
            "is_target_achieved": is_target_achieved,
            # Earnings Breakdown
            "base_salary": base_salary,
            "sales_commission": round(user_comms, 2),
            "target_bonus": round(target_bonus, 2),
            "other_allowance": round(other_allowance, 2),
            "advance_deduction": round(advance_deduction, 2),
            "total_deductions": total_emp_deductions,
            "gross_earnings": gross_earnings,
            "net_payable": net_payable,
            # Disbursement Info
            "payment_status": payment_status,
            "payment_method": payment_method,
            "disbursed_at": disbursed_at,
            "transaction_reference": transaction_ref,
            "notes": notes,
            "payroll_id": p_record.id if p_record else None
        })

    return {
        "month_year": target_month,
        "tenant_name": current_user.tenant.name if current_user.tenant else "Store",
        "currency": "BDT",
        "summary": {
            "total_staff_count": len(staff_list),
            "paid_count": paid_count,
            "unpaid_count": unpaid_count,
            "total_base_salaries": round(total_base_sum, 2),
            "total_commissions": round(total_comm_sum, 2),
            "total_target_bonuses": round(total_bonus_sum, 2),
            "total_allowances": round(total_allowance_sum, 2),
            "total_deductions": round(total_deduction_sum, 2),
            "total_net_payroll": round(total_net_sum, 2)
        },
        "salary_sheet": sheet_entries
    }


@router.post("/salary-sheet/disburse")
async def disburse_salaries(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    1-Click Salary Disbursement API.
    Can disburse individual staff salary or batch 'Disburse All Staff' in 1-Click.
    Automatically creates/updates PayrollDisbursement records and logs an Expense voucher
    into the Tenant Expense Ledger for seamless P&L and financial accounting!
    """
    month_year = payload.get("month_year") or dhaka_current_month()
    payment_method = payload.get("payment_method", "CASH").upper()
    disburse_all = payload.get("disburse_all", False)
    single_employee_id = payload.get("employee_id")
    allowance_adjust = float(payload.get("other_allowance", 0.0))
    advance_adjust = float(payload.get("advance_deduction", 0.0))
    notes = payload.get("notes", "")

    # Target staff list to disburse
    if disburse_all:
        staff_res = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(
                User.tenant_id == current_user.tenant_id,
                User.is_active == True,
                User.role != "SUPER_ADMIN"
            )
        )
        staff_to_process = staff_res.scalars().all()
    elif single_employee_id:
        staff_res = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(
                User.id == single_employee_id,
                User.tenant_id == current_user.tenant_id
            )
        )
        staff_obj = staff_res.scalar_one_or_none()
        if not staff_obj:
            raise HTTPException(status_code=404, detail="Employee not found")
        staff_to_process = [staff_obj]
    else:
        raise HTTPException(status_code=400, detail="Please specify employee_id or disburse_all=True")

    # Fetch Commissions for month
    comm_res = await db.execute(
        select(CommissionRecord).where(
            CommissionRecord.tenant_id == current_user.tenant_id,
            CommissionRecord.month_year == month_year
        )
    )
    all_comms = comm_res.scalars().all()

    # Fetch Monthly Targets for month
    tgt_res = await db.execute(
        select(MonthlyTarget).where(
            MonthlyTarget.tenant_id == current_user.tenant_id,
            MonthlyTarget.month_year == month_year
        )
    )
    all_targets = tgt_res.scalars().all()

    # Fetch month orders
    ord_res = await db.execute(
        select(Order).where(
            Order.tenant_id == current_user.tenant_id,
            Order.status == "COMPLETED"
        )
    )
    month_orders = [o for o in ord_res.scalars().all() if o.created_at.strftime("%Y-%m") == month_year]

    # Fetch existing payroll disbursements
    p_res = await db.execute(
        select(PayrollDisbursement).where(
            PayrollDisbursement.tenant_id == current_user.tenant_id,
            PayrollDisbursement.month_year == month_year
        )
    )
    existing_records = {p.user_id: p for p in p_res.scalars().all()}

    processed_count = 0
    total_disbursed_bdt = 0.0

    for s in staff_to_process:
        base_salary = float(s.profile.base_salary if s.profile else 0.0) or 0.0
        comms = sum(c.commission_amount for c in all_comms if c.salesman_id == s.id)
        
        # Target Bonus
        s_target = next((t for t in all_targets if t.user_id == s.id), None)
        s_sales = sum(o.total_amount for o in month_orders if o.salesman_id == s.id)
        bonus = 0.0
        if s_target and s_target.target_amount > 0 and s_sales >= s_target.target_amount:
            bonus = s_target.bonus_on_achieve or 0.0

        p_record = existing_records.get(s.id)
        allowance = allowance_adjust if single_employee_id else (p_record.other_allowance if p_record else 0.0)
        advance = advance_adjust if single_employee_id else (p_record.advance_deduction if p_record else 0.0)
        
        net_pay = max(0.0, round(base_salary + comms + bonus + allowance - advance, 2))

        # Skip if already paid in disburse_all mode
        if disburse_all and p_record and p_record.payment_status == "PAID":
            continue

        voucher_no = f"SAL-{month_year.replace('-', '')}-{random.randint(1000, 9999)}"

        if p_record:
            p_record.base_salary = base_salary
            p_record.sales_commission = comms
            p_record.target_bonus = bonus
            p_record.other_allowance = allowance
            p_record.advance_deduction = advance
            p_record.net_payable = net_pay
            p_record.payment_status = "PAID"
            p_record.payment_method = payment_method
            p_record.disbursed_at = datetime.utcnow()
            p_record.disbursed_by_user_id = current_user.id
            p_record.transaction_reference = voucher_no
            if notes:
                p_record.notes = notes
        else:
            new_payroll = PayrollDisbursement(
                tenant_id=current_user.tenant_id,
                branch_id=s.branch_id,
                user_id=s.id,
                month_year=month_year,
                base_salary=base_salary,
                sales_commission=comms,
                target_bonus=bonus,
                other_allowance=allowance,
                advance_deduction=advance,
                net_payable=net_pay,
                payment_status="PAID",
                payment_method=payment_method,
                transaction_reference=voucher_no,
                disbursed_at=datetime.utcnow(),
                disbursed_by_user_id=current_user.id,
                notes=notes
            )
            db.add(new_payroll)

        # Automatically log an Expense voucher in tenant's expense table
        auto_expense = Expense(
            tenant_id=current_user.tenant_id,
            branch_id=s.branch_id,
            title=f"Salary Payout ({month_year}) — {s.full_name} ({s.role})",
            amount=net_pay,
            category="PAYROLL",
            month_year=month_year,
            expense_date=datetime.utcnow(),
            payment_method=payment_method,
            paid_to=s.full_name,
            receipt_voucher_no=voucher_no,
            notes=f"Auto-generated salary disbursement. Base: ৳{base_salary}, Comm: ৳{comms}, Bonus: ৳{bonus}",
            created_by_user_id=current_user.id
        )
        db.add(auto_expense)

        processed_count += 1
        total_disbursed_bdt += net_pay

    await db.commit()

    return {
        "success": True,
        "message": f"Successfully disbursed salary for {processed_count} staff member(s). Total: ৳{total_disbursed_bdt:,.2f}",
        "month_year": month_year,
        "disbursed_count": processed_count,
        "total_amount_disbursed": total_disbursed_bdt
    }

