import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class IncentiveRule(Base):
    """Configurable incentive structure per tenant / showroom"""
    __tablename__ = "incentive_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(100), nullable=False) # e.g. "Standard Sales 2.5% Commission" or "High-Margin Bonus"
    rule_type = Column(String(30), default="PERCENTAGE") # PERCENTAGE, FIXED_PER_ITEM, TIERED_TARGET
    
    percentage_rate = Column(Float, default=2.5) # e.g. 2.5%
    fixed_bonus_per_item = Column(Float, default=0.0) # e.g. 50 BDT on select garments
    
    # Minimum monthly target required before incentives activate
    min_sales_threshold = Column(Float, default=50000.0)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommissionRecord(Base):
    """Ledger of sales commissions earned by salesmen"""
    __tablename__ = "commission_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    salesman_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    sale_amount = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    status = Column(String(30), default="APPROVED") # PENDING, APPROVED, PAID, CANCELLED
    
    month_year = Column(String(7), nullable=False) # "2026-10"
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    salesman = relationship("User", back_populates="commissions")

