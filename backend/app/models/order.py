import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    loyalty_points = Column(Integer, default=0)
    store_credit_balance = Column(Float, default=0.0) # For garment exchanges / credit refunds
    due_balance = Column(Float, default=0.0) # Customer outstanding due / ledger balance
    total_spent = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer")
    due_payments = relationship("CustomerDuePayment", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    cashier_id = Column(String(36), ForeignKey("users.id"), nullable=True) # Cashier who printed bill (null for online orders)
    salesman_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True) # Sales rep who served customer
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    
    invoice_number = Column(String(50), nullable=False, index=True) # e.g. "INV-DHK01-20261003-0042" or "ECO-VOGUE-202610-001"
    
    subtotal = Column(Float, default=0.0)
    discount_type = Column(String(20), default="FIXED") # PERCENTAGE, FIXED, PROMO_CODE
    discount_amount = Column(Float, default=0.0)
    tax_vat_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    change_due = Column(Float, default=0.0)
    due_amount = Column(Float, default=0.0) # If partial payment, remaining due
    
    # E-Commerce & Omnichannel Order Details
    order_source = Column(String(20), default="POS", index=True) # "POS", "ECOMMERCE"
    shipping_address = Column(Text, nullable=True)
    shipping_city = Column(String(80), nullable=True)
    shipping_zone = Column(String(50), nullable=True) # "INSIDE_DHAKA", "OUTSIDE_DHAKA"
    delivery_charge = Column(Float, default=0.0)
    delivery_status = Column(String(30), default="PENDING", index=True) # PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    customer_notes = Column(Text, nullable=True)

    # Status: COMPLETED, PARKED (Held Cart), CANCELLED, REFUNDED/EXCHANGED
    status = Column(String(30), default="COMPLETED", index=True)
    held_note = Column(String(100), nullable=True) # E.g. "Customer choosing matching dupatta"
    
    # Commission Calculation Status
    commission_calculated = Column(Boolean, default=False)
    commission_earned = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    branch = relationship("Branch", foreign_keys=[branch_id])
    cashier = relationship("User", foreign_keys=[cashier_id])
    salesman = relationship("User", foreign_keys=[salesman_id], back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("PaymentRecord", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(String(36), ForeignKey("product_variants.id"), nullable=False)
    
    product_name = Column(String(150), nullable=False)
    size = Column(String(30), nullable=True)
    color = Column(String(50), nullable=True)
    sku = Column(String(60), nullable=False)
    barcode = Column(String(60), nullable=False)
    
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, default=0.0)
    quantity = Column(Integer, nullable=False, default=1)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    variant = relationship("ProductVariant", back_populates="order_items")


class PaymentRecord(Base):
    """Supports Split Payment: e.g. 2000 Cash + 1500 bKash + 500 Due"""
    __tablename__ = "payment_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Payment Method: CASH, BKASH, NAGAD, ROCKET, CARD, STORE_CREDIT, DUE
    payment_method = Column(String(30), nullable=False, default="CASH")
    amount = Column(Float, nullable=False)
    transaction_ref = Column(String(100), nullable=True) # e.g. bKash TrxID or Card last 4 digits
    
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payments")


class CustomerDuePayment(Base):
    """Tracks customer debt repayments for the Khata / Due Ledger"""
    __tablename__ = "customer_due_payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    cashier_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    receipt_number = Column(String(50), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(30), default="CASH") # CASH, BKASH, NAGAD, CARD
    transaction_ref = Column(String(100), nullable=True)
    notes = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    customer = relationship("Customer", back_populates="due_payments")
    cashier = relationship("User", foreign_keys=[cashier_id])


class OrderExchange(Base):
    """Garment Exchange & Return History"""
    __tablename__ = "order_exchanges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    original_order_id = Column(String(36), ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    cashier_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    exchange_invoice_number = Column(String(50), nullable=False, index=True)
    return_items = Column(JSON, nullable=False) # [{variant_id, product_name, size, color, quantity, unit_price}]
    new_items = Column(JSON, nullable=True) # [{variant_id, product_name, size, color, quantity, unit_price}]
    
    return_total = Column(Float, default=0.0)
    new_total = Column(Float, default=0.0)
    price_difference = Column(Float, default=0.0) # positive: customer pays, negative: store refunds
    
    # CUSTOMER_PAID, CASH_REFUNDED, STORE_CREDIT, DUE_ADJUSTED, EVEN
    adjustment_type = Column(String(30), default="EVEN")
    adjustment_amount = Column(Float, default=0.0)
    payment_method = Column(String(30), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    original_order = relationship("Order", foreign_keys=[original_order_id])
    cashier = relationship("User", foreign_keys=[cashier_id])


class RegisterSession(Base):
    """Daily Register Day-Closing (Z-Report) & Drawer Reconciliation"""
    __tablename__ = "register_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    cashier_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    session_code = Column(String(50), nullable=False, index=True)
    opened_at = Column(DateTime, default=datetime.utcnow, index=True)
    closed_at = Column(DateTime, nullable=True)
    
    opening_cash = Column(Float, default=0.0)
    closing_cash_actual = Column(Float, default=0.0)
    expected_cash = Column(Float, default=0.0)
    cash_discrepancy = Column(Float, default=0.0) # closing_cash_actual - expected_cash
    
    total_sales = Column(Float, default=0.0)
    total_cash_sales = Column(Float, default=0.0)
    total_bkash_sales = Column(Float, default=0.0)
    total_card_sales = Column(Float, default=0.0)
    total_due_sales = Column(Float, default=0.0)
    total_returns_amount = Column(Float, default=0.0)
    total_discounts = Column(Float, default=0.0)
    total_tax = Column(Float, default=0.0)
    orders_count = Column(Integer, default=0)
    total_expenses = Column(Float, default=0.0)
    
    status = Column(String(20), default="OPEN", index=True) # OPEN, CLOSED
    notes = Column(Text, nullable=True)
    z_report_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    cashier = relationship("User", foreign_keys=[cashier_id])
