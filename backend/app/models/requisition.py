import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class StockRequisition(Base):
    """
    Staff / Cashier / Salesman Stock In & Shortage Entry.
    Staff can propose product stock additions or report damaged/short stock.
    Manager / Admin must approve before stock updates.
    """
    __tablename__ = "stock_requisitions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False)
    
    # Request Type: STOCK_IN, STOCK_SHORTAGE, DAMAGED_GOODS, RETURN_RESTOCK
    req_type = Column(String(30), default="STOCK_IN")
    quantity = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    
    # Status: PENDING, APPROVED, REJECTED
    status = Column(String(30), default="PENDING", index=True)
    reviewed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    review_notes = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    
    requested_by = relationship("User", foreign_keys=[requested_by_user_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_user_id])
    variant = relationship("ProductVariant")


class BranchStockTransfer(Base):
    """Inter-branch stock transfer (e.g. Uttara showroom needs 5 pcs of Size L from Dhanmondi warehouse)"""
    __tablename__ = "branch_stock_transfers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    from_branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False)
    to_branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    status = Column(String(30), default="PENDING") # PENDING, IN_TRANSIT, RECEIVED, CANCELLED
    tracking_code = Column(String(40), unique=True, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    from_branch = relationship("Branch", foreign_keys=[from_branch_id])
    to_branch = relationship("Branch", foreign_keys=[to_branch_id])
    variant = relationship("ProductVariant")
