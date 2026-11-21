import datetime
import random
import string
import json
import urllib.parse
import urllib.request
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.barcode import generate_barcode_base64
from app.core.time_utils import dhaka_now, dhaka_now_naive, dhaka_today_str, dhaka_current_month
from app.models.user import User
from app.models.product import ProductVariant, InventoryStock, Product
from app.models.incentive import IncentiveRule, CommissionRecord
from app.models.order import Order, OrderItem, PaymentRecord, Customer, CustomerDuePayment, OrderExchange, RegisterSession
from app.models.tenant import Branch, Tenant
from app.schemas import (
    OrderCreateRequest, OrderOut, OrderItemOut, VariantOut,
    CustomerCreate, CustomerOut
)

router = APIRouter(prefix="/pos", tags=["Point of Sale (POS)"])

@router.get("/customers/search", response_model=List[CustomerOut])
async def search_customers(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search customer suggestions by Phone, Email, or Name for Loyalty program.
    """
    search_pattern = f"%{q.strip()}%"
    query = (
        select(Customer)
        .where(
            Customer.tenant_id == current_user.tenant_id,
            (Customer.phone.ilike(search_pattern)) | 
            (Customer.email.ilike(search_pattern)) | 
            (Customer.name.ilike(search_pattern))
        )
        .limit(10)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/customers", response_model=CustomerOut)
async def create_or_get_customer(
    req: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates new customer or returns existing if phone matches.
    """
    phone_clean = req.phone.strip()
    query = select(Customer).where(
        Customer.tenant_id == current_user.tenant_id,
        Customer.phone == phone_clean
    )
    res = await db.execute(query)
    existing = res.scalar_one_or_none()
    
    if existing:
        if req.name and req.name != "Walk-in Customer":
            existing.name = req.name
        if req.email:
            existing.email = req.email
        if req.address:
            existing.address = req.address
        await db.commit()
        await db.refresh(existing)
        return existing

    new_cust = Customer(
        tenant_id=current_user.tenant_id,
        name=req.name.strip() or "Walk-in Customer",
        phone=phone_clean,
        email=req.email.strip() if req.email else None,
        address=req.address.strip() if req.address else None,
        loyalty_points=10, # Welcome bonus points
        store_credit_balance=0.0,
        total_spent=0.0
    )
    db.add(new_cust)
    await db.commit()
    await db.refresh(new_cust)
    return new_cust


@router.get("/scan/{barcode_str}")
async def fast_barcode_scan(
    barcode_str: str,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sub-millisecond barcode lookup for laser gun scanners and mobile camera.
    Returns product details, size, color, pricing, and live showroom stock.
    """
    target_branch_id = branch_id or current_user.branch_id
    clean_str = barcode_str.strip()
    
    query = (
        select(ProductVariant)
        .options(
            selectinload(ProductVariant.product),
            selectinload(ProductVariant.stocks).selectinload(InventoryStock.branch)
        )
        .where(
            ProductVariant.tenant_id == current_user.tenant_id,
            (ProductVariant.barcode == clean_str) | 
            (ProductVariant.sku.ilike(clean_str)),
            ProductVariant.is_active == True
        )
    )
    result = await db.execute(query)
    variant = result.scalars().first()

    # If still not found, try searching inside product name + size
    if not variant:
        alt_query = (
            select(ProductVariant)
            .join(Product, ProductVariant.product_id == Product.id)
            .options(
                selectinload(ProductVariant.product),
                selectinload(ProductVariant.stocks).selectinload(InventoryStock.branch)
            )
            .where(
                ProductVariant.tenant_id == current_user.tenant_id,
                ProductVariant.is_active == True,
                (Product.name.ilike(f"%{clean_str}%")) | (ProductVariant.sku.ilike(f"%{clean_str}%"))
            )
        )
        alt_res = await db.execute(alt_query)
        variant = alt_res.scalars().first()

    if not variant:
        raise HTTPException(status_code=404, detail=f"Item with Barcode/SKU '{clean_str}' not found")

    # Find stock for the current branch
    current_stock = 0
    other_branches_stock = []
    for s in variant.stocks:
        if s.branch_id == target_branch_id:
            current_stock = s.quantity
        else:
            other_branches_stock.append({
                "branch_name": s.branch.name,
                "branch_code": s.branch.code,
                "quantity": s.quantity
            })

    return {
        "variant_id": variant.id,
        "product_id": variant.product_id,
        "product_name": variant.product.name,
        "sku": variant.sku,
        "barcode": variant.barcode,
        "size": variant.size,
        "color": variant.color,
        "selling_price": variant.selling_price,
        "mrp": variant.mrp,
        "cost_price": variant.cost_price,
        "fabric": variant.product.fabric,
        "stock_in_current_branch": current_stock,
        "stock_in_other_branches": other_branches_stock,
        "barcode_base64": generate_barcode_base64(variant.barcode)
    }

@router.post("/orders", response_model=OrderOut)
async def create_pos_sale(
    req: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes instant POS sale:
    - Atomically decrements branch stock
    - Handles Split payments (Cash, bKash, Card)
    - Triggers Salesman Commission/Incentive calculations
    - Creates customer loyalty points
    """
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    branch_id = req.branch_id or current_user.branch_id
    if not branch_id:
        raise HTTPException(status_code=400, detail="Branch ID is required")

    # Generate Unique Invoice Number (e.g. INV-DHK01-20261003-0428)
    branch_result = await db.execute(select(Branch).where(Branch.id == branch_id))
    branch = branch_result.scalar_one_or_none()
    branch_code = branch.code if branch else "POS"
    date_code = dhaka_now().strftime("%Y%m%d")
    random_seq = ''.join(random.choices(string.digits, k=4))
    invoice_no = f"INV-{branch_code}-{date_code}-{random_seq}"

    # Handle Customer (Find or Create)
    customer_id = None
    if req.customer_phone:
        cust_query = select(Customer).where(
            Customer.tenant_id == current_user.tenant_id,
            Customer.phone == req.customer_phone.strip()
        )
        c_res = await db.execute(cust_query)
        customer = c_res.scalar_one_or_none()
        if not customer:
            customer = Customer(
                tenant_id=current_user.tenant_id,
                name=req.customer_name or "Walk-in Customer",
                phone=req.customer_phone.strip()
            )
            db.add(customer)
            await db.flush()
        customer_id = customer.id

    # Calculate Subtotal & Order Items
    subtotal = 0.0
    order_items = []
    
    for item in req.items:
        # Fetch variant and lock stock
        v_query = (
            select(ProductVariant)
            .options(selectinload(ProductVariant.product))
            .where(ProductVariant.id == item.variant_id)
        )
        v_res = await db.execute(v_query)
        variant = v_res.scalar_one_or_none()

        # Fallback to lookup by barcode if id mismatch
        if not variant and item.barcode:
            v_query_bc = (
                select(ProductVariant)
                .options(selectinload(ProductVariant.product))
                .where(
                    ProductVariant.tenant_id == current_user.tenant_id,
                    ProductVariant.barcode == item.barcode
                )
            )
            v_res_bc = await db.execute(v_query_bc)
            variant = v_res_bc.scalar_one_or_none()

        # Fallback to lookup by sku if id mismatch
        if not variant and item.sku:
            v_query_sku = (
                select(ProductVariant)
                .options(selectinload(ProductVariant.product))
                .where(
                    ProductVariant.tenant_id == current_user.tenant_id,
                    ProductVariant.sku == item.sku
                )
            )
            v_res_sku = await db.execute(v_query_sku)
            variant = v_res_sku.scalar_one_or_none()

        if not variant:
            raise HTTPException(status_code=404, detail=f"Variant {item.variant_id} not found")

        item_total = (item.unit_price * item.quantity) - item.discount
        subtotal += item_total

        order_item = OrderItem(
            variant_id=variant.id,
            product_name=variant.product.name,
            size=variant.size,
            color=variant.color,
            sku=variant.sku,
            barcode=variant.barcode,
            unit_price=item.unit_price,
            cost_price=variant.cost_price,
            quantity=item.quantity,
            discount=item.discount,
            total=item_total
        )
        order_items.append(order_item)

        # Decrement Stock if not parked
        if not req.is_parked:
            stock_query = select(InventoryStock).where(
                InventoryStock.branch_id == branch_id,
                InventoryStock.variant_id == variant.id
            )
            s_res = await db.execute(stock_query)
            stock = s_res.scalar_one_or_none()
            if stock:
                stock.quantity = max(0, stock.quantity - item.quantity)
            else:
                stock = InventoryStock(
                    tenant_id=current_user.tenant_id,
                    branch_id=branch_id,
                    variant_id=variant.id,
                    quantity=0
                )
                db.add(stock)

    total_amount = max(0.0, subtotal - req.discount_amount + req.tax_vat_amount)
    
    # Calculate Total Paid Amount from Payments
    total_paid = sum(p.amount for p in req.payments if p.payment_method.upper() != "DUE")
    due_from_payments = sum(p.amount for p in req.payments if p.payment_method.upper() == "DUE")
    due_amount = max(0.0, total_amount - total_paid)
    if due_from_payments > 0:
        due_amount = max(due_amount, due_from_payments)
    
    change_due = max(0.0, total_paid - total_amount) if due_amount == 0 else 0.0

    order = Order(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        cashier_id=current_user.id,
        salesman_id=req.salesman_id or current_user.id,
        customer_id=customer_id,
        invoice_number=invoice_no,
        subtotal=subtotal,
        discount_amount=req.discount_amount,
        tax_vat_amount=req.tax_vat_amount,
        total_amount=total_amount,
        paid_amount=total_paid,
        change_due=change_due,
        due_amount=due_amount,
        status="PARKED" if req.is_parked else "COMPLETED",
        held_note=req.parked_note
    )
    db.add(order)
    await db.flush()

    # If customer and due_amount exists on completed order, update customer due_balance
    if customer and due_amount > 0 and not req.is_parked:
        customer.due_balance = (customer.due_balance or 0.0) + due_amount

    # Link Items
    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    # Link Payments
    for p in req.payments:
        pm = PaymentRecord(
            order_id=order.id,
            payment_method=p.payment_method,
            amount=p.amount,
            transaction_ref=p.transaction_ref
        )
        db.add(pm)

    # Calculate Commission for Salesman (if sale is completed and salesman is assigned)
    if not req.is_parked and req.salesman_id:
        salesman_res = await db.execute(
            select(User).options(selectinload(User.profile)).where(User.id == req.salesman_id)
        )
        salesman_user = salesman_res.scalar_one_or_none()
        if salesman_user and salesman_user.profile:
            comm_rate = salesman_user.profile.commission_rate or 2.0
            comm_amount = (total_amount * comm_rate) / 100.0
            
            comm_record = CommissionRecord(
                tenant_id=current_user.tenant_id,
                branch_id=branch_id,
                salesman_id=salesman_user.id,
                order_id=order.id,
                sale_amount=total_amount,
                commission_amount=comm_amount,
                month_year=dhaka_current_month(),
                created_at=dhaka_now_naive()
            )
            db.add(comm_record)
            order.commission_calculated = True
            order.commission_earned = comm_amount

    # Update Customer total spent & loyalty points
    if customer_id and not req.is_parked:
        customer.total_spent += total_amount
        customer.loyalty_points += int(total_amount // 100) # 1 point per 100 BDT spent

    await db.commit()

    # Fetch complete order with details for output
    return await get_order_details(order.id, db)

@router.get("/orders/parked", response_model=List[OrderOut])
async def list_parked_held_orders(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List held carts for quick recall"""
    target_branch_id = branch_id or current_user.branch_id
    query = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.cashier),
            selectinload(Order.salesman),
            selectinload(Order.customer)
        )
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.branch_id == target_branch_id,
            Order.status == "PARKED"
        )
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(query)
    orders = result.scalars().all()
    
    out_list = []
    for o in orders:
        out_list.append(
            OrderOut(
                id=o.id,
                invoice_number=o.invoice_number,
                branch_id=o.branch_id,
                branch_name="",
                cashier_name=o.cashier.full_name if o.cashier else "Cashier",
                salesman_name=o.salesman.full_name if o.salesman else None,
                customer_name=o.customer.name if o.customer else None,
                customer_phone=o.customer.phone if o.customer else None,
                subtotal=o.subtotal,
                discount_amount=o.discount_amount,
                tax_vat_amount=o.tax_vat_amount,
                total_amount=o.total_amount,
                paid_amount=o.paid_amount,
                change_due=o.change_due,
                status=o.status,
                created_at=o.created_at,
                items=[
                    OrderItemOut(
                        id=it.id,
                        product_name=it.product_name,
                        size=it.size,
                        color=it.color,
                        sku=it.sku,
                        barcode=it.barcode,
                        unit_price=it.unit_price,
                        quantity=it.quantity,
                        discount=it.discount,
                        total=it.total
                    ) for it in o.items
                ]
            )
        )
    return out_list

async def get_order_details(order_id: str, db: AsyncSession) -> OrderOut:
    query = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.cashier),
            selectinload(Order.salesman),
            selectinload(Order.customer)
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(query)
    o = result.scalar_one_or_none()
    
    return OrderOut(
        id=o.id,
        invoice_number=o.invoice_number,
        branch_id=o.branch_id,
        branch_name="",
        cashier_name=o.cashier.full_name if o.cashier else "Cashier",
        salesman_name=o.salesman.full_name if o.salesman else None,
        customer_name=o.customer.name if o.customer else None,
        customer_phone=o.customer.phone if o.customer else None,
        subtotal=o.subtotal,
        discount_amount=o.discount_amount,
        tax_vat_amount=o.tax_vat_amount,
        total_amount=o.total_amount,
        paid_amount=o.paid_amount,
        change_due=o.change_due,
        status=o.status,
        created_at=o.created_at,
        items=[
            OrderItemOut(
                id=it.id,
                product_name=it.product_name,
                size=it.size,
                color=it.color,
                sku=it.sku,
                barcode=it.barcode,
                unit_price=it.unit_price,
                quantity=it.quantity,
                discount=it.discount,
                total=it.total
            ) for it in o.items
        ]
    )

@router.get("/shift-summary")
async def get_cashier_shift_summary(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns live Cashier Shift Status:
    - Today's Cash collected in drawer
    - Today's Card collected
    - Today's MFS (bKash/Nagad) collected
    - Total invoices generated by this cashier / branch today
    - Recent transactions with reprint ability
    """
    target_branch = branch_id or current_user.branch_id
    today_str = dhaka_today_str()
    
    # Query today's completed orders
    query = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payments),
            selectinload(Order.cashier),
            selectinload(Order.salesman),
            selectinload(Order.customer)
        )
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.status == "COMPLETED"
        )
    )
    if target_branch:
        query = query.where(Order.branch_id == target_branch)
    if current_user.role == "CASHIER":
        query = query.where(Order.cashier_id == current_user.id)
        
    res = await db.execute(query.order_by(Order.created_at.desc()))
    all_orders = res.scalars().all()
    
    today_orders = [
        o for o in all_orders 
        if o.created_at and o.created_at.strftime("%Y-%m-%d") == today_str
    ]
    
    total_sales = 0.0
    cash_total = 0.0
    card_total = 0.0
    mfs_total = 0.0
    
    for o in today_orders:
        total_sales += (o.total_amount or 0.0)
        for p in o.payments:
            if p.payment_method == "CASH":
                cash_total += (p.amount or 0.0)
            elif p.payment_method == "CARD":
                card_total += (p.amount or 0.0)
            elif p.payment_method in ["BKASH", "NAGAD", "MFS"]:
                mfs_total += (p.amount or 0.0)
                
    recent_list = []
    for o in today_orders[:15]:
        recent_list.append({
            "id": o.id,
            "invoice_number": o.invoice_number,
            "customer_name": o.customer.name if o.customer else "Walk-in",
            "customer_phone": o.customer.phone if o.customer else "",
            "total_amount": o.total_amount,
            "items_count": len(o.items),
            "payment_methods": [p.payment_method for p in o.payments],
            "salesman_name": o.salesman.full_name if o.salesman else None,
            "created_at": o.created_at.isoformat() if o.created_at else None
        })
        
    return {
        "date_str": today_str,
        "cashier_name": current_user.full_name,
        "employee_code": current_user.employee_code,
        "today_invoices_count": len(today_orders),
        "today_total_sales": total_sales,
        "cash_in_drawer": cash_total,
        "card_collected": card_total,
        "mfs_collected": mfs_total,
        "recent_invoices": recent_list
    }


