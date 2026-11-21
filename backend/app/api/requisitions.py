import uuid
import random
import string
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.product import ProductVariant, InventoryStock
from app.models.tenant import Branch
from app.models.requisition import StockRequisition, BranchStockTransfer
from app.schemas import (
    RequisitionCreate, RequisitionReview, RequisitionOut
)

router = APIRouter(prefix="/requisitions", tags=["Stock Requisitions & Transfers"])

@router.get("", response_model=List[RequisitionOut])
async def list_requisitions(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(StockRequisition)
        .options(
            selectinload(StockRequisition.variant).selectinload(ProductVariant.product),
            selectinload(StockRequisition.requested_by).selectinload(User.branch),
            selectinload(StockRequisition.reviewed_by)
        )
        .where(StockRequisition.tenant_id == current_user.tenant_id)
        .order_by(StockRequisition.created_at.desc())
    )
    if branch_id:
        query = query.where(StockRequisition.branch_id == branch_id)
    if status:
        query = query.where(StockRequisition.status == status)

    result = await db.execute(query)
    reqs = result.scalars().all()

    output = []
    for r in reqs:
        output.append(
            RequisitionOut(
                id=r.id,
                req_type=r.req_type,
                quantity=r.quantity,
                reason=r.reason,
                status=r.status,
                product_name=r.variant.product.name if (r.variant and r.variant.product) else "Product",
                size=r.variant.size if r.variant else None,
                color=r.variant.color if r.variant else None,
                sku=r.variant.sku if r.variant else "N/A",
                requested_by_name=r.requested_by.full_name if r.requested_by else "Staff",
                branch_name=r.requested_by.branch.name if (r.requested_by and r.requested_by.branch) else "Branch",
                created_at=r.created_at,
                reviewed_by_name=r.reviewed_by.full_name if r.reviewed_by else None,
                review_notes=r.review_notes
            )
        )
    return output

