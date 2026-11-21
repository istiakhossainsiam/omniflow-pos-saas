from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.tenant import Tenant, Branch, AttendancePolicy, SubscriptionPlan, LandingContent
from app.schemas import TenantOut, BranchCreate, BranchOut, AttendancePolicyUpdate, AttendancePolicyOut

router = APIRouter(prefix="/tenants", tags=["Tenant & Branches"])

@router.get("/current", response_model=TenantOut)
async def get_current_tenant_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Tenant)
        .options(
            selectinload(Tenant.branches),
            selectinload(Tenant.attendance_policy)
        )
        .where(Tenant.id == current_user.tenant_id)
    )
    result = await db.execute(query)
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.get("/branches", response_model=List[BranchOut])
async def list_branches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Branch).where(Branch.tenant_id == current_user.tenant_id, Branch.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/branches", response_model=BranchOut)
async def create_branch(
    req: BranchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    branch = Branch(
        tenant_id=current_user.tenant_id,
        name=req.name,
        code=req.code.upper().strip(),
        address=req.address,
        phone=req.phone,
        is_warehouse=req.is_warehouse
    )
    db.add(branch)
@router.put("/branches/{branch_id}", response_model=BranchOut)
async def update_branch(
    branch_id: str,
    req: BranchUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    b_res = await db.execute(
        select(Branch).where(Branch.id == branch_id, Branch.tenant_id == current_user.tenant_id)
    )
    branch = b_res.scalar_one_or_none()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    if req.name is not None:
        branch.name = req.name
    if req.code is not None:
        branch.code = req.code.upper().strip()
    if req.address is not None:
        branch.address = req.address
    if req.phone is not None:
        branch.phone = req.phone
    if req.is_warehouse is not None:
        branch.is_warehouse = req.is_warehouse
    if req.is_active is not None:
        branch.is_active = req.is_active

    await db.commit()
    await db.refresh(branch)
    return branch

@router.delete("/branches/{branch_id}")
async def delete_branch(
    branch_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    b_res = await db.execute(
        select(Branch).where(Branch.id == branch_id, Branch.tenant_id == current_user.tenant_id)
    )
    branch = b_res.scalar_one_or_none()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Check that at least 1 branch remains
    count_res = await db.execute(
        select(Branch).where(Branch.tenant_id == current_user.tenant_id, Branch.is_active == True)
    )
    all_active = count_res.scalars().all()
    if len(all_active) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only remaining active showroom branch")

    branch.is_active = False
    await db.commit()
    return {"status": "success", "message": f"Branch {branch.name} deleted successfully"}

@router.get("/attendance-policy", response_model=AttendancePolicyOut)
async def get_attendance_policy(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(AttendancePolicy).where(AttendancePolicy.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    policy = result.scalar_one_or_none()
    
    if not policy:
        # Create default policy if none exists
        policy = AttendancePolicy(tenant_id=current_user.tenant_id)
        db.add(policy)
        await db.commit()
        await db.refresh(policy)
    return policy

@router.put("/attendance-policy", response_model=AttendancePolicyOut)
async def update_attendance_policy(
    req: AttendancePolicyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = select(AttendancePolicy).where(AttendancePolicy.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    policy = result.scalar_one_or_none()

    for field, value in req.dict().items():
        setattr(policy, field, value)

    await db.commit()
    await db.refresh(policy)
    return policy

@router.get("/settings")
async def get_tenant_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Tenant).where(Tenant.id == current_user.tenant_id)
    result = await db.execute(query)
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    default_settings = {
        "theme_color": "emerald",
        "brand_subtitle": "Exclusive Fashion & Lifestyle",
        "currency_symbol": "৳",
        "is_vat_enabled": True,
        "vat_percentage": 5.0,
        "receipt_header": tenant.name or "VOGUE LIFESTYLE",
        "receipt_tagline": "Premium Fashion & Apparel Store",
        "receipt_address": "House 42, Road 7/A, Dhanmondi, Dhaka",
        "receipt_phone": tenant.phone or "+880 1811-223344",
        "receipt_vat_no": "BIN: 002345678-0101",
        "receipt_exchange_policy": "*** 7 DAYS EXCHANGE WITH MONEY RECEIPT ***",
        "receipt_footer_note": "Thank you for shopping with us! Please visit again.",
        "receipt_show_salesman": True,
        "receipt_show_loyalty": True,
        "receipt_show_tax": True,
        "receipt_show_barcode": True,
        "barcode_brand_title": tenant.name or "VOGUE FASHION",
        "barcode_tagline": "Quality Garments",
        "barcode_footer_note": f"Hotline: {tenant.phone or '01711-000111'}",
        "barcode_show_price": True,
        "barcode_show_mrp": True,
        "barcode_show_size_color": True,
    }

    settings = tenant.settings or {}
    # Merge defaults with stored settings
    merged = {**default_settings, **settings}
    return {
        "tenant_name": tenant.name,
        "currency": tenant.currency,
        "settings": merged
    }

@router.put("/settings")
async def update_tenant_settings(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = select(Tenant).where(Tenant.id == current_user.tenant_id)
    result = await db.execute(query)
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    current_settings = dict(tenant.settings or {})
    for k, v in req.items():
        if k == "name" and v:
            tenant.name = str(v).strip()
        elif k == "currency" and v:
            tenant.currency = str(v).strip()
        else:
            current_settings[k] = v

    tenant.settings = current_settings
    await db.commit()
    await db.refresh(tenant)

    return {
        "status": "success",
        "message": "Store UI, Barcode & Receipt template updated successfully",
        "tenant_name": tenant.name,
        "currency": tenant.currency,
        "settings": tenant.settings
    }

@router.get("/saas-overview")
async def get_saas_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["SUPER_ADMIN", "STORE_OWNER"]:
        raise HTTPException(status_code=403, detail="SuperAdmin permission required")

    tenants_res = await db.execute(select(Tenant).options(selectinload(Tenant.branches)))
    tenants = tenants_res.scalars().all()

    users_res = await db.execute(select(User))
    all_users = users_res.scalars().all()

    tenant_list = []
    total_outlets = 0
    for t in tenants:
        b_count = len(t.branches)
        total_outlets += b_count
        u_count = len([u for u in all_users if u.tenant_id == t.id])
        tenant_list.append({
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "email": t.email,
            "phone": t.phone,
            "subscription_plan": t.subscription_plan,
            "is_active": t.is_active,
            "branch_count": b_count,
            "user_count": u_count,
            "features": t.features or {},
            "created_at": t.created_at.isoformat() if t.created_at else None
        })

    return {
        "total_tenants": len(tenants),
        "total_outlets": total_outlets,
        "total_users": len(all_users),
        "system_status": "ONLINE",
        "tenants": tenant_list
    }

@router.post("/provision")
async def provision_tenant(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="SuperAdmin permission required")
    
    brand_name = req.get("name", "").strip()
    if not brand_name:
        raise HTTPException(status_code=400, detail="Brand name is required")
    
    slug = req.get("slug", "").strip() or brand_name.lower().replace(" ", "-")
    email = req.get("email", "").strip()
    phone = req.get("phone", "").strip()
    plan = req.get("plan", "ENTERPRISE").upper()
    owner_email = req.get("owner_email", email).strip() or f"owner@{slug}.com"
    owner_name = req.get("owner_name", f"{brand_name} Owner").strip()
    owner_password = req.get("owner_password", "password123")
    branch_name = req.get("branch_name", "Main Flagship Showroom").strip()
    branch_code = req.get("branch_code", "HQ01").strip().upper()

    tenant = Tenant(
        name=brand_name,
        slug=slug,
        email=email or owner_email,
        phone=phone or "+8801700000000",
        subscription_plan=plan,
        is_active=True,
        features={
            "attendance_handshake": True,
            "incentive_module": True,
            "inter_branch_transfer": True,
            "clothing_matrix": True,
            "barcode_generator": True
        }
    )
    db.add(tenant)
    await db.flush()

    branch = Branch(
        tenant_id=tenant.id,
        name=branch_name,
        code=branch_code,
        address="House 1, Main Road, Dhaka",
        phone=phone,
        is_warehouse=False
    )
    db.add(branch)
    await db.flush()

    owner = User(
        tenant_id=tenant.id,
        branch_id=branch.id,
        employee_code=f"{branch_code}-OWN-001",
        email=owner_email,
        full_name=owner_name,
        phone=phone,
        hashed_password=get_password_hash(owner_password),
        role=UserRole.STORE_OWNER,
        manager_pin="1234"
    )
    db.add(owner)
    await db.commit()

    return {
        "status": "success",
        "message": f"Tenant '{brand_name}' provisioned successfully with owner '{owner_email}'",
        "tenant_id": tenant.id,
        "owner_id": owner.id
    }

@router.put("/{tenant_id}/plan")
async def update_tenant_plan(
    tenant_id: str,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="SuperAdmin permission required")
    
    tenant_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if "subscription_plan" in req:
        tenant.subscription_plan = req["subscription_plan"].upper()
    if "is_active" in req:
        tenant.is_active = bool(req["is_active"])
    
    await db.commit()
    return {"status": "success", "message": "Tenant plan updated"}


@router.get("/plans")
async def list_subscription_plans(
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint to fetch active monthly subscription plans for landing page & superadmin"""
    query = select(SubscriptionPlan).where(SubscriptionPlan.is_active == True).order_by(SubscriptionPlan.monthly_price.asc())
    res = await db.execute(query)
    plans = res.scalars().all()
    return plans


@router.post("/plans")
async def create_subscription_plan(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """SuperAdmin endpoint to create a customized monthly subscription plan"""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="SuperAdmin permission required")
    
    name = req.get("name", "").strip()
    code = req.get("code", "").strip().upper() or name.upper().replace(" ", "_")
    if not name or not code:
        raise HTTPException(status_code=400, detail="Plan Name and Code are required")
    
    monthly_price = int(req.get("monthly_price", 5000))
    currency = req.get("currency", "BDT")
    max_branches = int(req.get("max_branches", 5))
    max_users = int(req.get("max_users", 15))
    description = req.get("description", "")
    is_popular = bool(req.get("is_popular", False))
    features = req.get("features", {
        "clothing_matrix": True,
        "fast_pos": True,
        "barcode_generator": True,
        "attendance_handshake": True,
        "inter_branch_transfer": True,
        "staff_incentive": True,
        "custom_branding": True
    })

    plan = SubscriptionPlan(
        name=name,
        code=code,
        monthly_price=monthly_price,
        currency=currency,
        max_branches=max_branches,
        max_users=max_users,
        description=description,
        is_popular=is_popular,
        is_active=True,
        features=features
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)

    return {
        "status": "success",
        "message": f"Subscription plan '{name}' created successfully",
        "plan": plan
    }


@router.put("/plans/{plan_id}")
async def update_subscription_plan(
    plan_id: str,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """SuperAdmin endpoint to update an existing subscription plan"""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="SuperAdmin permission required")

    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")

    if "name" in req: plan.name = req["name"].strip()
    if "monthly_price" in req: plan.monthly_price = int(req["monthly_price"])
    if "currency" in req: plan.currency = req["currency"].strip()
    if "max_branches" in req: plan.max_branches = int(req["max_branches"])
    if "max_users" in req: plan.max_users = int(req["max_users"])
    if "description" in req: plan.description = req["description"]
    if "is_popular" in req: plan.is_popular = bool(req["is_popular"])
    if "is_active" in req: plan.is_active = bool(req["is_active"])
    if "features" in req: plan.features = req["features"]

    await db.commit()
    await db.refresh(plan)
    return {"status": "success", "message": "Subscription plan updated", "plan": plan}


@router.delete("/plans/{plan_id}")
async def delete_subscription_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """SuperAdmin endpoint to disable a subscription plan"""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="SuperAdmin permission required")

    res = await db.execute(select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id))
    plan = res.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")

    plan.is_active = False
    await db.commit()
    return {"status": "success", "message": f"Plan '{plan.name}' deactivated successfully"}


@router.get("/landing-content")
async def get_landing_content(
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint to fetch landing page CMS content and SEO meta"""
    res = await db.execute(select(LandingContent).where(LandingContent.id == "default"))
    content = res.scalar_one_or_none()
    if not content:
        content = LandingContent(id="default")
        db.add(content)
        await db.commit()
        await db.refresh(content)

    # Ensure theme defaults if null
    needs_update = False
    if not content.theme:
        content.theme = {
            "bg_color": "#030712",
            "accent_color": "#10b981",
            "accent_gradient_to": "#059669",
            "secondary_color": "#f59e0b",
            "surface_color": "#0f172a",
            "surface_border": "#1e293b",
            "text_color": "#f8fafc",
            "preset": "MIDNIGHT_EMERALD"
        }
        needs_update = True

    if not content.superadmin_theme:
        content.superadmin_theme = {
            "bg_color": "#030712",
            "accent_color": "#f59e0b",
            "surface_color": "#0f172a",
            "border_color": "#1e293b",
            "text_color": "#f8fafc",
            "preset": "OBSIDIAN_GOLD"
        }
        needs_update = True

    if needs_update:
        await db.commit()
        await db.refresh(content)

    return content


@router.put("/landing-content")
async def update_landing_content(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """SuperAdmin endpoint to update Landing Page CMS content and SEO metadata"""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="SuperAdmin permission required")

    res = await db.execute(select(LandingContent).where(LandingContent.id == "default"))
    content = res.scalar_one_or_none()
    if not content:
        content = LandingContent(id="default")
        db.add(content)
        await db.flush()

    if "seo_meta" in req: content.seo_meta = req["seo_meta"]
    if "announcement" in req: content.announcement = req["announcement"]
    if "hero" in req: content.hero = req["hero"]
    if "features" in req: content.features = req["features"]
    if "architecture" in req: content.architecture = req["architecture"]
    if "testimonials" in req: content.testimonials = req["testimonials"]
    if "faqs" in req: content.faqs = req["faqs"]
    if "footer" in req: content.footer = req["footer"]
    if "theme" in req: content.theme = req["theme"]
    if "superadmin_theme" in req: content.superadmin_theme = req["superadmin_theme"]

    await db.commit()
    await db.refresh(content)
    return {
        "status": "success",
        "message": "Landing Page CMS and SEO metadata published live successfully",
        "content": content
    }