def clean_phone_for_whatsapp(raw_phone: str, default_country_code: str = "880") -> str:
    """Cleans and standardizes Bangladeshi and international phone numbers for WhatsApp"""
    if not raw_phone:
        return ""
    digits = "".join(ch for ch in str(raw_phone) if ch.isdigit())
    if not digits:
        return ""
    # If standard BD 11-digit mobile starting with 01 (e.g. 01711223344)
    if digits.startswith("01") and len(digits) == 11:
        return "880" + digits[1:]
    if digits.startswith("880") and len(digits) >= 13:
        return digits
    if len(digits) == 10 and default_country_code:
        return default_country_code + digits
    return digits


def build_whatsapp_receipt_text(order: Order, tenant: Tenant, branch: Optional[Branch] = None) -> str:
    """Generates an aesthetic, markdown-formatted WhatsApp digital receipt"""
    t_settings = tenant.settings or {}
    store_title = t_settings.get("receipt_header") or tenant.name or "VOGUE LIFESTYLE"
    tagline = t_settings.get("receipt_tagline") or (branch.name if branch else "Exclusive Fashion & Apparel")
    address = t_settings.get("receipt_address") or (branch.address if branch else "")
    phone = t_settings.get("receipt_phone") or (branch.phone if branch else tenant.phone or "")
    vat_no = t_settings.get("receipt_vat_no") or ""
    exchange_policy = t_settings.get("receipt_exchange_policy") or "*** 7 DAYS EXCHANGE WITH MONEY RECEIPT ***"
    footer_note = t_settings.get("receipt_footer_note") or "Thank you for shopping with us! Please visit again."

    created_time_str = order.created_at.strftime("%d %b %Y, %I:%M %p") if order.created_at else "Today"
    customer_name = order.customer.name if order.customer else "Valued Customer"

    lines = [
        f"🧾 *{store_title.upper()}*",
        f"_{tagline}_" if tagline else "",
        f"📍 {address}" if address else "",
        f"📞 {phone}" if phone else "",
        f"🏷️ {vat_no}" if vat_no else "",
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"👤 *Customer:* {customer_name}",
        f"📄 *Invoice #:* `{order.invoice_number}`",
        f"🗓️ *Date:* {created_time_str}",
        f"🏢 *Showroom:* {branch.name if branch else 'Main Store'}",
        f"👔 *Salesperson:* {order.salesman.full_name if order.salesman else 'Staff'}",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "*ITEMS PURCHASED:*",
    ]

    for idx, item in enumerate(order.items, start=1):
        variant_desc = f"{item.product_name}"
        attributes = []
        if item.size:
            attributes.append(f"Size: {item.size}")
        if item.color:
            attributes.append(f"Color: {item.color}")
        if attributes:
            variant_desc += f" ({', '.join(attributes)})"

        lines.append(f"*{idx}. {variant_desc}*")
        lines.append(f"   {item.quantity} pcs × ৳{item.unit_price:,.0f} = *৳{item.total:,.0f}*")

    lines.extend([
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"Subtotal: ৳{order.subtotal:,.0f}",
    ])

    if order.discount_amount and order.discount_amount > 0:
        lines.append(f"Discount: -৳{order.discount_amount:,.0f}")
    if order.tax_vat_amount and order.tax_vat_amount > 0:
        lines.append(f"VAT / Tax: +৳{order.tax_vat_amount:,.0f}")

    lines.extend([
        f"💰 *NET TOTAL: ৳{order.total_amount:,.0f}*",
        f"💵 Total Paid: ৳{order.paid_amount:,.0f}",
    ])

    if order.change_due and order.change_due > 0:
        lines.append(f"🔄 Change Return: ৳{order.change_due:,.0f}")

    # Payment Methods Breakdown
    if order.payments:
        pm_strs = [f"{p.payment_method}: ৳{p.amount:,.0f}" for p in order.payments]
        lines.append(f"💳 Payment Mode: {', '.join(pm_strs)}")

    # Loyalty Balance
    if order.customer and order.customer.loyalty_points is not None:
        lines.append(f"⭐ Loyalty Points Balance: *{order.customer.loyalty_points} pts*")

    lines.extend([
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"📌 *Exchange Policy:* _{exchange_policy}_",
        f"✨ _{footer_note}_"
    ])

    return "\n".join(l for l in lines if l is not None)


