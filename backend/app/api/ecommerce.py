from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.time_utils import dhaka_now, dhaka_today_str
from app.models.tenant import Tenant, Branch
from app.models.product import Category, Product, ProductVariant, InventoryStock
from app.models.order import Customer, Order, OrderItem, PaymentRecord
from app.models.user import User
from app.schemas import (
    StorefrontInfoOut, StorefrontProductOut, StorefrontVariantOut, CategoryOut,
    EcommerceOrderCreate, EcommerceSettingsUpdate, OrderOut, OrderItemOut
)

router = APIRouter(prefix="/ecommerce", tags=["Tenant E-Commerce Storefront"])

DEFAULT_ECOM_SETTINGS = {
    "is_enabled": True,
    "store_title": "Online Fashion & Lifestyle Store",
    "tagline": "Exclusive Apparel & Premium Fashion Collection",
    "announcement_bar": "🔥 Free Delivery Inside Dhaka on Orders Over ৳2,000 | Cash on Delivery Available!",
    "hero_headline": "Timeless Elegance & Contemporary Fashion",
    "hero_subheadline": "Explore handcrafted Panjabi, Royal Oxford Shirts, and Premium Polos with fast nationwide shipping across Bangladesh.",
    "hero_badge": "NEW SEASON 2026",
    "hero_image": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    "whatsapp_number": "+8801711000111",
    "hotline_number": "+8801811223344",
    "contact_email": "shop@voguelifestyle.com",
    "delivery_inside_dhaka": 60,
    "delivery_outside_dhaka": 120,
    "free_delivery_min_order": 2000,
    "payment_methods": ["COD", "BKASH", "NAGAD"],
    "bkash_number": "01711000111",
    "nagad_number": "01811223344",
    "address": "House 42, Road 7/A, Dhanmondi, Dhaka",
    "facebook_url": "https://facebook.com",
    "instagram_url": "https://instagram.com",
    "primary_color": "emerald"
}

async def resolve_storefront_tenant(
    db: AsyncSession,
    slug: Optional[str] = None,
    domain: Optional[str] = None,
    host_header: Optional[str] = None
) -> Tenant:
    raw_host = (host_header.split(":")[0].lower().strip() if host_header else None)

    # 1. Match by explicit slug or query param (?slug=... or ?store=...)
    if slug:
        s_res = await db.execute(
            select(Tenant).where(Tenant.slug == slug.lower().strip(), Tenant.is_active == True)
        )
        tenant = s_res.scalar_one_or_none()
        if tenant:
            return tenant

    # 2. Match by custom domain (e.g. shop.voguebd.com)
    target_domain = domain or raw_host
    if target_domain and target_domain not in ["localhost", "127.0.0.1", "0.0.0.0"]:
        d_res = await db.execute(
            select(Tenant).where(Tenant.custom_domain == target_domain, Tenant.is_active == True)
        )
        tenant = d_res.scalar_one_or_none()
        if tenant:
            return tenant

    # 3. Match by platform subdomain (e.g. vogue.pos.bd, vogue.omniflow.pos.bd, vogue.localhost)
    if raw_host:
        host_parts = raw_host.split(".")
        if len(host_parts) >= 2:
            candidate_subdomain = host_parts[0]
            ignored_subdomains = ["www", "app", "admin", "api", "localhost", "127", "0", "seas-paragraphs-roads-athens"]
            if candidate_subdomain not in ignored_subdomains:
                sub_res = await db.execute(
                    select(Tenant).where(Tenant.slug == candidate_subdomain, Tenant.is_active == True)
                )
                tenant = sub_res.scalar_one_or_none()
                if tenant:
                    return tenant

    # 4. Fallback to first active tenant
    first_res = await db.execute(select(Tenant).where(Tenant.is_active == True))
    first_tenant = first_res.scalars().first()
    if not first_tenant:
        raise HTTPException(status_code=404, detail="No active store found")
    return first_tenant

