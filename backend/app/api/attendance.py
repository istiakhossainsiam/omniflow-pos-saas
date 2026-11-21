import uuid
import random
import string
from datetime import datetime, timedelta, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.barcode import generate_qr_base64
from app.core.time_utils import dhaka_now, dhaka_now_naive, dhaka_today_str
from app.models.user import User, UserRole
from app.models.tenant import Branch, AttendancePolicy
from app.models.attendance import AttendanceRecord, VerificationSession
from app.schemas import (
    CheckInRequest, AttendanceRecordOut, VerificationSessionOut
)

router = APIRouter(prefix="/attendance", tags=["Secure Attendance & Handshake"])

@router.get("/status")
async def get_my_today_attendance_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns today's check-in status, verification handshake status, and times in Asia/Dhaka"""
    today_str = dhaka_today_str()
    
    query = (
        select(AttendanceRecord)
        .options(
            selectinload(AttendanceRecord.verified_by_manager_user)
        )
        .where(
            AttendanceRecord.tenant_id == current_user.tenant_id,
            AttendanceRecord.user_id == current_user.id,
            AttendanceRecord.date_str == today_str
        )
    )
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        return {
            "has_checked_in": False,
            "date_str": today_str,
            "status": "NOT_CHECKED_IN",
            "check_in_time": None,
            "check_out_time": None,
            "is_verified": False,
            "late_minutes": 0
        }

    return {
        "has_checked_in": True,
        "date_str": record.date_str,
        "status": record.status,
        "check_in_time": record.check_in_time.isoformat() if record.check_in_time else None,
        "check_out_time": record.check_out_time.isoformat() if record.check_out_time else None,
        "is_verified": record.is_verified_by_manager,
        "verified_by": record.verified_by_manager_user.full_name if record.verified_by_manager_user else None,
        "verification_method": record.verification_method,
        "late_minutes": record.late_minutes
    }

@router.post("/generate-manager-session", response_model=VerificationSessionOut)
async def generate_manager_handshake_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Store Manager / Admin generates dynamic 60s rotating QR & Quick PIN
    for physical presence check-in handshake in the showroom.
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only Store Managers & Admins can initiate handshake session")

    branch_id = current_user.branch_id
    if not branch_id:
        raise HTTPException(status_code=400, detail="Manager has no branch assigned")

    # Generate random 64-char token & 6-digit PIN
    token_str = str(uuid.uuid4()).replace("-", "") + ''.join(random.choices(string.ascii_letters, k=16))
    quick_pin = ''.join(random.choices(string.digits, k=6))
    expires_at = dhaka_now_naive() + timedelta(seconds=90) # 90 seconds lifetime in Dhaka time

    session = VerificationSession(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        manager_id=current_user.id,
        token=token_str,
        quick_pin=quick_pin,
        expires_at=expires_at
    )
    db.add(session)
    await db.commit()

    # Generate QR Code containing JSON verification payload
    qr_payload = f"OMNI_ATTEND:{session.token}:{session.quick_pin}"
    qr_base64 = generate_qr_base64(qr_payload)

    # Get branch name
    b_res = await db.execute(select(Branch).where(Branch.id == branch_id))
    b = b_res.scalar_one_or_none()

    return VerificationSessionOut(
        token=session.token,
        quick_pin=session.quick_pin,
        qr_code_base64=qr_base64,
        expires_at=session.expires_at,
        branch_id=branch_id,
        branch_name=b.name if b else "Showroom"
    )

