from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.time_utils import dhaka_now, dhaka_today_str, dhaka_current_month
from app.models.user import User, UserRole, EmployeeProfile, MonthlyTarget, PayrollDisbursement
from app.models.tenant import Branch, Tenant, AttendancePolicy
from app.models.order import Order
from app.models.incentive import CommissionRecord
from app.models.attendance import AttendanceRecord
from app.models.hrm import LeaveApplication, LeaveType, LeaveStatus, SalaryAdvance
from app.schemas import (
    LeaveCreateRequest, LeaveReviewRequest, LeaveOut,
    SalaryAdvanceCreateRequest, SalaryAdvanceReviewRequest, SalaryAdvanceOut,
    EmployeeProfileUpdateHRM, PayrollDisburseRequest
)

router = APIRouter(prefix="/hrm", tags=["Human Resource Management (HRM) Suite"])

@router.get("/overview")
async def get_hrm_overview(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns HRM Key Performance Indicators: Staff headcounts, attendance today,
    leave counts, pending requests, and payroll budget.
    """
    today_str = dhaka_today_str()
    current_m = dhaka_current_month()

    # Base query for employees
    emp_query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(User.tenant_id == current_user.tenant_id, User.is_active == True)
    )
    if branch_id:
        emp_query = emp_query.where(User.branch_id == branch_id)
    emp_res = await db.execute(emp_query)
    employees = emp_res.scalars().all()

    total_staff = len(employees)

    # Attendance Today
    att_query = select(AttendanceRecord).where(
        AttendanceRecord.tenant_id == current_user.tenant_id,
        AttendanceRecord.date_str == today_str
    )
    if branch_id:
        att_query = att_query.where(AttendanceRecord.branch_id == branch_id)
    att_res = await db.execute(att_query)
    attendances_today = att_res.scalars().all()

    present_today = len([a for a in attendances_today if a.status in ["PRESENT", "LATE"]])
    late_today = len([a for a in attendances_today if a.status == "LATE"])

    # Leaves Today
    leave_query = select(LeaveApplication).where(
        LeaveApplication.tenant_id == current_user.tenant_id,
        LeaveApplication.status == LeaveStatus.APPROVED,
        LeaveApplication.start_date <= today_str,
        LeaveApplication.end_date >= today_str
    )
    leave_res = await db.execute(leave_query)
    on_leave_today = len(leave_res.scalars().all())

    # Pending Leave Applications
    pending_leaves_res = await db.execute(
        select(LeaveApplication).where(
            LeaveApplication.tenant_id == current_user.tenant_id,
            LeaveApplication.status == LeaveStatus.PENDING
        )
    )
    pending_leaves_count = len(pending_leaves_res.scalars().all())

    # Pending Salary Advances
    pending_advances_res = await db.execute(
        select(SalaryAdvance).where(
            SalaryAdvance.tenant_id == current_user.tenant_id,
            SalaryAdvance.status == "PENDING"
        )
    )
    pending_advances_count = len(pending_advances_res.scalars().all())

    # Monthly Base Payroll Budget
    total_base_payroll = sum((e.profile.base_salary if e.profile else 18000.0) for e in employees)
    total_allowances = sum(
        ((e.profile.mobile_allowance or 0.0) + (e.profile.medical_allowance or 0.0) + (e.profile.conveyance_allowance or 0.0))
        for e in employees if e.profile
    )

    return {
        "month_year": current_m,
        "today_str": today_str,
        "total_staff": total_staff,
        "present_today": present_today,
        "late_today": late_today,
        "on_leave_today": on_leave_today,
        "absent_today": max(0, total_staff - present_today - on_leave_today),
        "pending_leaves_count": pending_leaves_count,
        "pending_advances_count": pending_advances_count,
        "monthly_base_payroll_budget": total_base_payroll,
        "monthly_allowances_budget": total_allowances,
        "estimated_monthly_gross_budget": total_base_payroll + total_allowances
    }

@router.get("/employees")
async def list_hrm_employees(
    branch_id: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    HRM Staff Roster: Full profiles, designations, allowances, banking, and shifts.
    """
    query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(User.tenant_id == current_user.tenant_id)
    )
    if branch_id:
        query = query.where(User.branch_id == branch_id)

    res = await db.execute(query)
    users = res.scalars().all()

    out = []
    for u in users:
        p = u.profile
        if department and p and p.department != department:
            continue

        out.append({
            "id": u.id,
            "employee_code": u.employee_code,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "branch_id": u.branch_id,
            "branch_name": u.branch.name if u.branch else "Headquarters",
            "branch_code": u.branch.code if u.branch else "HQ",
            "designation": p.designation if p else "Staff",
            "department": p.department if p else "Operations",
            "base_salary": p.base_salary if p else 18000.0,
            "mobile_allowance": p.mobile_allowance if p else 0.0,
            "medical_allowance": p.medical_allowance if p else 0.0,
            "conveyance_allowance": p.conveyance_allowance if p else 0.0,
            "total_fixed_salary": (p.base_salary if p else 18000.0) + (
                (p.mobile_allowance or 0.0) + (p.medical_allowance or 0.0) + (p.conveyance_allowance or 0.0) if p else 0.0
            ),
            "commission_rate": p.commission_rate if p else 2.5,
            "shift": p.shift if p else "Morning (09:30 AM - 07:30 PM)",
            "nid_number": p.nid_number if p else "",
            "emergency_contact": p.emergency_contact if p else "",
            "bank_name": p.bank_name if p else "",
            "bank_account_no": p.bank_account_no if p else "",
            "mfs_number": p.mfs_number if p else "",
            "joining_date": p.joining_date if p else "2026-01-01"
        })

    return out

