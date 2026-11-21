from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant, Branch
from app.schemas import Token, LoginRequest, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Look up user by email, employee_code, or phone
    query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(
            (User.email == req.email_or_code.strip()) | 
            (User.employee_code == req.email_or_code.strip()) |
            (User.phone == req.email_or_code.strip()),
            User.is_active == True
        )
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/employee ID or password"
        )

    # Generate JWT Token with claims
    token_payload = {
        "sub": user.id,
        "tenant_id": user.tenant_id,
        "branch_id": user.branch_id,
        "role": user.role,
        "employee_code": user.employee_code
    }
    access_token = create_access_token(data=token_payload)

    user_out = UserOut(
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

    return Token(access_token=access_token, token_type="bearer", user=user_out)

@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = (
        select(User)
        .options(selectinload(User.profile), selectinload(User.branch))
        .where(User.id == current_user.id)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

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

@router.post("/switch-branch/{branch_id}", response_model=Token)
async def switch_branch(
    branch_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows Store Owners / Admins to quickly switch active showroom view"""
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Owners & Admins can switch branch context")

    branch_result = await db.execute(
        select(Branch).where(Branch.id == branch_id, Branch.tenant_id == current_user.tenant_id)
    )
    branch = branch_result.scalar_one_or_none()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    current_user.branch_id = branch.id
    await db.commit()

    token_payload = {
        "sub": current_user.id,
        "tenant_id": current_user.tenant_id,
        "branch_id": current_user.branch_id,
        "role": current_user.role,
        "employee_code": current_user.employee_code
    }
    access_token = create_access_token(data=token_payload)

    user_out = UserOut(
        id=current_user.id,
        tenant_id=current_user.tenant_id,
        branch_id=current_user.branch_id,
        employee_code=current_user.employee_code,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        is_active=current_user.is_active,
        branch_name=branch.name,
        profile=current_user.profile
    )

    return Token(access_token=access_token, token_type="bearer", user=user_out)
