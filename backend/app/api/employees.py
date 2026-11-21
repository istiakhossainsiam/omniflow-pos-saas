from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.security import get_password_hash
from app.core.time_utils import dhaka_now, dhaka_today_str, dhaka_current_month
from app.models.user import User, UserRole, EmployeeProfile, MonthlyTarget
from app.models.tenant import Branch, Tenant
from app.models.order import Order
from app.models.incentive import CommissionRecord
from app.models.attendance import AttendanceRecord
from app.schemas import (
    UserOut, UserCreate, TargetUpdate, SalesmanDashboardOut, OrderOut, OrderItemOut
)

router = APIRouter(prefix="/employees", tags=["Employee Management & Incentive Targets"])

@router.get("", response_model=List[UserOut])
async def list_employees(
    branch_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
    )
    if current_user.role == "SUPER_ADMIN":
        if tenant_id:
            query = query.where(User.tenant_id == tenant_id)
    else:
        query = query.where(User.tenant_id == current_user.tenant_id)
        
    if branch_id:
        query = query.where(User.branch_id == branch_id)

    result = await db.execute(query)
    users = result.scalars().all()

    return [
        UserOut(
            id=u.id,
            tenant_id=u.tenant_id,
            branch_id=u.branch_id,
            employee_code=u.employee_code,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            role=u.role,
            is_active=u.is_active,
            branch_name=u.branch.name if u.branch else "Headquarters",
            profile=u.profile
        ) for u in users
    ]

@router.post("", response_model=UserOut)
async def create_employee(
    req: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new employee with Auto Showroom-wise Unique Code
    Format: [TENANT_SLUG]-[BRANCH_CODE]-[ROLE_PREFIX]-[SEQ]
    e.g. VOGUE-DHK01-SLS-004
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Get Tenant Slug and Branch Code
    t_res = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = t_res.scalar_one()

    target_branch_id = req.branch_id or current_user.branch_id
    b_res = await db.execute(select(Branch).where(Branch.id == target_branch_id))
    branch = b_res.scalar_one_or_none()
    branch_code = branch.code if branch else "HQ"

    role_prefix_map = {
        UserRole.STORE_MANAGER.value: "MGR",
        UserRole.CASHIER.value: "CSH",
        UserRole.SALESMAN.value: "SLS",
        UserRole.INVENTORY_CLERK.value: "INV",
        UserRole.STORE_OWNER.value: "OWN"
    }
    role_pfx = role_prefix_map.get(req.role, "EMP")

    # Count existing employees in this branch for sequence number
    count_res = await db.execute(
        select(User).where(User.tenant_id == current_user.tenant_id, User.branch_id == target_branch_id)
    )
    seq = len(count_res.scalars().all()) + 1
    employee_code = f"{tenant.slug.upper()}-{branch_code}-{role_pfx}-{seq:03d}"

    user = User(
        tenant_id=current_user.tenant_id,
        branch_id=target_branch_id,
        employee_code=employee_code,
        email=req.email,
        full_name=req.full_name,
        phone=req.phone,
        hashed_password=get_password_hash(req.password),
        role=req.role,
        manager_pin=req.manager_pin if req.role in ["STORE_MANAGER", "STORE_OWNER"] else None
    )
    db.add(user)
    await db.flush()

    profile = EmployeeProfile(
        user_id=user.id,
        department=req.department or "Sales",
        base_salary=req.base_salary or 0.0,
        commission_rate=req.commission_rate or 2.0
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)

    return UserOut(
        id=user.id,
        tenant_id=user.tenant_id,
        branch_id=user.branch_id,
        employee_code=user.employee_code,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        branch_name=branch.name if branch else "Headquarters",
        profile=profile
    )

@router.put("/{user_id}", response_model=UserOut)
async def update_employee(
    user_id: str,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    u_res = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(User.id == user_id, User.tenant_id == current_user.tenant_id)
    )
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    if "full_name" in req and req["full_name"]:
        user.full_name = req["full_name"]
    if "email" in req and req["email"]:
        user.email = req["email"]
    if "phone" in req:
        user.phone = req["phone"]
    if "role" in req and req["role"]:
        user.role = req["role"]
    if "branch_id" in req:
        user.branch_id = req["branch_id"]
    if "is_active" in req and req["is_active"] is not None:
        user.is_active = bool(req["is_active"])
    if "password" in req and req["password"]:
        user.hashed_password = get_password_hash(req["password"])
    if "manager_pin" in req and req["manager_pin"]:
        user.manager_pin = req["manager_pin"]

    # Update profile
    if user.profile:
        if "department" in req and req["department"] is not None:
            user.profile.department = req["department"]
        if "base_salary" in req and req["base_salary"] is not None:
            user.profile.base_salary = float(req["base_salary"])
        if "commission_rate" in req and req["commission_rate"] is not None:
            user.profile.commission_rate = float(req["commission_rate"])

    await db.commit()
    await db.refresh(user)

    return UserOut(
        id=user.id,
        tenant_id=user.tenant_id,
        branch_id=user.branch_id,
        employee_code=user.employee_code,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        branch_name=user.branch.name if user.branch else "Headquarters",
        profile=user.profile
    )

@router.delete("/{user_id}")
async def delete_employee(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active account")

    u_res = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == current_user.tenant_id)
    )
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    user.is_active = False
    await db.commit()
    return {"status": "success", "message": f"Employee {user.full_name} deactivated successfully"}