@router.post("/orders/{order_id}/whatsapp-bill")
async def send_order_whatsapp_bill(
    order_id: str,
    req: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate and dispatch WhatsApp Digital Bill / Invoice for a completed order.
    Uses GitHub OpenWA REST Gateway if configured; otherwise provides instant wa.me link.
    """
    o_res = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.customer),
            selectinload(Order.salesman),
            selectinload(Order.branch),
            selectinload(Order.payments)
        )
        .where(Order.id == order_id, Order.tenant_id == current_user.tenant_id)
    )
    order = o_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    t_res = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = t_res.scalar_one()

    # Determine recipient phone number (from request override, customer record, or prompt)
    override_phone = req.get("phone") if req else None
    target_phone = override_phone or (order.customer.phone if order.customer else "")
    clean_phone = clean_phone_for_whatsapp(target_phone)

    # Generate Formatted Text Bill
    bill_text = build_whatsapp_receipt_text(order, tenant, order.branch)
    encoded_text = urllib.parse.quote(bill_text)
    whatsapp_direct_link = f"https://wa.me/{clean_phone}?text={encoded_text}" if clean_phone else f"https://wa.me/?text={encoded_text}"

    openwa_dispatched = False
    openwa_error = None
    t_settings = tenant.settings or {}
    openwa_server_url = t_settings.get("openwa_server_url", "").strip().rstrip("/")
    openwa_api_key = t_settings.get("openwa_api_key", "").strip()

    # Attempt Automated Dispatch via GitHub OpenWA REST Server if configured
    if openwa_server_url and clean_phone:
        try:
            # Try OpenWA standard REST endpoints
            # Format 1: /api/send-message or /sendText
            target_url = f"{openwa_server_url}/sendText"
            payload = {
                "chatId": f"{clean_phone}@c.us",
                "text": bill_text
            }
            req_data = json.dumps(payload).encode("utf-8")
            http_req = urllib.request.Request(
                target_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "api_key": openwa_api_key,
                    "Authorization": f"Bearer {openwa_api_key}" if openwa_api_key else ""
                },
                method="POST"
            )
            with urllib.request.urlopen(http_req, timeout=5) as response:
                if response.status in [200, 201]:
                    openwa_dispatched = True
        except Exception as e:
            openwa_error = str(e)
            # Try alternate OpenWA endpoint format (/api/send-message)
            try:
                alt_url = f"{openwa_server_url}/api/send-message"
                alt_payload = {
                    "phone": clean_phone,
                    "message": bill_text
                }
                alt_req_data = json.dumps(alt_payload).encode("utf-8")
                alt_http_req = urllib.request.Request(
                    alt_url,
                    data=alt_req_data,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {openwa_api_key}" if openwa_api_key else ""
                    },
                    method="POST"
                )
                with urllib.request.urlopen(alt_http_req, timeout=5) as alt_resp:
                    if alt_resp.status in [200, 201]:
                        openwa_dispatched = True
                        openwa_error = None
            except Exception as e2:
                openwa_error = str(e2)

    return {
        "success": True,
        "invoice_number": order.invoice_number,
        "customer_phone": clean_phone or target_phone,
        "formatted_text": bill_text,
        "whatsapp_link": whatsapp_direct_link,
        "openwa_dispatched": openwa_dispatched,
        "openwa_server_configured": bool(openwa_server_url),
        "openwa_error": openwa_error
    }


@router.post("/whatsapp-test")
async def test_whatsapp_openwa_connection(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Test connectivity to GitHub OpenWA instance with a ping / sample test message
    """
    server_url = req.get("server_url", "").strip().rstrip("/")
    api_key = req.get("api_key", "").strip()
    test_phone = clean_phone_for_whatsapp(req.get("test_phone", ""))
    test_message = req.get("test_message") or "✅ *OmniFlow POS:* OpenWA WhatsApp Gateway connected successfully!"

    if not server_url:
        raise HTTPException(status_code=400, detail="Please provide OpenWA server endpoint URL (e.g. http://localhost:8080)")

    if not test_phone:
        raise HTTPException(status_code=400, detail="Please enter a valid recipient mobile number for test message")

    try:
        target_url = f"{server_url}/sendText"
        payload = {
            "chatId": f"{test_phone}@c.us",
            "text": test_message
        }
        req_data = json.dumps(payload).encode("utf-8")
        http_req = urllib.request.Request(
            target_url,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "api_key": api_key,
                "Authorization": f"Bearer {api_key}" if api_key else ""
            },
            method="POST"
        )
        with urllib.request.urlopen(http_req, timeout=7) as response:
            resp_body = response.read().decode("utf-8")
            return {
                "success": True,
                "status_code": response.status,
                "message": "Test WhatsApp message sent successfully via OpenWA!",
                "response": resp_body[:200]
            }
    except Exception as err:
        # Try alternate endpoint /api/send-message
        try:
            alt_url = f"{server_url}/api/send-message"
            alt_payload = {
                "phone": test_phone,
                "message": test_message
            }
            alt_data = json.dumps(alt_payload).encode("utf-8")
            alt_req = urllib.request.Request(
                alt_url,
                data=alt_data,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}" if api_key else ""},
                method="POST"
            )
            with urllib.request.urlopen(alt_req, timeout=7) as alt_resp:
                return {
                    "success": True,
                    "status_code": alt_resp.status,
                    "message": "Test WhatsApp message sent successfully via OpenWA API!",
                    "response": alt_resp.read().decode("utf-8")[:200]
                }
        except Exception as alt_err:
            return {
                "success": False,
                "error": f"OpenWA Connection failed: {str(err)} | Alternate endpoint error: {str(alt_err)}",
                "suggestion": "Ensure your OpenWA server (GitHub @open-wa/wa-automate) is running and accessible."
            }


