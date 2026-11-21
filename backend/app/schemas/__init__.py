from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# ----------------- AUTH & USER SCHEMAS -----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class LoginRequest(BaseModel):
    email_or_code: str
    password: str
    tenant_slug: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "SALESMAN"
    branch_id: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = "Sales"
    base_salary: Optional[float] = 0.0
    commission_rate: Optional[float] = 2.0
    manager_pin: Optional[str] = "1234"

class EmployeeProfileOut(BaseModel):
    id: str
    designation: Optional[str]
    department: Optional[str]
    base_salary: float
    commission_rate: float
    shift: str

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: str
    tenant_id: str
    branch_id: Optional[str]
    employee_code: str
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    branch_name: Optional[str] = None
    profile: Optional[EmployeeProfileOut] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    branch_id: Optional[str] = None
    password: Optional[str] = None
    department: Optional[str] = None
    base_salary: Optional[float] = None
    commission_rate: Optional[float] = None
    manager_pin: Optional[str] = None
    is_active: Optional[bool] = None

# ----------------- TENANT & BRANCH SCHEMAS -----------------
class BranchCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    is_warehouse: bool = False

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_warehouse: Optional[bool] = None
    is_active: Optional[bool] = None

class BranchOut(BaseModel):
    id: str
    tenant_id: str
    name: str
    code: str
    address: Optional[str]
    phone: Optional[str]
    is_warehouse: bool
    is_active: bool

    class Config:
        from_attributes = True

class AttendancePolicyUpdate(BaseModel):
    is_enabled: bool = True
    require_manager_handshake: bool = True
    verification_mode: str = "QR_OR_PIN" # QR_ONLY, PIN_ONLY, QR_OR_PIN, ONE_CLICK
    shift_start_time: str = "09:30"
    shift_end_time: str = "19:30"
    grace_period_minutes: int = 15
    half_day_late_minutes: int = 60
    late_penalty_type: str = "INCENTIVE_DEDUCTION"
    penalty_deduction_amount: int = 100

class AttendancePolicyOut(AttendancePolicyUpdate):
    id: str
    tenant_id: str

    class Config:
        from_attributes = True

class TenantSettingsUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    theme_color: Optional[str] = "emerald"
    brand_subtitle: Optional[str] = None
    currency_symbol: Optional[str] = "৳"
    is_vat_enabled: Optional[bool] = True
    vat_percentage: Optional[float] = 5.0
    receipt_header: Optional[str] = None
    receipt_tagline: Optional[str] = None
    receipt_address: Optional[str] = None
    receipt_phone: Optional[str] = None
    receipt_vat_no: Optional[str] = None
    receipt_exchange_policy: Optional[str] = None
    receipt_footer_note: Optional[str] = None
    receipt_show_salesman: Optional[bool] = True
    receipt_show_loyalty: Optional[bool] = True
    receipt_show_tax: Optional[bool] = True
    receipt_show_barcode: Optional[bool] = True
    barcode_brand_title: Optional[str] = None
    barcode_tagline: Optional[str] = None
    barcode_footer_note: Optional[str] = None
    barcode_show_price: Optional[bool] = True
    barcode_show_mrp: Optional[bool] = True
    barcode_show_size_color: Optional[bool] = True

class TenantOut(BaseModel):
    id: str
    name: str
    slug: str
    email: str
    phone: Optional[str]
    currency: str
    logo_url: Optional[str]
    subscription_plan: str
    features: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None
    branches: List[BranchOut] = []
    attendance_policy: Optional[AttendancePolicyOut] = None

    class Config:
        from_attributes = True

# ----------------- PRODUCT & MATRIX SCHEMAS -----------------
class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    image_url: Optional[str]

    class Config:
        from_attributes = True

class VariantStockOut(BaseModel):
    branch_id: str
    branch_name: str
    branch_code: str
    quantity: int
    rack_location: Optional[str]

class VariantOut(BaseModel):
    id: str
    product_id: str
    sku: str
    barcode: str
    size: Optional[str]
    color: Optional[str]
    color_code: Optional[str]
    cost_price: float
    selling_price: float
    mrp: float
    min_stock_alert: int
    is_active: bool
    total_stock: int = 0
    branch_stocks: List[VariantStockOut] = []
    barcode_base64: Optional[str] = None
    qr_code_base64: Optional[str] = None

    class Config:
        from_attributes = True

