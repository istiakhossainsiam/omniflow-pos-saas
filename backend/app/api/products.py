import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.core.barcode import generate_barcode_base64, generate_qr_base64
from app.models.user import User
from app.models.product import Category, Product, ProductVariant, InventoryStock
from app.models.tenant import Branch
from app.schemas import (
    ProductOut, VariantOut, VariantStockOut, CategoryOut,
    MatrixGenerateRequest, ProductUpdate, VariantUpdate
)

router = APIRouter(prefix="/products", tags=["Products & Inventory Matrix"])

def generate_random_barcode(prefix: str = "890") -> str:
    digits = ''.join(random.choices(string.digits, k=7))
    return f"{prefix}{digits}"

@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Category).where(Category.tenant_id == current_user.tenant_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("", response_model=List[ProductOut])
async def list_products(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Product)
        .options(
            selectinload(Product.category),
            selectinload(Product.variants).selectinload(ProductVariant.stocks).selectinload(InventoryStock.branch)
        )
        .where(Product.tenant_id == current_user.tenant_id, Product.is_active == True)
    )

    if category_id:
        query = query.where(Product.category_id == category_id)

    if search:
        search_fmt = f"%{search}%"
        query = query.where((Product.name.ilike(search_fmt)) | (Product.brand.ilike(search_fmt)))

    result = await db.execute(query)
    products = result.scalars().all()

    # Format output with branch stocks and barcode images
    output = []
    for prod in products:
        variant_list = []
        for v in prod.variants:
            branch_stocks = []
            total_stock = 0
            for stock in v.stocks:
                total_stock += stock.quantity
                branch_stocks.append(
                    VariantStockOut(
                        branch_id=stock.branch.id,
                        branch_name=stock.branch.name,
                        branch_code=stock.branch.code,
                        quantity=stock.quantity,
                        rack_location=stock.rack_location
                    )
                )

            variant_list.append(
                VariantOut(
                    id=v.id,
                    product_id=v.product_id,
                    sku=v.sku,
                    barcode=v.barcode,
                    size=v.size,
                    color=v.color,
                    color_code=v.color_code,
                    cost_price=v.cost_price,
                    selling_price=v.selling_price,
                    mrp=v.mrp,
                    min_stock_alert=v.min_stock_alert,
                    is_active=v.is_active,
                    total_stock=total_stock,
                    branch_stocks=branch_stocks,
                    barcode_base64=generate_barcode_base64(v.barcode),
                    qr_code_base64=generate_qr_base64(v.barcode)
                )
            )

        output.append(
            ProductOut(
                id=prod.id,
                name=prod.name,
                product_type=prod.product_type,
                brand=prod.brand,
                description=prod.description,
                image_url=prod.image_url,
                base_cost_price=prod.base_cost_price,
                base_selling_price=prod.base_selling_price,
                has_variants=prod.has_variants,
                fabric=prod.fabric,
                unit=prod.unit,
                category_id=prod.category_id,
                category_name=prod.category.name if prod.category else None,
                variants=variant_list
            )
        )

    return output