@router.get("/storefront", response_model=StorefrontInfoOut)
async def get_storefront_data(
    request: Request,
    slug: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Public API: Fetches tenant interactive e-commerce catalog, branding,
    categories, and variant stock availability.
    """
    host_header = request.headers.get("host")
    tenant = await resolve_storefront_tenant(db, slug=slug, domain=domain, host_header=host_header)

    # Fetch Categories
    cat_res = await db.execute(
        select(Category).where(Category.tenant_id == tenant.id)
    )
    categories = cat_res.scalars().all()

    # Fetch Products with Variants & Stock
    prod_query = (
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.stocks),
            selectinload(Product.category)
        )
        .where(Product.tenant_id == tenant.id, Product.is_active == True)
    )
    prod_res = await db.execute(prod_query)
    products_db = prod_res.scalars().all()

    store_products = []
    for p in products_db:
        variants_out = []
        for v in p.variants:
            if not v.is_active:
                continue
            total_stock = sum(s.quantity for s in v.stocks)
            variants_out.append(
                StorefrontVariantOut(
                    id=v.id,
                    sku=v.sku,
                    barcode=v.barcode,
                    size=v.size,
                    color=v.color,
                    color_code=v.color_code,
                    selling_price=v.selling_price,
                    mrp=v.mrp or v.selling_price,
                    total_stock=total_stock,
                    is_in_stock=total_stock > 0
                )
            )

        store_products.append(
            StorefrontProductOut(
                id=p.id,
                name=p.name,
                product_type=p.product_type,
                brand=p.brand,
                description=p.description,
                image_url=p.image_url,
                base_selling_price=p.base_selling_price,
                fabric=p.fabric,
                unit=p.unit,
                category_id=p.category_id,
                category_name=p.category.name if p.category else "General Apparel",
                variants=variants_out
            )
        )

    ecom_settings = tenant.ecommerce_settings or DEFAULT_ECOM_SETTINGS
    # Merge defaults for any missing keys
    merged_settings = {**DEFAULT_ECOM_SETTINGS, **ecom_settings}

    return StorefrontInfoOut(
        tenant_id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        custom_domain=tenant.custom_domain,
        currency=tenant.currency or "BDT",
        currency_symbol="৳",
        logo_url=tenant.logo_url,
        phone=tenant.phone,
        email=tenant.email,
        ecommerce_settings=merged_settings,
        categories=[
            CategoryOut(id=c.id, name=c.name, slug=c.slug, image_url=c.image_url)
            for c in categories
        ],
        products=store_products
    )

@router.post("/orders")
async def place_ecommerce_order(
    req: EcommerceOrderCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Public Customer Checkout: Creates e-commerce order, links/creates customer,
    deducts inventory stock, and generates trackable order code.
    """
    host_header = request.headers.get("host")
    tenant = await resolve_storefront_tenant(
        db, 
        slug=req.tenant_slug_or_id, 
        host_header=host_header
    )

    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Determine showroom branch to fulfill order (e.g. flagship showroom or central warehouse)
    b_res = await db.execute(
        select(Branch).where(Branch.tenant_id == tenant.id, Branch.is_active == True)
    )
    branches = b_res.scalars().all()
    if not branches:
        raise HTTPException(status_code=400, detail="Store has no active branches configured")
    
    # Prefer first retail branch or warehouse
    fulfillment_branch = next((b for b in branches if not b.is_warehouse), branches[0])

    # Find or create customer
    phone_clean = req.customer_phone.strip()
    c_res = await db.execute(
        select(Customer).where(Customer.tenant_id == tenant.id, Customer.phone == phone_clean)
    )
    customer = c_res.scalar_one_or_none()
    if not customer:
        customer = Customer(
            tenant_id=tenant.id,
            name=req.customer_name.strip(),
            phone=phone_clean,
            email=req.customer_email,
            address=req.shipping_address
        )
        db.add(customer)
        await db.flush()
    else:
        # Update address if provided
        if req.shipping_address:
            customer.address = req.shipping_address
        if req.customer_name and not customer.name:
            customer.name = req.customer_name

    # Generate Unique E-Commerce Invoice Number
    now = dhaka_now()
    date_part = now.strftime("%Y%m%d")
    count_res = await db.execute(
        select(Order).where(Order.tenant_id == tenant.id, Order.order_source == "ECOMMERCE")
    )
    seq = len(count_res.scalars().all()) + 1
    invoice_number = f"ECO-{tenant.slug.upper()}-{date_part}-{seq:04d}"

    # Calculate item totals & deduct inventory
    subtotal = 0.0
    order_items_to_create = []

    for item in req.items:
        v_res = await db.execute(
            select(ProductVariant)
            .options(selectinload(ProductVariant.product), selectinload(ProductVariant.stocks))
            .where(ProductVariant.id == item.variant_id)
        )
        variant = v_res.scalar_one_or_none()
        if not variant:
            raise HTTPException(status_code=404, detail=f"Product variant {item.variant_id} not found")

        item_price = variant.selling_price
        line_total = item_price * item.quantity
        subtotal += line_total

        order_items_to_create.append(
            OrderItem(
                variant_id=variant.id,
                product_name=variant.product.name if variant.product else "Garment Item",
                size=variant.size,
                color=variant.color,
                sku=variant.sku,
                barcode=variant.barcode,
                unit_price=item_price,
                cost_price=variant.cost_price,
                quantity=item.quantity,
                discount=0.0,
                total=line_total
            )
        )

        # Deduct stock from fulfillment branch
        stock_record = next((s for s in variant.stocks if s.branch_id == fulfillment_branch.id), None)
        if stock_record:
            stock_record.quantity = max(0, stock_record.quantity - item.quantity)
        else:
            new_stock = InventoryStock(
                tenant_id=tenant.id,
                branch_id=fulfillment_branch.id,
                variant_id=variant.id,
                quantity=max(0, 0 - item.quantity)
            )
            db.add(new_stock)

    delivery_fee = float(req.delivery_charge) if req.delivery_charge is not None else 60.0
    total_amount = subtotal + delivery_fee

    # Find a store user (e.g. owner or manager) to fulfill cashier_id constraint on existing SQLite schema
    u_res = await db.execute(
        select(User).where(User.tenant_id == tenant.id, User.is_active == True)
    )
    staff_user = u_res.scalars().first()
    assigned_cashier_id = staff_user.id if staff_user else None

    # Create Order
    new_order = Order(
        tenant_id=tenant.id,
        branch_id=fulfillment_branch.id,
        cashier_id=assigned_cashier_id,
        salesman_id=None,
        customer_id=customer.id,
        invoice_number=invoice_number,
        subtotal=subtotal,
        discount_amount=0.0,
        tax_vat_amount=0.0,
        total_amount=total_amount,
        paid_amount=0.0 if req.payment_method == "COD" else total_amount,
        change_due=0.0,
        due_amount=total_amount if req.payment_method == "COD" else 0.0,
        order_source="ECOMMERCE",
        shipping_address=req.shipping_address,
        shipping_city=req.shipping_city or "Dhaka",
        shipping_zone=req.shipping_zone,
        delivery_charge=delivery_fee,
        delivery_status="PENDING",
        customer_notes=req.customer_notes,
        status="COMPLETED"
    )
    db.add(new_order)
    await db.flush()

    for oi in order_items_to_create:
        oi.order_id = new_order.id
        db.add(oi)

    # Record payment
    payment = PaymentRecord(
        order_id=new_order.id,
        payment_method=req.payment_method,
        amount=total_amount if req.payment_method != "COD" else 0.0,
        transaction_ref=req.transaction_ref
    )
    db.add(payment)

    # Update customer spent
    customer.total_spent = (customer.total_spent or 0.0) + total_amount

    await db.commit()

    return {
        "success": True,
        "invoice_number": invoice_number,
        "order_id": new_order.id,
        "subtotal": subtotal,
        "delivery_charge": delivery_fee,
        "total_amount": total_amount,
        "customer_name": req.customer_name,
        "shipping_address": req.shipping_address,
        "payment_method": req.payment_method,
        "delivery_status": "PENDING",
        "message": f"Order {invoice_number} placed successfully! We will contact you soon."
    }

@router.get("/orders/track")
async def track_ecommerce_order(
    query: str = Query(..., description="Order invoice number or customer phone"),
    db: AsyncSession = Depends(get_db)
):
    """
    Public API: Live order tracking by invoice number or phone number.
    """
    clean_q = query.strip()
    orders_res = await db.execute(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.customer),
            selectinload(Order.branch)
        )
        .where(
            (Order.invoice_number == clean_q) |
            (Order.customer.has(Customer.phone == clean_q))
        )
        .order_by(Order.created_at.desc())
    )
    orders = orders_res.scalars().all()

    if not orders:
        return {"orders": [], "message": f"No orders found for '{clean_q}'"}

    results = []
    for o in orders:
        results.append({
            "id": o.id,
            "invoice_number": o.invoice_number,
            "created_at": o.created_at.strftime("%Y-%m-%d %I:%M %p"),
            "order_source": o.order_source or "POS",
            "delivery_status": o.delivery_status or "PENDING",
            "shipping_address": o.shipping_address or (o.customer.address if o.customer else "N/A"),
            "shipping_zone": o.shipping_zone or "Inside Dhaka",
            "delivery_charge": o.delivery_charge or 0.0,
            "total_amount": o.total_amount,
            "due_amount": o.due_amount,
            "customer_name": o.customer.name if o.customer else "Walk-in Guest",
            "customer_phone": o.customer.phone if o.customer else "",
            "items_count": len(o.items),
            "items": [
                {
                    "product_name": it.product_name,
                    "size": it.size,
                    "color": it.color,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total": it.total
                }
                for it in o.items
            ]
        })

    return {"orders": results}