class ProductOut(BaseModel):
    id: str
    name: str
    product_type: str
    brand: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    base_cost_price: float
    base_selling_price: float
    has_variants: bool
    fabric: Optional[str]
    unit: str
    category_id: Optional[str]
    category_name: Optional[str] = None
    variants: List[VariantOut] = []

    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    fabric: Optional[str] = None
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    base_selling_price: Optional[float] = None
    base_cost_price: Optional[float] = None

class VariantUpdate(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    selling_price: Optional[float] = None
    cost_price: Optional[float] = None
    mrp: Optional[float] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    branch_id: Optional[str] = None
    stock_quantity: Optional[int] = None

class MatrixGenerateRequest(BaseModel):
    name: str
    category_id: Optional[str] = None
    product_type: str = "CLOTHING"
    brand: Optional[str] = None
    fabric: Optional[str] = "100% Cotton"
    image_url: Optional[str] = None
    base_cost_price: float
    base_selling_price: float
    mrp: float
    sizes: List[str] # ["S", "M", "L", "XL", "XXL"]
    colors: List[str] # ["Navy Blue", "Maroon", "White"]
    initial_stock_per_variant: int = 10
    branch_id: Optional[str] = None

# ----------------- CUSTOMER & LOYALTY SCHEMAS -----------------
class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerOut(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    loyalty_points: int = 0
    store_credit_balance: float = 0.0
    total_spent: float = 0.0

    class Config:
        from_attributes = True

# ----------------- POS & ORDER SCHEMAS -----------------
class CartItemSchema(BaseModel):
    variant_id: str
    quantity: int = 1
    unit_price: float
    discount: float = 0.0
    barcode: Optional[str] = None
    sku: Optional[str] = None

class PaymentRecordSchema(BaseModel):
    payment_method: str = "CASH" # CASH, BKASH, NAGAD, CARD, STORE_CREDIT
    amount: float
    transaction_ref: Optional[str] = None

class OrderCreateRequest(BaseModel):
    branch_id: str
    salesman_id: Optional[str] = None # Attributed sales rep for commission
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    items: List[CartItemSchema]
    discount_amount: float = 0.0
    tax_vat_amount: float = 0.0
    payments: List[PaymentRecordSchema]
    is_parked: bool = False
    parked_note: Optional[str] = None

class OrderItemOut(BaseModel):
    id: str
    product_name: str
    size: Optional[str]
    color: Optional[str]
    sku: str
    barcode: str
    unit_price: float
    quantity: int
    discount: float
    total: float

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: str
    invoice_number: str
    branch_id: str
    branch_name: Optional[str] = None
    cashier_name: str
    salesman_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    subtotal: float
    discount_amount: float
    tax_vat_amount: float
    total_amount: float
    paid_amount: float
    change_due: float
    status: str
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True

# ----------------- ATTENDANCE & HANDSHAKE SCHEMAS -----------------
class CheckInRequest(BaseModel):
    branch_id: str
    verification_token: Optional[str] = None # Scanned from Manager QR
    manager_pin: Optional[str] = None       # Entered by Manager
    device_info: Optional[str] = None

class AttendanceRecordOut(BaseModel):
    id: str
    user_id: str
    employee_name: str
    employee_code: str
    branch_name: str
    date_str: str
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    status: str
    late_minutes: int
    is_verified_by_manager: bool
    verified_by_name: Optional[str]
    verification_method: Optional[str]

    class Config:
        from_attributes = True

class VerificationSessionOut(BaseModel):
    token: str
    quick_pin: str
    qr_code_base64: str
    expires_at: datetime
    branch_id: str
    branch_name: str

# ----------------- INCENTIVE & TARGET SCHEMAS -----------------
class TargetUpdate(BaseModel):
    user_id: str
    month_year: str # "2026-10"
    target_amount: float
    target_items_count: int = 50
    bonus_on_achieve: float = 5000.0

class SalesmanDashboardOut(BaseModel):
    user_id: Optional[str] = None
    salesman_name: str
    employee_code: str
    branch_id: Optional[str] = None
    branch_name: str
    month_year: str
    today_sales: float
    today_orders_count: int
    month_target: float
    month_sales: float
    achievement_percentage: float
    estimated_commission_earned: float
    attendance_status_today: str
    recent_sales: List[OrderOut] = []

# ----------------- REQUISITION SCHEMAS -----------------
class RequisitionCreate(BaseModel):
    variant_id: str
    branch_id: str
    req_type: str = "STOCK_IN" # STOCK_IN, STOCK_SHORTAGE, DAMAGED_GOODS
    quantity: int
    reason: Optional[str] = None

class RequisitionReview(BaseModel):
    status: str # APPROVED, REJECTED
    review_notes: Optional[str] = None

class RequisitionOut(BaseModel):
    id: str
    req_type: str
    quantity: int
    reason: Optional[str]
    status: str
    product_name: str
    size: Optional[str]
    color: Optional[str]
    sku: str
    requested_by_name: str
    branch_name: str
    created_at: datetime
    reviewed_by_name: Optional[str] = None
    review_notes: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- E-COMMERCE STOREFRONT SCHEMAS -----------------
class StorefrontVariantOut(BaseModel):
    id: str
    sku: str
    barcode: str
    size: Optional[str]
    color: Optional[str]
    color_code: Optional[str]
    selling_price: float
    mrp: float
    total_stock: int
    is_in_stock: bool

class StorefrontProductOut(BaseModel):
    id: str
    name: str
    product_type: str
    brand: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    base_selling_price: float
    fabric: Optional[str]
    unit: str
    category_id: Optional[str]
    category_name: Optional[str]
    variants: List[StorefrontVariantOut] = []

class StorefrontInfoOut(BaseModel):
    tenant_id: str
    name: str
    slug: str
    custom_domain: Optional[str] = None
    currency: str = "BDT"
    currency_symbol: str = "৳"
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    ecommerce_settings: Dict[str, Any]
    categories: List[CategoryOut] = []
    products: List[StorefrontProductOut] = []

class EcommerceOrderCreate(BaseModel):
    tenant_slug_or_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    shipping_address: str
    shipping_city: Optional[str] = "Dhaka"
    shipping_zone: str = "INSIDE_DHAKA" # INSIDE_DHAKA, OUTSIDE_DHAKA
    delivery_charge: float = 60.0
    payment_method: str = "COD" # COD, BKASH, NAGAD
    transaction_ref: Optional[str] = None
    customer_notes: Optional[str] = None
    items: List[CartItemSchema]

class EcommerceSettingsUpdate(BaseModel):
    custom_domain: Optional[str] = None
    ecommerce_settings: Dict[str, Any]

# ----------------- HRM SUITE SCHEMAS -----------------
class LeaveCreateRequest(BaseModel):
    user_id: Optional[str] = None
    leave_type: str = "CASUAL" # CASUAL, SICK, ANNUAL, UNPAID, MATERNITY_PATERNITY
    start_date: str # "YYYY-MM-DD"
    end_date: str   # "YYYY-MM-DD"
    days_count: Optional[int] = 1
    reason: str

class LeaveReviewRequest(BaseModel):
    status: str # APPROVED, REJECTED
    review_notes: Optional[str] = None

class LeaveOut(BaseModel):
    id: str
    user_id: str
    employee_name: str
    employee_code: str
    branch_name: Optional[str] = None
    leave_type: str
    start_date: str
    end_date: str
    days_count: int
    reason: str
    status: str
    review_notes: Optional[str] = None
    reviewed_by_name: Optional[str] = None
    created_at: datetime

class SalaryAdvanceCreateRequest(BaseModel):
    user_id: Optional[str] = None
    amount: float
    month_year: str # "YYYY-MM"
    reason: str

class SalaryAdvanceReviewRequest(BaseModel):
    status: str # APPROVED, REJECTED
    approval_notes: Optional[str] = None

class SalaryAdvanceOut(BaseModel):
    id: str
    user_id: str
    employee_name: str
    employee_code: str
    amount: float
    month_year: str
    reason: str
    status: str
    approval_notes: Optional[str] = None
    approved_by_name: Optional[str] = None
    created_at: datetime

class EmployeeProfileUpdateHRM(BaseModel):
    designation: Optional[str] = None
    department: Optional[str] = None
    base_salary: Optional[float] = None
    mobile_allowance: Optional[float] = None
    medical_allowance: Optional[float] = None
    conveyance_allowance: Optional[float] = None
    commission_rate: Optional[float] = None
    shift: Optional[str] = None
    nid_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    mfs_number: Optional[str] = None
    joining_date: Optional[str] = None

class PayrollDisburseRequest(BaseModel):
    user_id: Optional[str] = None # None for all eligible staff
    month_year: str # "YYYY-MM"
    branch_id: Optional[str] = None
    payment_method: str = "CASH" # CASH, BANK, BKASH, NAGAD
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