@router.put("/employees/{user_id}/profile")
async def update_hrm_employee_profile(
    user_id: str,
    req: EmployeeProfileUpdateHRM,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates employee HRM profile (salary, allowances, department, shift, banking).
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    u_res = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id, User.tenant_id == current_user.tenant_id)
    )
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    profile = user.profile
    if not profile:
        profile = EmployeeProfile(user_id=user.id)
        db.add(profile)

    if req.designation is not None:
        profile.designation = req.designation
    if req.department is not None:
        profile.department = req.department
    if req.base_salary is not None:
        profile.base_salary = float(req.base_salary)
    if req.mobile_allowance is not None:
        profile.mobile_allowance = float(req.mobile_allowance)
    if req.medical_allowance is not None:
        profile.medical_allowance = float(req.medical_allowance)
    if req.conveyance_allowance is not None:
        profile.conveyance_allowance = float(req.conveyance_allowance)
    if req.commission_rate is not None:
        profile.commission_rate = float(req.commission_rate)
    if req.shift is not None:
        profile.shift = req.shift
    if req.nid_number is not None:
        profile.nid_number = req.nid_number
    if req.emergency_contact is not None:
        profile.emergency_contact = req.emergency_contact
    if req.bank_name is not None:
        profile.bank_name = req.bank_name
    if req.bank_account_no is not None:
        profile.bank_account_no = req.bank_account_no
    if req.mfs_number is not None:
        profile.mfs_number = req.mfs_number
    if req.joining_date is not None:
        profile.joining_date = req.joining_date

    await db.commit()
    return {"success": True, "message": f"HRM profile updated for {user.full_name}"}

# ----------------- LEAVE MANAGEMENT -----------------