@router.get("/salesman-dashboard", response_model=SalesmanDashboardOut)
async def get_salesman_dashboard_portal(
    user_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Performance Dashboard for Salesman / Staff:
    - Today's Sales & Orders
    - Month Sales vs Monthly Target set by Manager/Admin
    - Real-time Earned Incentive / Commission
    - Today's Attendance Status
    """
    target_user_id = current_user.id
    if user_id and current_user.role in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        target_user_id = user_id
    elif current_user.role in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        # If admin didn't specify user_id, pick the first salesperson in the requested branch
        query = (
            select(User)
            .where(User.tenant_id == current_user.tenant_id, User.role == "SALESMAN", User.is_active == True)
        )
        if branch_id:
            query = query.where(User.branch_id == branch_id)
        first_sales = (await db.execute(query)).scalars().first()
        if first_sales:
            target_user_id = first_sales.id

    month_year_str = dhaka_current_month()
    today_str = dhaka_today_str()

    # Fetch User & Branch
    u_res = await db.execute(
        select(User).options(selectinload(User.branch), selectinload(User.profile)).where(User.id == target_user_id)
    )
    user = u_res.scalar_one_or_none()
    if not user:
        user = current_user

    # Fetch Monthly Target
    t_res = await db.execute(
        select(MonthlyTarget).where(
            MonthlyTarget.tenant_id == current_user.tenant_id,
            MonthlyTarget.user_id == target_user_id,
            MonthlyTarget.month_year == month_year_str
        )
    )
    target_obj = t_res.scalar_one_or_none()
    month_target = target_obj.target_amount if target_obj else 200000.0

    # Fetch Today's Orders & Month Orders where salesman served
    orders_res = await db.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.cashier), selectinload(Order.customer))
        .where(
            Order.tenant_id == current_user.tenant_id,
            Order.salesman_id == target_user_id,
            Order.status == "COMPLETED"
        )
    )
    all_orders = orders_res.scalars().all()

    today_sales = 0.0
    today_orders_count = 0
    month_sales = 0.0
    recent_orders = []

    for o in all_orders:
        o_date_str = o.created_at.strftime("%Y-%m-%d")
        o_month_str = o.created_at.strftime("%Y-%m")

        if o_month_str == month_year_str:
            month_sales += o.total_amount

        if o_date_str == today_str:
            today_sales += o.total_amount
            today_orders_count += 1
            recent_orders.append(
                OrderOut(
                    id=o.id,
                    invoice_number=o.invoice_number,
                    branch_id=o.branch_id,
                    cashier_name=o.cashier.full_name if o.cashier else "Cashier",
                    salesman_name=user.full_name,
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

    # Fetch Total Commission Earned this Month
    comm_res = await db.execute(
        select(CommissionRecord).where(
            CommissionRecord.salesman_id == target_user_id,
            CommissionRecord.month_year == month_year_str
        )
    )
    commissions = comm_res.scalars().all()
    total_commission = sum(c.commission_amount for c in commissions)

    # Calculate Achievement Percentage
    achievement_pct = round((month_sales / month_target * 100) if month_target > 0 else 0.0, 1)

    # Fetch Today's Attendance
    att_res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == current_user.tenant_id,
            AttendanceRecord.user_id == target_user_id,
            AttendanceRecord.date_str == today_str
        )
    )
    att_rec = att_res.scalar_one_or_none()
    att_status = att_rec.status if att_rec else "NOT_CHECKED_IN"

    return SalesmanDashboardOut(
        user_id=user.id,
        salesman_name=user.full_name,
        employee_code=user.employee_code,
        branch_id=user.branch_id,
        branch_name=user.branch.name if user.branch else "Headquarters",
        month_year=month_year_str,
        today_sales=today_sales,
        today_orders_count=today_orders_count,
        month_target=month_target,
        month_sales=month_sales,
        achievement_percentage=achievement_pct,
        estimated_commission_earned=total_commission,
        attendance_status_today=att_status,
        recent_sales=recent_orders[:5]
    )

@router.post("/targets")
async def set_employee_target(
    req: TargetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = select(MonthlyTarget).where(
        MonthlyTarget.tenant_id == current_user.tenant_id,
        MonthlyTarget.user_id == req.user_id,
        MonthlyTarget.month_year == req.month_year
    )
    res = await db.execute(query)
    target = res.scalar_one_or_none()

    if not target:
        target = MonthlyTarget(
            tenant_id=current_user.tenant_id,
            user_id=req.user_id,
            month_year=req.month_year,
            target_amount=req.target_amount,
            target_items_count=req.target_items_count,
            bonus_on_achieve=req.bonus_on_achieve
        )
        db.add(target)
    else:
        target.target_amount = req.target_amount
        target.target_items_count = req.target_items_count
        target.bonus_on_achieve = req.bonus_on_achieve

    await db.commit()
    return {"success": True, "message": "Sales target updated successfully"}


@router.get("/incentives/overview")
async def get_incentives_overview(
    month_year: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Overview of all staff incentives, commission rates, monthly targets,
    realized sales, commission earned, target bonus, and net payout.
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    target_month = month_year or dhaka_current_month()

    # Query all active staff for the tenant
    query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(User.tenant_id == current_user.tenant_id, User.is_active == True)
    )
    if branch_id:
        query = query.where(User.branch_id == branch_id)

    users_res = await db.execute(query)
    users = users_res.scalars().all()

    # Query all commissions for this month
    comm_query = select(CommissionRecord).where(
        CommissionRecord.tenant_id == current_user.tenant_id,
        CommissionRecord.month_year == target_month
    )
    comm_res = await db.execute(comm_query)
    commissions = comm_res.scalars().all()

    # Query all targets for this month
    target_query = select(MonthlyTarget).where(
        MonthlyTarget.tenant_id == current_user.tenant_id,
        MonthlyTarget.month_year == target_month
    )
    target_res = await db.execute(target_query)
    targets = {t.user_id: t for t in target_res.scalars().all()}

    # Query all orders for this month to calculate direct sales volume per salesman
    orders_query = select(Order).where(
        Order.tenant_id == current_user.tenant_id,
        Order.status == "COMPLETED"
    )
    orders_res = await db.execute(orders_query)
    all_orders = orders_res.scalars().all()

    salesman_sales_map = {}
    for o in all_orders:
        o_m = o.created_at.strftime("%Y-%m")
        if o_m == target_month and o.salesman_id:
            salesman_sales_map[o.salesman_id] = salesman_sales_map.get(o.salesman_id, 0.0) + o.total_amount

    staff_incentives = []
    total_sales_volume = 0.0
    total_commission_pool = 0.0
    total_bonus_pool = 0.0

    for u in users:
        u_target = targets.get(u.id)
        target_amt = u_target.target_amount if u_target else 200000.0
        bonus_on_achieve = u_target.bonus_on_achieve if u_target else 5000.0

        u_commissions = [c for c in commissions if c.salesman_id == u.id]
        earned_comm = sum(c.commission_amount for c in u_commissions)
        achieved_sales = salesman_sales_map.get(u.id, 0.0)

        achievement_pct = round((achieved_sales / target_amt * 100) if target_amt > 0 else 0.0, 1)
        is_target_met = achieved_sales >= target_amt if target_amt > 0 else False
        bonus_earned = bonus_on_achieve if is_target_met else 0.0

        base_salary = u.profile.base_salary if u.profile else 18000.0
        commission_rate = u.profile.commission_rate if u.profile else 2.5
        total_payout = base_salary + earned_comm + bonus_earned

        total_sales_volume += achieved_sales
        total_commission_pool += earned_comm
        total_bonus_pool += bonus_earned

        staff_incentives.append({
            "user_id": u.id,
            "employee_code": u.employee_code,
            "full_name": u.full_name,
            "role": u.role,
            "branch_id": u.branch_id,
            "branch_name": u.branch.name if u.branch else "Headquarters",
            "base_salary": base_salary,
            "commission_rate": commission_rate,
            "target_amount": target_amt,
            "achieved_sales": achieved_sales,
            "achievement_percentage": achievement_pct,
            "earned_commission": earned_comm,
            "bonus_on_achieve": bonus_on_achieve,
            "is_target_met": is_target_met,
            "bonus_earned": bonus_earned,
            "total_estimated_payout": total_payout
        })

    return {
        "month_year": target_month,
        "total_staff_count": len(staff_incentives),
        "total_sales_volume": total_sales_volume,
        "total_commission_pool": total_commission_pool,
        "total_bonus_pool": total_bonus_pool,
        "total_incentive_pool": total_commission_pool + total_bonus_pool,
        "staff": staff_incentives
    }


@router.post("/incentives/bulk-update")
async def bulk_update_incentives(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk update commission rate, base salary, target amount, and bonus for sales staff
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    updates = req.get("staff_updates", [])
    month_year = req.get("month_year") or dhaka_current_month()

    for item in updates:
        user_id = item.get("user_id")
        if not user_id:
            continue

        # Update profile (commission_rate, base_salary)
        u_res = await db.execute(
            select(User).options(selectinload(User.profile)).where(User.id == user_id, User.tenant_id == current_user.tenant_id)
        )
        user = u_res.scalar_one_or_none()
        if user and user.profile:
            if "commission_rate" in item and item["commission_rate"] is not None:
                user.profile.commission_rate = float(item["commission_rate"])
            if "base_salary" in item and item["base_salary"] is not None:
                user.profile.base_salary = float(item["base_salary"])

        # Update Monthly Target
        if "target_amount" in item:
            t_res = await db.execute(
                select(MonthlyTarget).where(
                    MonthlyTarget.tenant_id == current_user.tenant_id,
                    MonthlyTarget.user_id == user_id,
                    MonthlyTarget.month_year == month_year
                )
            )
            target = t_res.scalar_one_or_none()
            if not target:
                target = MonthlyTarget(
                    tenant_id=current_user.tenant_id,
                    user_id=user_id,
                    month_year=month_year,
                    target_amount=float(item.get("target_amount", 200000.0)),
                    bonus_on_achieve=float(item.get("bonus_on_achieve", 5000.0))
                )
                db.add(target)
            else:
                target.target_amount = float(item.get("target_amount", target.target_amount))
                if "bonus_on_achieve" in item:
                    target.bonus_on_achieve = float(item["bonus_on_achieve"])

    await db.commit()
    return {"success": True, "message": f"Updated incentive rules and targets for {len(updates)} staff members successfully"}

