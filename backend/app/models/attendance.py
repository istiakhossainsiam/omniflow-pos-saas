import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    date_str = Column(String(10), nullable=False, index=True) # "2026-10-03"
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    
    # Status: ON_TIME, LATE, HALF_DAY, ABSENT, PENDING_VERIFICATION
    status = Column(String(30), default="PENDING_VERIFICATION", index=True)
    late_minutes = Column(Integer, default=0)
    
    # Secure Handshake Details
    is_verified_by_manager = Column(Boolean, default=False)
    verified_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    verification_method = Column(String(30), nullable=True) # MANAGER_QR_SCAN, MANAGER_PIN, SUPER_ADMIN_OVERRIDE
    verification_timestamp = Column(DateTime, nullable=True)
    
    # Device / Location Info (Optional GPS / IP)
    ip_address = Column(String(50), nullable=True)
    device_info = Column(String(200), nullable=True)
    notes = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="attendances", foreign_keys=[user_id])
    verified_by_manager_user = relationship("User", foreign_keys=[verified_by_user_id])


class VerificationSession(Base):
    """Dynamic rotating QR / Security PIN token generated on Store Manager device for Salesman check-in handshake"""
    __tablename__ = "verification_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    manager_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    token = Column(String(64), unique=True, nullable=False, index=True)
    quick_pin = Column(String(6), nullable=False) # 6 digit OTP/PIN (e.g. 482910)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
