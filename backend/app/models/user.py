import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole:
    SUPER_ADMIN = "SUPER_ADMIN"       # Platform Owner
    STORE_OWNER = "STORE_OWNER"       # Tenant Super Admin (All branches access)
    STORE_MANAGER = "STORE_MANAGER"   # Showroom Manager (Approvals, Shift, Sales, Target)
    CASHIER = "CASHIER"               # Counter Cashier (Fast Billing, Drawer Close)
    SALESMAN = "SALESMAN"             # Floor Sales Representative (Sales Tracking, Check-in, Requisition)
    INVENTORY_CLERK = "INVENTORY_CLERK" # Warehouse / Stock Keeper

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Showroom-wise Unique Employee ID (e.g. LAVISH-DHK01-SLS-001)
    employee_code = Column(String(50), nullable=False, index=True)
    
    email = Column(String(120), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), default=UserRole.SALESMAN)
    
    # Manager PIN for fast attendance handshake verification on tablet/mobile
    manager_pin = Column(String(10), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    branch = relationship("Branch", back_populates="users")
    profile = relationship("EmployeeProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    targets = relationship("MonthlyTarget", back_populates="user", cascade="all, delete-orphan")
    attendances = relationship("AttendanceRecord", back_populates="user", foreign_keys="AttendanceRecord.user_id", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="salesman", foreign_keys="Order.salesman_id")
    commissions = relationship("CommissionRecord", back_populates="salesman", cascade="all, delete-orphan")


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    designation = Column(String(100), nullable=True)
    department = Column(String(50), default="Sales")  # Sales, Cash Counter, Warehouse, Management
    base_salary = Column(Float, default=0.0)
    commission_rate = Column(Float, default=2.0)  # Default 2% commission on sales
    shift = Column(String(30), default="General")  # Morning, Evening, General
    nid_number = Column(String(50), nullable=True)
    emergency_contact = Column(String(30), nullable=True)
    
    # HRM Salary Allowances & Banking
    mobile_allowance = Column(Float, default=0.0)
    medical_allowance = Column(Float, default=0.0)
    conveyance_allowance = Column(Float, default=0.0)
    bank_name = Column(String(80), nullable=True)
    bank_account_no = Column(String(50), nullable=True)
    mfs_number = Column(String(30), nullable=True) # bKash / Nagad number for salary
    joining_date = Column(String(10), nullable=True) # "YYYY-MM-DD"

    user = relationship("User", back_populates="profile")


class MonthlyTarget(Base):
    """Admin / Manager set monthly sales targets for salespeople"""
    __tablename__ = "monthly_targets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True)
    
    month_year = Column(String(7), nullable=False)  # "2026-10"
    target_amount = Column(Float, nullable=False, default=200000.0) # BDT
    target_items_count = Column(Integer, default=50) # Optional piece target
    bonus_on_achieve = Column(Float, default=5000.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="targets")


class PayrollDisbursement(Base):
    """Monthly Salary Sheet & Disbursement Record for staff"""
    __tablename__ = "payroll_disbursements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    month_year = Column(String(7), nullable=False, index=True)  # "2026-10"
    base_salary = Column(Float, default=0.0)
    
    total_working_days = Column(Integer, default=30)
    present_days = Column(Integer, default=30)
    absent_days = Column(Integer, default=0)
    late_days = Column(Integer, default=0)
    attendance_deduction = Column(Float, default=0.0)

    sales_commission = Column(Float, default=0.0)
    target_bonus = Column(Float, default=0.0)
    other_allowance = Column(Float, default=0.0)
    advance_deduction = Column(Float, default=0.0)

    net_payable = Column(Float, default=0.0)
    payment_status = Column(String(30), default="UNPAID")  # UNPAID, PAID
    payment_method = Column(String(30), default="CASH")    # CASH, BANK, BKASH, NAGAD
    transaction_reference = Column(String(100), nullable=True)

    disbursed_at = Column(DateTime, nullable=True)
    disbursed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    disbursed_by = relationship("User", foreign_keys=[disbursed_by_user_id])