# =========================================================================
# FEATURE 1: QUICK EXCHANGE & RETURN WORKFLOW
# =========================================================================

@router.get("/orders/lookup-exchange")
async def lookup_order_for_exchange(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Looks up order items by invoice number or customer phone for garment exchange.
    """
    clean_q = q.strip()
    query = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product),
            selectinload(Order.customer),
            selectinload(Order.cashier),
            selectinload(Order.salesman)
        )
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.status == "COMPLETED",
            (Order.invoice_number.ilike(f"%{clean_q}%")) |
            (Order.customer.has(Customer.phone.ilike(f"%{clean_q}%")))
        )
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    result = await db.execute(query)
    orders = result.scalars().all()
    
    output = []
    for ord_obj in orders:
        items = []
        for itm in ord_obj.items:
            items.append({
                "item_id": itm.id,
                "variant_id": itm.variant_id,
                "product_name": itm.product_name,
                "size": itm.size,
                "color": itm.color,
                "sku": itm.sku,
                "barcode": itm.barcode,
                "unit_price": itm.unit_price,
                "quantity": itm.quantity,
                "discount": itm.discount,
                "total": itm.total
            })
        output.append({
            "order_id": ord_obj.id,
            "invoice_number": ord_obj.invoice_number,
            "created_at": ord_obj.created_at.strftime("%Y-%m-%d %I:%M %p") if ord_obj.created_at else "",
            "customer_id": ord_obj.customer_id,
            "customer_name": ord_obj.customer.name if ord_obj.customer else "Walk-in Customer",
            "customer_phone": ord_obj.customer.phone if ord_obj.customer else "",
            "subtotal": ord_obj.subtotal,
            "discount_amount": ord_obj.discount_amount,
            "total_amount": ord_obj.total_amount,
            "paid_amount": ord_obj.paid_amount,
            "due_amount": getattr(ord_obj, "due_amount", 0.0) or 0.0,
            "items": items
        })
    return output


@router.post("/orders/process-exchange")
async def process_order_exchange(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Processes garment return/exchange. Restocks returned items, deducts new items,
    and handles price difference (store credit, cash refund, due adjustment, or extra payment).
    """
    original_order_id = req.get("original_order_id")
    return_items = req.get("return_items", []) # [{variant_id, quantity, unit_price, product_name, size, color}]
    new_items = req.get("new_items", []) # [{variant_id, quantity, unit_price, product_name, size, color}]
    adjustment_type = req.get("adjustment_type", "EVEN") # CUSTOMER_PAID, CASH_REFUNDED, STORE_CREDIT, DUE_ADJUSTED, EVEN
    adjustment_amount = float(req.get("adjustment_amount", 0.0))
    payment_method = req.get("payment_method", "CASH")
    notes = req.get("notes", "")
    branch_id = req.get("branch_id") or current_user.branch_id

    if not original_order_id or not return_items:
        raise HTTPException(status_code=400, detail="Original order and return items are required")

    ord_res = await db.execute(
        select(Order)
        .options(selectinload(Order.customer), selectinload(Order.items))
        .where(Order.id == original_order_id, Order.tenant_id == current_user.tenant_id)
    )
    orig_order = ord_res.scalar_one_or_none()
    if not orig_order:
        raise HTTPException(status_code=404, detail="Original order not found")

    # 1. Restock Returned Items
    return_total = 0.0
    for itm in return_items:
        var_id = itm.get("variant_id")
        qty = int(itm.get("quantity", 1))
        unit_p = float(itm.get("unit_price", 0.0))
        return_total += unit_p * qty

        if var_id:
            stk_res = await db.execute(
                select(InventoryStock).where(
                    InventoryStock.branch_id == branch_id,
                    InventoryStock.variant_id == var_id
                )
            )
            stk = stk_res.scalar_one_or_none()
            if stk:
                stk.quantity += qty
            else:
                db.add(InventoryStock(
                    tenant_id=current_user.tenant_id,
                    branch_id=branch_id,
                    variant_id=var_id,
                    quantity=qty
                ))

    # 2. Deduct New Items
    new_total = 0.0
    for itm in new_items:
        var_id = itm.get("variant_id")
        qty = int(itm.get("quantity", 1))
        unit_p = float(itm.get("unit_price", 0.0))
        new_total += unit_p * qty

        if var_id:
            stk_res = await db.execute(
                select(InventoryStock).where(
                    InventoryStock.branch_id == branch_id,
                    InventoryStock.variant_id == var_id
                )
            )
            stk = stk_res.scalar_one_or_none()
            if stk:
                stk.quantity = max(0, stk.quantity - qty)

    price_diff = new_total - return_total

    # 3. Handle Adjustment
    cust = orig_order.customer
    if cust:
        if adjustment_type == "STORE_CREDIT":
            cust.store_credit_balance = (cust.store_credit_balance or 0.0) + adjustment_amount
        elif adjustment_type == "DUE_ADJUSTED":
            cust.due_balance = max(0.0, (cust.due_balance or 0.0) - adjustment_amount)

    exchange_inv = f"EXC-{dhaka_today_str().replace('-', '')}-{random.randint(1000, 9999)}"

    exchange_record = OrderExchange(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        original_order_id=orig_order.id,
        customer_id=orig_order.customer_id,
        cashier_id=current_user.id,
        exchange_invoice_number=exchange_inv,
        return_items=return_items,
        new_items=new_items,
        return_total=return_total,
        new_total=new_total,
        price_difference=price_diff,
        adjustment_type=adjustment_type,
        adjustment_amount=adjustment_amount,
        payment_method=payment_method if adjustment_type == "CUSTOMER_PAID" else None,
        notes=notes,
        created_at=dhaka_now_naive()
    )
    db.add(exchange_record)
    await db.commit()
    await db.refresh(exchange_record)

    return {
        "success": True,
        "message": f"Exchange completed successfully! Slip #{exchange_inv}",
        "exchange_invoice_number": exchange_inv,
        "exchange_id": exchange_record.id,
        "return_total": return_total,
        "new_total": new_total,
        "price_difference": price_diff,
        "adjustment_type": adjustment_type,
        "adjustment_amount": adjustment_amount,
        "customer_name": cust.name if cust else "Walk-in",
        "customer_phone": cust.phone if cust else "",
        "created_at": exchange_record.created_at.strftime("%Y-%m-%d %I:%M %p")
    }


@router.get("/exchanges/history")
async def list_exchange_history(
    branch_id: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns recent return/exchange transactions.
    """
    target_branch = branch_id or current_user.branch_id
    query = (
        select(OrderExchange)
        .options(
            selectinload(OrderExchange.original_order),
            selectinload(OrderExchange.cashier)
        )
        .where(OrderExchange.tenant_id == current_user.tenant_id)
        .order_by(OrderExchange.created_at.desc())
        .limit(limit)
    )
    if target_branch:
        query = query.where(OrderExchange.branch_id == target_branch)

    res = await db.execute(query)
    exchanges = res.scalars().all()

    output = []
    for ex in exchanges:
        output.append({
            "id": ex.id,
            "exchange_invoice_number": ex.exchange_invoice_number,
            "original_invoice": ex.original_order.invoice_number if ex.original_order else "N/A",
            "cashier_name": ex.cashier.full_name if ex.cashier else "Staff",
            "return_items_count": len(ex.return_items or []),
            "new_items_count": len(ex.new_items or []),
            "return_total": ex.return_total,
            "new_total": ex.new_total,
            "price_difference": ex.price_difference,
            "adjustment_type": ex.adjustment_type,
            "adjustment_amount": ex.adjustment_amount,
            "created_at": ex.created_at.strftime("%Y-%m-%d %I:%M %p") if ex.created_at else ""
        })
    return output


# =========================================================================
# FEATURE 2: CUSTOMER DUE LEDGER / KHATA
# =========================================================================

@router.get("/customers/due-ledger")
async def get_customer_due_ledger(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all customers with outstanding due balances and overall due portfolio.
    """
    query = (
        select(Customer)
        .where(
            Customer.tenant_id == current_user.tenant_id,
            Customer.due_balance > 0
        )
        .order_by(Customer.due_balance.desc())
    )
    if search:
        s_pat = f"%{search.strip()}%"
        query = query.where(
            (Customer.name.ilike(s_pat)) | (Customer.phone.ilike(s_pat)) | (Customer.email.ilike(s_pat))
        )

    result = await db.execute(query)
    customers = result.scalars().all()

    total_due = sum(c.due_balance for c in customers)
    debtors_count = len(customers)

    items = []
    for c in customers:
        items.append({
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "address": c.address,
            "due_balance": c.due_balance,
            "total_spent": c.total_spent,
            "loyalty_points": c.loyalty_points,
            "created_at": c.created_at.strftime("%Y-%m-%d") if c.created_at else ""
        })

    return {
        "total_due_receivable": total_due,
        "total_debtors_count": debtors_count,
        "customers": items
    }


@router.post("/customers/{customer_id}/repay-due")
async def repay_customer_due(
    customer_id: str,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Collects debt payment from customer. Reduces due_balance and generates Money Receipt.
    """
    amount = float(req.get("amount", 0.0))
    payment_method = req.get("payment_method", "CASH")
    notes = req.get("notes", "")
    transaction_ref = req.get("transaction_ref", "")
    branch_id = req.get("branch_id") or current_user.branch_id

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Repayment amount must be greater than 0")

    c_res = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.tenant_id == current_user.tenant_id)
    )
    cust = c_res.scalar_one_or_none()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    old_due = cust.due_balance or 0.0
    new_due = max(0.0, old_due - amount)
    cust.due_balance = new_due

    receipt_no = f"MR-DUE-{dhaka_today_str().replace('-', '')}-{random.randint(1000, 9999)}"

    due_pmt = CustomerDuePayment(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        customer_id=cust.id,
        cashier_id=current_user.id,
        receipt_number=receipt_no,
        amount=amount,
        payment_method=payment_method,
        transaction_ref=transaction_ref,
        notes=notes,
        created_at=dhaka_now_naive()
    )
    db.add(due_pmt)
    await db.commit()
    await db.refresh(due_pmt)

    return {
        "success": True,
        "message": f"Payment of ৳{amount} received successfully! Money Receipt #{receipt_no}",
        "receipt_number": receipt_no,
        "paid_amount": amount,
        "previous_due": old_due,
        "remaining_due": new_due,
        "customer_name": cust.name,
        "customer_phone": cust.phone,
        "payment_method": payment_method,
        "created_at": due_pmt.created_at.strftime("%Y-%m-%d %I:%M %p")
    }


@router.get("/customers/{customer_id}/due-history")
async def get_customer_due_history(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns ledger timeline: orders with due and repayment money receipts.
    """
    p_res = await db.execute(
        select(CustomerDuePayment)
        .options(selectinload(CustomerDuePayment.cashier))
        .where(CustomerDuePayment.customer_id == customer_id)
        .order_by(CustomerDuePayment.created_at.desc())
    )
    payments = p_res.scalars().all()

    o_res = await db.execute(
        select(Order)
        .where(Order.customer_id == customer_id, Order.due_amount > 0)
        .order_by(Order.created_at.desc())
    )
    orders = o_res.scalars().all()

    timeline = []
    for o in orders:
        timeline.append({
            "type": "ORDER_DUE",
            "date": o.created_at.strftime("%Y-%m-%d %I:%M %p") if o.created_at else "",
            "ref_number": o.invoice_number,
            "total_amount": o.total_amount,
            "paid_amount": o.paid_amount,
            "due_amount": o.due_amount,
            "description": f"Purchase with partial due (Invoice #{o.invoice_number})"
        })

    for p in payments:
        timeline.append({
            "type": "REPAYMENT",
            "date": p.created_at.strftime("%Y-%m-%d %I:%M %p") if p.created_at else "",
            "ref_number": p.receipt_number,
            "amount": p.amount,
            "payment_method": p.payment_method,
            "cashier_name": p.cashier.full_name if p.cashier else "Staff",
            "description": f"Due Repayment via {p.payment_method} ({p.notes or 'No notes'})"
        })

    # Sort timeline by date
    timeline.sort(key=lambda x: x["date"], reverse=True)

    return timeline


# =========================================================================
# FEATURE 3: DAILY REGISTER DAY-CLOSING & CASH DRAWER Z-REPORT
# =========================================================================

@router.get("/register/current-session")
async def get_current_register_session(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes real-time live day closing statistics and drawer cash totals for today.
    """
    target_branch = branch_id or current_user.branch_id
    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)

    # 1. Fetch Today's Orders
    ord_query = (
        select(Order)
        .options(selectinload(Order.payments))
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.branch_id == target_branch,
            Order.status == "COMPLETED",
            Order.created_at >= today_start
        )
    )
    ord_res = await db.execute(ord_query)
    orders = ord_res.scalars().all()

    total_sales = sum(o.total_amount for o in orders)
    total_discounts = sum(o.discount_amount for o in orders)
    total_tax = sum(o.tax_vat_amount for o in orders)
    orders_count = len(orders)

    total_cash_sales = 0.0
    total_bkash_sales = 0.0
    total_card_sales = 0.0
    total_due_sales = sum(o.due_amount for o in orders)

    for o in orders:
        for p in o.payments:
            pm = p.payment_method.upper()
            if pm == "CASH":
                total_cash_sales += p.amount
            elif pm in ["BKASH", "NAGAD", "ROCKET", "MFS"]:
                total_bkash_sales += p.amount
            elif pm in ["CARD", "VISA", "MASTERCARD", "AMEX"]:
                total_card_sales += p.amount

    # 2. Fetch Due Repayments received in Cash today
    due_res = await db.execute(
        select(CustomerDuePayment).where(
            CustomerDuePayment.tenant_id == current_user.tenant_id,
            CustomerDuePayment.branch_id == target_branch,
            CustomerDuePayment.created_at >= today_start
        )
    )
    due_pmts = due_res.scalars().all()
    due_cash_collected = sum(dp.amount for dp in due_pmts if dp.payment_method.upper() == "CASH")
    due_digital_collected = sum(dp.amount for dp in due_pmts if dp.payment_method.upper() != "CASH")

    # 3. Check for existing open session
    sess_res = await db.execute(
        select(RegisterSession)
        .where(
            RegisterSession.tenant_id == current_user.tenant_id,
            RegisterSession.branch_id == target_branch,
            RegisterSession.status == "OPEN"
        )
        .order_by(RegisterSession.created_at.desc())
    )
    active_session = sess_res.scalars().first()
    opening_cash = active_session.opening_cash if active_session else 0.0

    # 4. Returns / Exchanges with cash refund today
    exc_res = await db.execute(
        select(OrderExchange).where(
            OrderExchange.tenant_id == current_user.tenant_id,
            OrderExchange.branch_id == target_branch,
            OrderExchange.created_at >= today_start,
            OrderExchange.adjustment_type == "CASH_REFUNDED"
        )
    )
    exchanges = exc_res.scalars().all()
    cash_refunds_paid = sum(ex.adjustment_amount for ex in exchanges)

    expected_cash_in_drawer = opening_cash + total_cash_sales + due_cash_collected - cash_refunds_paid

    return {
        "session_id": active_session.id if active_session else None,
        "is_open": active_session is not None,
        "session_code": active_session.session_code if active_session else f"REG-{dhaka_today_str().replace('-', '')}-01",
        "opened_at": active_session.opened_at.strftime("%Y-%m-%d %I:%M %p") if active_session else dhaka_now().strftime("%Y-%m-%d %I:%M %p"),
        "opening_cash": opening_cash,
        "total_sales": total_sales,
        "orders_count": orders_count,
        "total_cash_sales": total_cash_sales,
        "total_bkash_sales": total_bkash_sales,
        "total_card_sales": total_card_sales,
        "total_due_sales": total_due_sales,
        "due_cash_collected": due_cash_collected,
        "due_digital_collected": due_digital_collected,
        "cash_refunds_paid": cash_refunds_paid,
        "total_discounts": total_discounts,
        "total_tax": total_tax,
        "expected_cash_in_drawer": expected_cash_in_drawer
    }


@router.post("/register/open-session")
async def open_register_session(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Opens shift / daily cash drawer with initial float amount (e.g. 5,000 ৳ change).
    """
    branch_id = req.get("branch_id") or current_user.branch_id
    opening_cash = float(req.get("opening_cash", 0.0))
    notes = req.get("notes", "")

    # Check if already open
    sess_res = await db.execute(
        select(RegisterSession).where(
            RegisterSession.tenant_id == current_user.tenant_id,
            RegisterSession.branch_id == branch_id,
            RegisterSession.status == "OPEN"
        )
    )
    existing = sess_res.scalar_one_or_none()
    if existing:
        existing.opening_cash = opening_cash
        existing.notes = notes
        await db.commit()
        return {"success": True, "message": "Register session updated", "session_id": existing.id}

    code = f"REG-{dhaka_today_str().replace('-', '')}-{random.randint(100, 999)}"
    new_sess = RegisterSession(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        cashier_id=current_user.id,
        session_code=code,
        opening_cash=opening_cash,
        status="OPEN",
        notes=notes,
        opened_at=dhaka_now_naive()
    )
    db.add(new_sess)
    await db.commit()
    await db.refresh(new_sess)

    return {"success": True, "message": f"Register session {code} opened with ৳{opening_cash} opening cash", "session_id": new_sess.id}


@router.post("/register/close-session")
async def close_register_session(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits actual cash count in drawer, calculates shortage/overage discrepancy,
    closes session, and generates printable Z-Report.
    """
    branch_id = req.get("branch_id") or current_user.branch_id
    closing_cash_actual = float(req.get("closing_cash_actual", 0.0))
    notes = req.get("notes", "")

    # Compute live stats
    live_data = await get_current_register_session(branch_id=branch_id, current_user=current_user, db=db)
    expected_cash = live_data["expected_cash_in_drawer"]
    discrepancy = closing_cash_actual - expected_cash

    # Find or create session
    sess_id = live_data.get("session_id")
    if sess_id:
        sess_res = await db.execute(select(RegisterSession).where(RegisterSession.id == sess_id))
        sess = sess_res.scalar_one_or_none()
    else:
        sess = RegisterSession(
            tenant_id=current_user.tenant_id,
            branch_id=branch_id,
            cashier_id=current_user.id,
            session_code=f"Z-REP-{dhaka_today_str().replace('-', '')}-{random.randint(100, 999)}",
            opened_at=dhaka_now_naive()
        )
        db.add(sess)

    sess.closed_at = dhaka_now_naive()
    sess.status = "CLOSED"
    sess.closing_cash_actual = closing_cash_actual
    sess.expected_cash = expected_cash
    sess.cash_discrepancy = discrepancy
    sess.total_sales = live_data["total_sales"]
    sess.total_cash_sales = live_data["total_cash_sales"]
    sess.total_bkash_sales = live_data["total_bkash_sales"]
    sess.total_card_sales = live_data["total_card_sales"]
    sess.total_due_sales = live_data["total_due_sales"]
    sess.orders_count = live_data["orders_count"]
    sess.total_discounts = live_data["total_discounts"]
    sess.total_tax = live_data["total_tax"]
    sess.notes = notes
    sess.z_report_data = {
        **live_data,
        "closing_cash_actual": closing_cash_actual,
        "cash_discrepancy": discrepancy,
        "closed_by": current_user.full_name,
        "closed_at": sess.closed_at.strftime("%Y-%m-%d %I:%M %p")
    }

    await db.commit()

    return {
        "success": True,
        "message": "Register closed successfully! Z-Report generated.",
        "z_report": sess.z_report_data
    }


@router.get("/register/z-reports")
async def list_past_z_reports(
    branch_id: Optional[str] = None,
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists past day-closing Z-reports.
    """
    target_branch = branch_id or current_user.branch_id
    query = (
        select(RegisterSession)
        .options(selectinload(RegisterSession.cashier))
        .where(
            RegisterSession.tenant_id == current_user.tenant_id,
            RegisterSession.status == "CLOSED"
        )
        .order_by(RegisterSession.closed_at.desc())
        .limit(limit)
    )
    if target_branch:
        query = query.where(RegisterSession.branch_id == target_branch)

    res = await db.execute(query)
    reports = res.scalars().all()

    output = []
    for r in reports:
        output.append({
            "id": r.id,
            "session_code": r.session_code,
            "closed_at": r.closed_at.strftime("%Y-%m-%d %I:%M %p") if r.closed_at else "",
            "cashier_name": r.cashier.full_name if r.cashier else "Staff",
            "total_sales": r.total_sales,
            "orders_count": r.orders_count,
            "opening_cash": r.opening_cash,
            "expected_cash": r.expected_cash,
            "closing_cash_actual": r.closing_cash_actual,
            "cash_discrepancy": r.cash_discrepancy,
            "z_report_data": r.z_report_data
        })
    return output


