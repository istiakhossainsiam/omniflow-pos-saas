import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class LeaveType:
    CASUAL = "CASUAL"
    SICK = "SICK"
    ANNUAL = "ANNUAL"
    MATERNITY_PATERNITY = "MATERNITY_PATERNITY"
    UNPAID = "UNPAID"

class LeaveStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class LeaveApplication(Base):
    __tablename__ = "leave_applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    leave_type = Column(String(30), default=LeaveType.CASUAL, nullable=False)
    start_date = Column(String(10), nullable=False) # "YYYY-MM-DD"
    end_date = Column(String(10), nullable=False)   # "YYYY-MM-DD"
    days_count = Column(Integer, default=1)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default=LeaveStatus.PENDING, index=True)

    reviewed_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    branch = relationship("Branch", foreign_keys=[branch_id])

class SalaryAdvance(Base):
    __tablename__ = "salary_advances"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    amount = Column(Float, nullable=False)
    month_year = Column(String(7), nullable=False, index=True) # "YYYY-MM" deduction target month
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING", index=True) # PENDING, APPROVED, DEDUCTED, REJECTED

    approved_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approval_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