@router.get("/admin/orders")
async def list_admin_ecommerce_orders(
    delivery_status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin API: List online e-commerce orders for tenant management.
    """
    query = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.customer),
            selectinload(Order.branch)
        )
        .where(Order.tenant_id == current_user.tenant_id, Order.order_source == "ECOMMERCE")
    )
    if delivery_status and delivery_status != "ALL":
        query = query.where(Order.delivery_status == delivery_status)

    query = query.order_by(Order.created_at.desc())
    res = await db.execute(query)
    orders = res.scalars().all()

    return [
        {
            "id": o.id,
            "invoice_number": o.invoice_number,
            "created_at": o.created_at.strftime("%Y-%m-%d %I:%M %p"),
            "customer_name": o.customer.name if o.customer else "N/A",
            "customer_phone": o.customer.phone if o.customer else "N/A",
            "shipping_address": o.shipping_address or "",
            "shipping_zone": o.shipping_zone or "INSIDE_DHAKA",
            "delivery_charge": o.delivery_charge or 0.0,
            "subtotal": o.subtotal,
            "total_amount": o.total_amount,
            "delivery_status": o.delivery_status or "PENDING",
            "customer_notes": o.customer_notes,
            "items": [
                {
                    "product_name": it.product_name,
                    "size": it.size,
                    "color": it.color,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total": it.total
                }
                for it in o.items
            ]
        }
        for o in orders
    ]

@router.put("/admin/orders/{order_id}/status")
async def update_ecommerce_order_status(
    order_id: str,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin API: Update e-commerce delivery status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED).
    """
    res = await db.execute(
        select(Order).where(Order.id == order_id, Order.tenant_id == current_user.tenant_id)
    )
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = req.get("delivery_status")
    if new_status:
        order.delivery_status = new_status
        if new_status == "DELIVERED":
            order.paid_amount = order.total_amount
            order.due_amount = 0.0

    await db.commit()
    return {"success": True, "message": f"Order status updated to {new_status}"}

@router.get("/settings")
async def get_ecommerce_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin API: Get tenant's current e-commerce settings and custom domain.
    """
    res = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = res.scalar_one()

    ecom_settings = tenant.ecommerce_settings or DEFAULT_ECOM_SETTINGS
    merged = {**DEFAULT_ECOM_SETTINGS, **ecom_settings}

    return {
        "tenant_id": tenant.id,
        "name": tenant.name,
        "slug": tenant.slug,
        "custom_domain": tenant.custom_domain,
        "ecommerce_settings": merged
    }

@router.put("/settings")
async def update_ecommerce_settings(
    req: EcommerceSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin API: Update custom domain & e-commerce website settings.
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    res = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = res.scalar_one()

    # Validate custom domain uniqueness if provided
    if req.custom_domain:
        clean_domain = req.custom_domain.strip().lower()
        dom_res = await db.execute(
            select(Tenant).where(Tenant.custom_domain == clean_domain, Tenant.id != tenant.id)
        )
        if dom_res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Domain '{clean_domain}' is already assigned to another brand")
        tenant.custom_domain = clean_domain
    elif req.custom_domain == "":
        tenant.custom_domain = None

    if req.ecommerce_settings:
        current_settings = tenant.ecommerce_settings or DEFAULT_ECOM_SETTINGS
        current_settings.update(req.ecommerce_settings)
        tenant.ecommerce_settings = current_settings

    await db.commit()
    return {
        "success": True,
        "message": "E-Commerce website settings & domain updated successfully",
        "custom_domain": tenant.custom_domain,
        "ecommerce_settings": tenant.ecommerce_settings
    }