@router.post("/matrix-generate", response_model=ProductOut)
async def generate_clothing_matrix(
    req: MatrixGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Instantly generates matrix variants for Clothing / Fashion
    (e.g., 5 Sizes x 3 Colors = 15 SKUs with individual barcodes & stock)
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER", "INVENTORY_CLERK"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    product = Product(
        tenant_id=current_user.tenant_id,
        category_id=req.category_id,
        name=req.name,
        product_type=req.product_type,
        brand=req.brand,
        fabric=req.fabric,
        image_url=req.image_url,
        base_cost_price=req.base_cost_price,
        base_selling_price=req.base_selling_price,
        has_variants=True
    )
    db.add(product)
    await db.flush()

    # Get active branches to seed stock
    branch_query = select(Branch).where(Branch.tenant_id == current_user.tenant_id)
    b_result = await db.execute(branch_query)
    branches = b_result.scalars().all()

    target_branch_id = req.branch_id or (current_user.branch_id if current_user.branch_id else (branches[0].id if branches else None))

    # Clean brand prefix for SKU
    brand_pfx = (req.brand[:3] if req.brand else "VOG").upper()
    name_pfx = req.name.replace(" ", "").upper()[:4]

    for color in req.colors:
        color_pfx = color.replace(" ", "").upper()[:3]
        for size in req.sizes:
            size_clean = str(size).replace(" ", "").upper()
            sku = f"{brand_pfx}-{name_pfx}-{color_pfx}-{size_clean}"
            barcode_str = generate_random_barcode()

            variant = ProductVariant(
                tenant_id=current_user.tenant_id,
                product_id=product.id,
                sku=sku,
                barcode=barcode_str,
                size=size,
                color=color,
                cost_price=req.base_cost_price,
                selling_price=req.base_selling_price,
                mrp=req.mrp,
                min_stock_alert=3
            )
            db.add(variant)
            await db.flush()

            # Seed initial stock in the target showroom / warehouse
            if target_branch_id:
                stock = InventoryStock(
                    tenant_id=current_user.tenant_id,
                    branch_id=target_branch_id,
                    variant_id=variant.id,
                    quantity=req.initial_stock_per_variant,
                    rack_location="Auto-Inflow"
                )
                db.add(stock)

    await db.commit()
    
    # Reload complete product
    products = await list_products(search=product.name, current_user=current_user, db=db)
    return products[0] if products else None

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    req: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update product details (name, brand, fabric, image_url, base prices, category)"""
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER", "INVENTORY_CLERK"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = select(Product).where(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
    res = await db.execute(query)
    prod = res.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if req.name is not None:
        prod.name = req.name.strip()
    if req.brand is not None:
        prod.brand = req.brand.strip()
    if req.fabric is not None:
        prod.fabric = req.fabric.strip()
    if req.image_url is not None:
        prod.image_url = req.image_url
    if req.category_id is not None:
        prod.category_id = req.category_id
    if req.base_selling_price is not None:
        prod.base_selling_price = req.base_selling_price
    if req.base_cost_price is not None:
        prod.base_cost_price = req.base_cost_price

    await db.commit()
    return {"success": True, "message": "Product updated successfully"}

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft-delete / deactivate product from POS catalog"""
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = select(Product).where(Product.id == product_id, Product.tenant_id == current_user.tenant_id)
    res = await db.execute(query)
    prod = res.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod.is_active = False
    await db.commit()
    return {"success": True, "message": "Product removed from catalog"}

@router.put("/variants/{variant_id}")
async def update_variant(
    variant_id: str,
    req: VariantUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update variant details (price, stock quantity, MRP, size, color, barcode)"""
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER", "INVENTORY_CLERK"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = select(ProductVariant).where(ProductVariant.id == variant_id, ProductVariant.tenant_id == current_user.tenant_id)
    res = await db.execute(query)
    var = res.scalar_one_or_none()
    if not var:
        raise HTTPException(status_code=404, detail="Variant not found")

    if req.size is not None:
        var.size = req.size
    if req.color is not None:
        var.color = req.color
    if req.selling_price is not None:
        var.selling_price = req.selling_price
    if req.cost_price is not None:
        var.cost_price = req.cost_price
    if req.mrp is not None:
        var.mrp = req.mrp
    if req.sku is not None:
        var.sku = req.sku.strip()
    if req.barcode is not None:
        var.barcode = req.barcode.strip()

    # If stock_quantity specified, update or create stock record for target branch
    if req.stock_quantity is not None:
        target_branch = req.branch_id or current_user.branch_id
        if target_branch:
            s_query = select(InventoryStock).where(
                InventoryStock.variant_id == variant_id,
                InventoryStock.branch_id == target_branch
            )
            s_res = await db.execute(s_query)
            stock = s_res.scalar_one_or_none()
            if stock:
                stock.quantity = req.stock_quantity
            else:
                stock = InventoryStock(
                    tenant_id=current_user.tenant_id,
                    branch_id=target_branch,
                    variant_id=variant_id,
                    quantity=req.stock_quantity
                )
                db.add(stock)

    await db.commit()
    return {"success": True, "message": "Variant updated successfully"}

@router.delete("/variants/{variant_id}")
async def delete_variant(
    variant_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft-delete / deactivate variant"""
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = select(ProductVariant).where(ProductVariant.id == variant_id, ProductVariant.tenant_id == current_user.tenant_id)
    res = await db.execute(query)
    var = res.scalar_one_or_none()
    if not var:
        raise HTTPException(status_code=404, detail="Variant not found")

    var.is_active = False
    await db.commit()
    return {"success": True, "message": "Variant removed"}