@router.post("/check-in")
async def employee_check_in(
    req: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Employee requests check-in.
    Evaluates Tenant Attendance Policy, calculates grace period & late penalty,
    and completes manager handshake via Token / PIN or sets to PENDING_VERIFICATION.
    """
    today_str = dhaka_today_str()
    now = dhaka_now_naive()

    # Check if already checked in today
    existing = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.tenant_id == current_user.tenant_id,
            AttendanceRecord.user_id == current_user.id,
            AttendanceRecord.date_str == today_str
        )
    )
    record = existing.scalar_one_or_none()
    if record and record.check_in_time:
        raise HTTPException(status_code=400, detail="Already checked in for today")

    # Fetch Tenant Attendance Policy
    p_res = await db.execute(select(AttendancePolicy).where(AttendancePolicy.tenant_id == current_user.tenant_id))
    policy = p_res.scalar_one_or_none()
    if not policy:
        policy = AttendancePolicy(tenant_id=current_user.tenant_id)

    # Calculate Shift Start & Late Minutes
    shift_hour, shift_min = map(int, policy.shift_start_time.split(":"))
    # Local time calculation (assuming standard shift)
    shift_datetime = datetime(now.year, now.month, now.day, shift_hour, shift_min)
    grace_cutoff = shift_datetime + timedelta(minutes=policy.grace_period_minutes)

    late_minutes = 0
    calculated_status = "ON_TIME"

    if now > grace_cutoff:
        diff = now - shift_datetime
        late_minutes = int(diff.total_seconds() // 60)
        if late_minutes >= policy.half_day_late_minutes:
            calculated_status = "HALF_DAY"
        else:
            calculated_status = "LATE"

    # Handshake Verification
    is_verified = False
    verified_by_id = None
    verification_method = None

    if not policy.is_enabled or not policy.require_manager_handshake:
        # Handshake not required by tenant policy -> Auto-verify
        is_verified = True
        verification_method = "SELF_VERIFIED_POLICY"
        verified_by_id = current_user.id
    elif req.verification_token or req.manager_pin:
        # Verify with active manager session
        sess_query = select(VerificationSession).where(
            VerificationSession.tenant_id == current_user.tenant_id,
            VerificationSession.branch_id == (req.branch_id or current_user.branch_id),
            VerificationSession.expires_at > now
        )
        if req.verification_token:
            sess_query = sess_query.where(VerificationSession.token == req.verification_token.strip())
        elif req.manager_pin:
            sess_query = sess_query.where(VerificationSession.quick_pin == req.manager_pin.strip())

        s_res = await db.execute(sess_query)
        session = s_res.scalar_one_or_none()

        if session:
            is_verified = True
            verified_by_id = session.manager_id
            verification_method = "MANAGER_QR_SCAN" if req.verification_token else "MANAGER_PIN"
        else:
            # Check if manager entered their permanent PIN directly
            if req.manager_pin:
                m_res = await db.execute(
                    select(User).where(
                        User.tenant_id == current_user.tenant_id,
                        User.branch_id == (req.branch_id or current_user.branch_id),
                        User.manager_pin == req.manager_pin.strip(),
                        User.role.in_(["STORE_MANAGER", "STORE_OWNER", "SUPER_ADMIN"])
                    )
                )
                manager_user = m_res.scalar_one_or_none()
                if manager_user:
                    is_verified = True
                    verified_by_id = manager_user.id
                    verification_method = "MANAGER_DIRECT_PIN"

    if not record:
        record = AttendanceRecord(
            tenant_id=current_user.tenant_id,
            branch_id=req.branch_id or current_user.branch_id,
            user_id=current_user.id,
            date_str=today_str,
            check_in_time=now,
            status=calculated_status if is_verified else "PENDING_VERIFICATION",
            late_minutes=late_minutes,
            is_verified_by_manager=is_verified,
            verified_by_user_id=verified_by_id,
            verification_method=verification_method,
            verification_timestamp=now if is_verified else None,
            device_info=req.device_info
        )
        db.add(record)
    else:
        record.check_in_time = now
        record.status = calculated_status if is_verified else "PENDING_VERIFICATION"
        record.late_minutes = late_minutes
        record.is_verified_by_manager = is_verified
        record.verified_by_user_id = verified_by_id
        record.verification_method = verification_method
        record.verification_timestamp = now if is_verified else None

    await db.commit()

    return {
        "success": True,
        "status": record.status,
        "is_verified": is_verified,
        "late_minutes": late_minutes,
        "message": "Check-in successful & verified!" if is_verified else "Check-in recorded! Awaiting manager handshake."
    }

@router.post("/verify-queue/{record_id}")
async def manager_verify_queued_checkin(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Store Manager 1-Click Handshake verification from Manager Dashboard"""
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    r_res = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.id == record_id,
            AttendanceRecord.tenant_id == current_user.tenant_id
        )
    )
    rec = r_res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    rec.is_verified_by_manager = True
    rec.verified_by_user_id = current_user.id
    rec.verification_method = "MANAGER_ONE_CLICK_QUEUE"
    rec.verification_timestamp = dhaka_now_naive()
    rec.status = "LATE" if rec.late_minutes > 0 else "ON_TIME"

    await db.commit()
    return {"success": True, "message": "Check-in verified successfully!"}

@router.get("/records", response_model=List[AttendanceRecordOut])
async def list_attendance_records(
    date_str: Optional[str] = None,
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_date = date_str or dhaka_today_str()
    target_branch = branch_id or current_user.branch_id

    query = (
        select(AttendanceRecord)
        .options(
            selectinload(AttendanceRecord.user).selectinload(User.branch),
            selectinload(AttendanceRecord.verified_by_manager_user)
        )
        .where(
            AttendanceRecord.tenant_id == current_user.tenant_id,
            AttendanceRecord.date_str == target_date
        )
    )
    if target_branch:
        query = query.where(AttendanceRecord.branch_id == target_branch)

    result = await db.execute(query)
    records = result.scalars().all()

    output = []
    for r in records:
        output.append(
            AttendanceRecordOut(
                id=r.id,
                user_id=r.user_id,
                employee_name=r.user.full_name if r.user else "Employee",
                employee_code=r.user.employee_code if r.user else "N/A",
                branch_name=r.user.branch.name if (r.user and r.user.branch) else "Headquarters",
                date_str=r.date_str,
                check_in_time=r.check_in_time,
                check_out_time=r.check_out_time,
                status=r.status,
                late_minutes=r.late_minutes,
                is_verified_by_manager=r.is_verified_by_manager,
                verified_by_name=r.verified_by_manager_user.full_name if r.verified_by_manager_user else None,
                verification_method=r.verification_method
            )
        )
    return output