@router.post("", response_model=RequisitionOut)
async def create_stock_requisition(
    req: RequisitionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Salesman / Cashier requests stock shortage addition or damaged item reporting.
    Requires Manager Approval.
    """
    branch_id = req.branch_id or current_user.branch_id
    if not branch_id:
        raise HTTPException(status_code=400, detail="Branch required")

    v_res = await db.execute(select(ProductVariant).where(ProductVariant.id == req.variant_id))
    variant = v_res.scalar_one_or_none()
    if not variant:
        raise HTTPException(status_code=404, detail="Product variant not found")

    requisition = StockRequisition(
        tenant_id=current_user.tenant_id,
        branch_id=branch_id,
        requested_by_user_id=current_user.id,
        variant_id=variant.id,
        req_type=req.req_type,
        quantity=req.quantity,
        reason=req.reason,
        status="PENDING"
    )
    db.add(requisition)
    await db.commit()
    await db.refresh(requisition)

    # Reload with relationships
    return (await list_requisitions(branch_id=branch_id, current_user=current_user, db=db))[0]

@router.post("/{req_id}/review")
async def review_stock_requisition(
    req_id: str,
    review: RequisitionReview,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manager / Admin 1-Click Approve or Reject.
    On approval: automatically updates branch stock.
    """
    if current_user.role not in ["STORE_OWNER", "SUPER_ADMIN", "STORE_MANAGER", "INVENTORY_CLERK"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    r_res = await db.execute(
        select(StockRequisition).where(
            StockRequisition.id == req_id,
            StockRequisition.tenant_id == current_user.tenant_id
        )
    )
    req_obj = r_res.scalar_one_or_none()
    if not req_obj:
        raise HTTPException(status_code=404, detail="Requisition not found")

    if req_obj.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Requisition is already {req_obj.status}")

    req_obj.status = review.status.upper()
    req_obj.reviewed_by_user_id = current_user.id
    req_obj.review_notes = review.review_notes
    req_obj.reviewed_at = datetime.utcnow()

    # If APPROVED: Update Inventory Stock
    if req_obj.status == "APPROVED":
        s_res = await db.execute(
            select(InventoryStock).where(
                InventoryStock.branch_id == req_obj.branch_id,
                InventoryStock.variant_id == req_obj.variant_id
            )
        )
        stock = s_res.scalar_one_or_none()
        if not stock:
            stock = InventoryStock(
                tenant_id=current_user.tenant_id,
                branch_id=req_obj.branch_id,
                variant_id=req_obj.variant_id,
                quantity=0
            )
            db.add(stock)

        if req_obj.req_type in ["STOCK_IN", "RETURN_RESTOCK"]:
            stock.quantity += req_obj.quantity
        elif req_obj.req_type in ["STOCK_SHORTAGE", "DAMAGED_GOODS"]:
            stock.quantity = max(0, stock.quantity - req_obj.quantity)

    await db.commit()
    return {"success": True, "message": f"Requisition {req_obj.status} successfully!"}


# =========================================================================
# FEATURE 4: SHOWROOM STOCK TRANSFER CHALLAN WORKFLOW
# =========================================================================

@router.get("/transfers")
async def list_stock_transfers(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List inter-branch stock transfers and delivery challans.
    """
    query = (
        select(BranchStockTransfer)
        .options(
            selectinload(BranchStockTransfer.from_branch),
            selectinload(BranchStockTransfer.to_branch),
            selectinload(BranchStockTransfer.variant).selectinload(ProductVariant.product)
        )
        .where(BranchStockTransfer.tenant_id == current_user.tenant_id)
        .order_by(BranchStockTransfer.created_at.desc())
    )
    if branch_id:
        query = query.where(
            (BranchStockTransfer.from_branch_id == branch_id) | (BranchStockTransfer.to_branch_id == branch_id)
        )
    if status:
        query = query.where(BranchStockTransfer.status == status)

    result = await db.execute(query)
    transfers = result.scalars().all()

    output = []
    for t in transfers:
        output.append({
            "id": t.id,
            "tracking_code": t.tracking_code,
            "from_branch_id": t.from_branch_id,
            "from_branch_name": t.from_branch.name if t.from_branch else "Origin",
            "to_branch_id": t.to_branch_id,
            "to_branch_name": t.to_branch.name if t.to_branch else "Destination",
            "variant_id": t.variant_id,
            "product_name": t.variant.product.name if (t.variant and t.variant.product) else "Product",
            "size": t.variant.size if t.variant else None,
            "color": t.variant.color if t.variant else None,
            "sku": t.variant.sku if t.variant else "N/A",
            "quantity": t.quantity,
            "status": t.status,
            "notes": t.notes,
            "created_at": t.created_at.strftime("%Y-%m-%d %I:%M %p") if t.created_at else ""
        })
    return output


@router.post("/transfers")
async def create_stock_transfer(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new Stock Transfer Challan. Deducts stock from origin showroom and marks as IN_TRANSIT.
    """
    from_branch_id = req.get("from_branch_id")
    to_branch_id = req.get("to_branch_id")
    variant_id = req.get("variant_id")
    quantity = int(req.get("quantity", 1))
    notes = req.get("notes", "")

    if not from_branch_id or not to_branch_id or not variant_id:
        raise HTTPException(status_code=400, detail="Origin, Destination, and Product Variant required")
    if from_branch_id == to_branch_id:
        raise HTTPException(status_code=400, detail="Cannot transfer stock to the same showroom")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Transfer quantity must be at least 1")

    # Check origin stock
    s_res = await db.execute(
        select(InventoryStock).where(
            InventoryStock.branch_id == from_branch_id,
            InventoryStock.variant_id == variant_id
        )
    )
    origin_stock = s_res.scalar_one_or_none()
    if not origin_stock or origin_stock.quantity < quantity:
        avail = origin_stock.quantity if origin_stock else 0
        raise HTTPException(status_code=400, detail=f"Insufficient stock at origin showroom (Available: {avail})")

    # Deduct origin stock (put into transit)
    origin_stock.quantity -= quantity

    challan_code = f"CHL-{datetime.utcnow().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

    transfer = BranchStockTransfer(
        tenant_id=current_user.tenant_id,
        from_branch_id=from_branch_id,
        to_branch_id=to_branch_id,
        variant_id=variant_id,
        quantity=quantity,
        status="IN_TRANSIT",
        tracking_code=challan_code,
        notes=notes
    )
    db.add(transfer)
    await db.commit()
    await db.refresh(transfer)

    return {
        "success": True,
        "message": f"Transfer Challan {challan_code} dispatched successfully!",
        "tracking_code": challan_code,
        "transfer_id": transfer.id
    }


@router.post("/transfers/{transfer_id}/receive")
async def receive_stock_transfer(
    transfer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Destination showroom acknowledges receipt. Adds stock to destination branch and marks as RECEIVED.
    """
    t_res = await db.execute(
        select(BranchStockTransfer).where(
            BranchStockTransfer.id == transfer_id,
            BranchStockTransfer.tenant_id == current_user.tenant_id
        )
    )
    transfer = t_res.scalar_one_or_none()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer challan not found")
    if transfer.status != "IN_TRANSIT":
        raise HTTPException(status_code=400, detail=f"Transfer is already {transfer.status}")

    # Increase stock at destination
    dest_res = await db.execute(
        select(InventoryStock).where(
            InventoryStock.branch_id == transfer.to_branch_id,
            InventoryStock.variant_id == transfer.variant_id
        )
    )
    dest_stock = dest_res.scalar_one_or_none()
    if dest_stock:
        dest_stock.quantity += transfer.quantity
    else:
        db.add(InventoryStock(
            tenant_id=current_user.tenant_id,
            branch_id=transfer.to_branch_id,
            variant_id=transfer.variant_id,
            quantity=transfer.quantity
        ))

    transfer.status = "RECEIVED"
    await db.commit()

    return {"success": True, "message": f"Transfer Challan {transfer.tracking_code} received & stock updated!"}


@router.post("/transfers/{transfer_id}/cancel")
async def cancel_stock_transfer(
    transfer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancels an in-transit transfer and restores stock back to origin showroom.
    """
    t_res = await db.execute(
        select(BranchStockTransfer).where(
            BranchStockTransfer.id == transfer_id,
            BranchStockTransfer.tenant_id == current_user.tenant_id
        )
    )
    transfer = t_res.scalar_one_or_none()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    if transfer.status != "IN_TRANSIT":
        raise HTTPException(status_code=400, detail="Only in-transit transfers can be cancelled")

    # Restore stock to origin
    orig_res = await db.execute(
        select(InventoryStock).where(
            InventoryStock.branch_id == transfer.from_branch_id,
            InventoryStock.variant_id == transfer.variant_id
        )
    )
    origin_stock = orig_res.scalar_one_or_none()
    if origin_stock:
        origin_stock.quantity += transfer.quantity
    else:
        db.add(InventoryStock(
            tenant_id=current_user.tenant_id,
            branch_id=transfer.from_branch_id,
            variant_id=transfer.variant_id,
            quantity=transfer.quantity
        ))

    transfer.status = "CANCELLED"
    await db.commit()

    return {"success": True, "message": f"Transfer {transfer.tracking_code} cancelled and stock returned to origin."}