@router.get("/leaves", response_model=List[LeaveOut])
async def list_leave_applications(
    status: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List leave requests with review details.
    """
    query = (
        select(LeaveApplication)
        .options(
            selectinload(LeaveApplication.user),
            selectinload(LeaveApplication.reviewed_by),
            selectinload(LeaveApplication.branch)
        )
        .where(LeaveApplication.tenant_id == current_user.tenant_id)
    )
    if status and status != "ALL":
        query = query.where(LeaveApplication.status == status)
    if branch_id:
        query = query.where(LeaveApplication.branch_id == branch_id)

    query = query.order_by(LeaveApplication.created_at.desc())
    res = await db.execute(query)
    leaves = res.scalars().all()

    return [
        LeaveOut(
            id=l.id,
            user_id=l.user_id,
            employee_name=l.user.full_name if l.user else "Employee",
            employee_code=l.user.employee_code if l.user else "N/A",
            branch_name=l.branch.name if l.branch else "Headquarters",
            leave_type=l.leave_type,
            start_date=l.start_date,
            end_date=l.end_date,
            days_count=l.days_count,
            reason=l.reason,
            status=l.status,
            review_notes=l.review_notes,
            reviewed_by_name=l.reviewed_by.full_name if l.reviewed_by else None,
            created_at=l.created_at
        )
        for l in leaves
    ]

@router.post("/leaves")
async def apply_for_leave(
    req: LeaveCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a new leave request.
    """
    target_user_id = req.user_id or current_user.id
    target_branch_id = current_user.branch_id

    # If manager is applying on behalf of another user
    if req.user_id and req.user_id != current_user.id:
        u_res = await db.execute(select(User).where(User.id == req.user_id))
        target_u = u_res.scalar_one_or_none()
        if target_u:
            target_branch_id = target_u.branch_id

    # Calculate days count from dates
    try:
        d1 = datetime.strptime(req.start_date, "%Y-%m-%d").date()
        d2 = datetime.strptime(req.end_date, "%Y-%m-%d").date()
        days_calc = max(1, (d2 - d1).days + 1)
    except Exception:
        days_calc = req.days_count or 1

    leave = LeaveApplication(
        tenant_id=current_user.tenant_id,
        branch_id=target_branch_id,
        user_id=target_user_id,
        leave_type=req.leave_type,
        start_date=req.start_date,
        end_date=req.end_date,
        days_count=days_calc,
        reason=req.reason,
        status=LeaveStatus.PENDING
    )
    db.add(leave)
    await db.commit()
    return {"success": True, "message": f"Leave application for {days_calc} days submitted successfully"}

@router.put("/leaves/{leave_id}/review")
async def review_leave_application(
    leave_id: str,
    req: LeaveReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or Reject leave request (Store Owner / Manager).
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    res = await db.execute(
        select(LeaveApplication).where(LeaveApplication.id == leave_id, LeaveApplication.tenant_id == current_user.tenant_id)
    )
    leave = res.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    leave.status = req.status
    leave.review_notes = req.review_notes
    leave.reviewed_by_id = current_user.id
    leave.reviewed_at = datetime.utcnow()

    await db.commit()
    return {"success": True, "message": f"Leave application marked as {req.status}"}

# ----------------- SALARY ADVANCE & LOANS -----------------

@router.get("/advances", response_model=List[SalaryAdvanceOut])
async def list_salary_advances(
    status: Optional[str] = None,
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List salary advances and deduction tracking.
    """
    query = (
        select(SalaryAdvance)
        .options(
            selectinload(SalaryAdvance.user),
            selectinload(SalaryAdvance.approved_by)
        )
        .where(SalaryAdvance.tenant_id == current_user.tenant_id)
    )
    if status and status != "ALL":
        query = query.where(SalaryAdvance.status == status)
    if month_year:
        query = query.where(SalaryAdvance.month_year == month_year)

    query = query.order_by(SalaryAdvance.created_at.desc())
    res = await db.execute(query)
    advances = res.scalars().all()

    return [
        SalaryAdvanceOut(
            id=a.id,
            user_id=a.user_id,
            employee_name=a.user.full_name if a.user else "Employee",
            employee_code=a.user.employee_code if a.user else "N/A",
            amount=a.amount,
            month_year=a.month_year,
            reason=a.reason,
            status=a.status,
            approval_notes=a.approval_notes,
            approved_by_name=a.approved_by.full_name if a.approved_by else None,
            created_at=a.created_at
        )
        for a in advances
    ]

@router.post("/advances")
async def create_salary_advance(
    req: SalaryAdvanceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create salary advance request.
    """
    target_user_id = req.user_id or current_user.id
    u_res = await db.execute(select(User).where(User.id == target_user_id))
    user = u_res.scalar_one_or_none()
    branch_id = user.branch_id if user else current_user.branch_id

    adv = SalaryAdvance(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        user_id=target_user_id,
        amount=float(req.amount),
        month_year=req.month_year,
        reason=req.reason,
        status="PENDING"
    )
    db.add(adv)
    await db.commit()
    return {"success": True, "message": f"Salary advance request of ৳{req.amount:,.0f} submitted"}

@router.put("/advances/{advance_id}/review")
async def review_salary_advance(
    advance_id: str,
    req: SalaryAdvanceReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or Reject salary advance request.
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    res = await db.execute(
        select(SalaryAdvance).where(SalaryAdvance.id == advance_id, SalaryAdvance.tenant_id == current_user.tenant_id)
    )
    adv = res.scalar_one_or_none()
    if not adv:
        raise HTTPException(status_code=404, detail="Salary advance record not found")

    adv.status = req.status
    adv.approval_notes = req.approval_notes
    adv.approved_by_id = current_user.id

    await db.commit()
    return {"success": True, "message": f"Salary advance marked as {req.status}"}

# ----------------- MONTHLY PAYROLL & SALARY SHEET -----------------

@router.get("/payroll/sheet")
async def get_monthly_payroll_sheet(
    month_year: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates dynamic monthly payroll sheet for branch/tenant staff.
    Combines Base Salary + Allowances + Earned Commissions - Attendance Penalties - Advances.
    """
    target_month = month_year or dhaka_current_month()

    # 1. Fetch Tenant Policy for late penalties
    pol_res = await db.execute(
        select(AttendancePolicy).where(AttendancePolicy.tenant_id == current_user.tenant_id)
    )
    policy = pol_res.scalar_one_or_none()
    late_penalty_unit = policy.penalty_deduction_amount if (policy and policy.late_penalty_type == "INCENTIVE_DEDUCTION") else 100.0

    # 2. Fetch Employees
    emp_query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(User.tenant_id == current_user.tenant_id, User.is_active == True)
    )
    if branch_id:
        emp_query = emp_query.where(User.branch_id == branch_id)
    emp_res = await db.execute(emp_query)
    employees = emp_res.scalars().all()

    # 3. Fetch Monthly Attendance for this month
    # date_str format is "YYYY-MM-DD"
    att_res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == current_user.tenant_id,
            AttendanceRecord.date_str.startswith(target_month)
        )
    )
    all_attendances = att_res.scalars().all()

    # 4. Fetch Earned Commissions & Targets
    comm_res = await db.execute(
        select(CommissionRecord).where(
            CommissionRecord.tenant_id == current_user.tenant_id,
            CommissionRecord.month_year == target_month
        )
    )
    all_commissions = comm_res.scalars().all()

    target_res = await db.execute(
        select(MonthlyTarget).where(
            MonthlyTarget.tenant_id == current_user.tenant_id,
            MonthlyTarget.month_year == target_month
        )
    )
    targets_map = {t.user_id: t for t in target_res.scalars().all()}

    # Direct sales attribution
    orders_res = await db.execute(
        select(Order).where(Order.tenant_id == current_user.tenant_id, Order.status == "COMPLETED")
    )
    orders = orders_res.scalars().all()
    sales_map = {}
    for o in orders:
        if o.created_at.strftime("%Y-%m") == target_month and o.salesman_id:
            sales_map[o.salesman_id] = sales_map.get(o.salesman_id, 0.0) + o.total_amount

    # 5. Fetch Approved Salary Advances for this month
    adv_res = await db.execute(
        select(SalaryAdvance).where(
            SalaryAdvance.tenant_id == current_user.tenant_id,
            SalaryAdvance.month_year == target_month,
            SalaryAdvance.status.in_(["APPROVED", "DEDUCTED"])
        )
    )
    advances_map = {}
    for a in adv_res.scalars().all():
        advances_map[a.user_id] = advances_map.get(a.user_id, 0.0) + a.amount

    # 6. Fetch Existing Payroll Disbursements
    disb_res = await db.execute(
        select(PayrollDisbursement).where(
            PayrollDisbursement.tenant_id == current_user.tenant_id,
            PayrollDisbursement.month_year == target_month
        )
    )
    disb_map = {d.user_id: d for d in disb_res.scalars().all()}

    payroll_items = []
    total_gross_disbursement = 0.0
    total_deductions_pool = 0.0
    total_net_payable_pool = 0.0

    for u in employees:
        p = u.profile
        base_salary = p.base_salary if p else 18000.0
        mobile_allowance = p.mobile_allowance if p else 0.0
        medical_allowance = p.medical_allowance if p else 0.0
        conveyance_allowance = p.conveyance_allowance if p else 0.0
        total_allowances = mobile_allowance + medical_allowance + conveyance_allowance

        # Attendance calculation
        user_atts = [a for a in all_attendances if a.user_id == u.id]
        present_days = len([a for a in user_atts if a.status in ["PRESENT", "LATE"]])
        late_days = len([a for a in user_atts if a.status == "LATE"])
        attendance_deduction = late_days * late_penalty_unit

        # Commission and bonus
        u_comms = [c for c in all_commissions if c.salesman_id == u.id]
        earned_comm = sum(c.commission_amount for c in u_comms)
        
        u_target = targets_map.get(u.id)
        achieved_sales = sales_map.get(u.id, 0.0)
        target_amt = u_target.target_amount if u_target else 200000.0
        target_bonus = u_target.bonus_on_achieve if (u_target and achieved_sales >= target_amt) else 0.0

        # Salary advance deduction
        advance_deduction = advances_map.get(u.id, 0.0)

        # Computations
        gross_earnings = base_salary + total_allowances + earned_comm + target_bonus
        total_deductions = attendance_deduction + advance_deduction
        net_payable = max(0.0, gross_earnings - total_deductions)

        total_gross_disbursement += gross_earnings
        total_deductions_pool += total_deductions
        total_net_payable_pool += net_payable

        # Existing disbursement record
        disb_record = disb_map.get(u.id)
        is_paid = disb_record.payment_status == "PAID" if disb_record else False

        payroll_items.append({
            "user_id": u.id,
            "employee_code": u.employee_code,
            "full_name": u.full_name,
            "role": u.role,
            "branch_id": u.branch_id,
            "branch_name": u.branch.name if u.branch else "Headquarters",
            "department": p.department if p else "Operations",
            "designation": p.designation if p else "Staff",
            "base_salary": base_salary,
            "mobile_allowance": mobile_allowance,
            "medical_allowance": medical_allowance,
            "conveyance_allowance": conveyance_allowance,
            "total_allowances": total_allowances,
            "present_days": present_days,
            "late_days": late_days,
            "attendance_deduction": attendance_deduction,
            "earned_commission": earned_comm,
            "target_bonus": target_bonus,
            "advance_deduction": advance_deduction,
            "gross_earnings": gross_earnings,
            "total_deductions": total_deductions,
            "net_payable": net_payable,
            "payment_status": "PAID" if is_paid else "UNPAID",
            "payment_method": disb_record.payment_method if disb_record else (p.bank_name if (p and p.bank_name) else "CASH"),
            "disbursed_at": disb_record.disbursed_at.strftime("%Y-%m-%d %I:%M %p") if (disb_record and disb_record.disbursed_at) else None,
            "bank_name": p.bank_name if p else "",
            "bank_account_no": p.bank_account_no if p else "",
            "mfs_number": p.mfs_number if p else ""
        })

    return {
        "month_year": target_month,
        "total_staff_count": len(payroll_items),
        "total_gross_disbursement": total_gross_disbursement,
        "total_deductions_pool": total_deductions_pool,
        "total_net_payable_pool": total_net_payable_pool,
        "payroll_items": payroll_items
    }

@router.post("/payroll/disburse")
async def disburse_monthly_payroll(
    req: PayrollDisburseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes salary disbursement for a single staff member or entire branch in bulk.
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    target_month = req.month_year
    now = datetime.utcnow()

    # Target users
    if req.user_id:
        u_res = await db.execute(
            select(User).options(selectinload(User.profile)).where(User.id == req.user_id, User.tenant_id == current_user.tenant_id)
        )
        target_users = u_res.scalars().all()
    else:
        q = select(User).options(selectinload(User.profile)).where(User.tenant_id == current_user.tenant_id, User.is_active == True)
        if req.branch_id:
            q = q.where(User.branch_id == req.branch_id)
        u_res = await db.execute(q)
        target_users = u_res.scalars().all()

    disbursed_count = 0
    for u in target_users:
        # Check existing disbursement
        d_res = await db.execute(
            select(PayrollDisbursement).where(
                PayrollDisbursement.tenant_id == current_user.tenant_id,
                PayrollDisbursement.user_id == u.id,
                PayrollDisbursement.month_year == target_month
            )
        )
        disb = d_res.scalar_one_or_none()
        if not disb:
            disb = PayrollDisbursement(
                tenant_id=current_user.tenant_id,
                branch_id=u.branch_id,
                user_id=u.id,
                month_year=target_month,
                base_salary=u.profile.base_salary if u.profile else 18000.0,
                payment_status="PAID",
                payment_method=req.payment_method,
                transaction_reference=req.transaction_reference,
                disbursed_at=now,
                disbursed_by_user_id=current_user.id,
                notes=req.notes
            )
            db.add(disb)
        else:
            disb.payment_status = "PAID"
            disb.payment_method = req.payment_method
            disb.transaction_reference = req.transaction_reference
            disb.disbursed_at = now
            disb.disbursed_by_user_id = current_user.id
            if req.notes:
                disb.notes = req.notes

        disbursed_count += 1

        # Mark any pending salary advances for this month as DEDUCTED
        adv_res = await db.execute(
            select(SalaryAdvance).where(
                SalaryAdvance.tenant_id == current_user.tenant_id,
                SalaryAdvance.user_id == u.id,
                SalaryAdvance.month_year == target_month,
                SalaryAdvance.status == "APPROVED"
            )
        )
        for adv in adv_res.scalars().all():
            adv.status = "DEDUCTED"

    await db.commit()
    return {
        "success": True,
        "message": f"Successfully disbursed salary for {disbursed_count} staff member(s) via {req.payment_method}"
    }

@router.get("/payroll/payslip/{user_id}")
async def get_employee_payslip(
    user_id: str,
    month_year: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns full printable payslip voucher details with brand header and earnings breakdown.
    """
    target_month = month_year or dhaka_current_month()

    # Tenant info
    t_res = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = t_res.scalar_one()

    # User info
    u_res = await db.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(User.id == user_id, User.tenant_id == current_user.tenant_id)
    )
    user = u_res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    p = user.profile
    base_salary = p.base_salary if p else 18000.0
    mobile_allowance = p.mobile_allowance if p else 0.0
    medical_allowance = p.medical_allowance if p else 0.0
    conveyance_allowance = p.conveyance_allowance if p else 0.0

    # Commissions
    c_res = await db.execute(
        select(CommissionRecord).where(
            CommissionRecord.tenant_id == current_user.tenant_id,
            CommissionRecord.salesman_id == user.id,
            CommissionRecord.month_year == target_month
        )
    )
    comms = c_res.scalars().all()
    earned_comm = sum(c.commission_amount for c in comms)

    # Attendance Late Deductions
    att_res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == current_user.tenant_id,
            AttendanceRecord.user_id == user.id,
            AttendanceRecord.date_str.startswith(target_month)
        )
    )
    atts = att_res.scalars().all()
    late_days = len([a for a in atts if a.status == "LATE"])
    att_deduction = late_days * 100.0

    # Advance Deductions
    adv_res = await db.execute(
        select(SalaryAdvance).where(
            SalaryAdvance.tenant_id == current_user.tenant_id,
            SalaryAdvance.user_id == user.id,
            SalaryAdvance.month_year == target_month,
            SalaryAdvance.status.in_(["APPROVED", "DEDUCTED"])
        )
    )
    advance_deduction = sum(a.amount for a in adv_res.scalars().all())

    gross_earnings = base_salary + mobile_allowance + medical_allowance + conveyance_allowance + earned_comm
    total_deductions = att_deduction + advance_deduction
    net_salary = max(0.0, gross_earnings - total_deductions)

    # Disbursement status
    d_res = await db.execute(
        select(PayrollDisbursement).where(
            PayrollDisbursement.tenant_id == current_user.tenant_id,
            PayrollDisbursement.user_id == user.id,
            PayrollDisbursement.month_year == target_month
        )
    )
    disb = d_res.scalar_one_or_none()

    return {
        "voucher_no": f"PAY-{tenant.slug.upper()}-{target_month.replace('-', '')}-{user.employee_code.split('-')[-1]}",
        "brand_name": tenant.name,
        "brand_tagline": tenant.settings.get("receipt_tagline", "Fashion Retail ERP") if tenant.settings else "",
        "brand_address": tenant.settings.get("receipt_address", "Dhaka, Bangladesh") if tenant.settings else "",
        "month_year": target_month,
        "generated_at": dhaka_now().strftime("%Y-%m-%d %I:%M %p"),
        "employee": {
            "name": user.full_name,
            "code": user.employee_code,
            "designation": p.designation if p else "Staff",
            "department": p.department if p else "Sales",
            "branch_name": user.branch.name if user.branch else "Headquarters",
            "bank_name": p.bank_name if p else "Cash in Hand",
            "bank_account_no": p.bank_account_no if p else (p.mfs_number if p else "N/A"),
            "joining_date": p.joining_date if p else "2026-01-01"
        },
        "earnings": [
            {"label": "Basic Monthly Salary", "amount": base_salary},
            {"label": "Mobile Phone Allowance", "amount": mobile_allowance},
            {"label": "Medical Allowance", "amount": medical_allowance},
            {"label": "Conveyance Allowance", "amount": conveyance_allowance},
            {"label": "Earned Sales Commission & Bonus", "amount": earned_comm}
        ],
        "deductions": [
            {"label": f"Late Attendance Penalty ({late_days} Late Days)", "amount": att_deduction},
            {"label": "Salary Advance / Loan Repayment", "amount": advance_deduction}
        ],
        "gross_earnings": gross_earnings,
        "total_deductions": total_deductions,
        "net_salary": net_salary,
        "payment_status": disb.payment_status if disb else "UNPAID",
        "payment_method": disb.payment_method if disb else "CASH",
        "disbursed_at": disb.disbursed_at.strftime("%Y-%m-%d %I:%M %p") if (disb and disb.disbursed_at) else None
    }
