import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    slug = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    currency = Column(String(10), default="BDT")
    logo_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    subscription_plan = Column(String(50), default="PRO")  # FREE, PRO, ENTERPRISE
    custom_domain = Column(String(150), unique=True, index=True, nullable=True) # e.g. shop.brand.com or brand.bd
    
    # Feature flags for customizable tenant modules
    features = Column(JSON, default=lambda: {
        "attendance_handshake": True,
        "incentive_module": True,
        "inter_branch_transfer": True,
        "staff_stock_requisition": True,
        "clothing_matrix": True,
        "barcode_generator": True,
        "ecommerce_storefront": True,
        "hrm_module": True
    })

    # Individual Tenant E-Commerce Website Settings & Content
    ecommerce_settings = Column(JSON, default=lambda: {
        "is_enabled": True,
        "store_title": "Vogue Lifestyle Online Store",
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
    })

    # Customizable UI & Print Settings (Receipt, Barcode, Theme)
    settings = Column(JSON, default=lambda: {
        "theme_color": "emerald",
        "brand_subtitle": "Exclusive Fashion & Lifestyle",
        "currency_symbol": "৳",
        "receipt_header": "VOGUE LIFESTYLE",
        "receipt_tagline": "Premium Fashion & Apparel Store",
        "receipt_address": "House 42, Road 7/A, Dhanmondi, Dhaka",
        "receipt_phone": "+880 1811-223344",
        "receipt_vat_no": "BIN: 002345678-0101",
        "receipt_exchange_policy": "*** 7 DAYS EXCHANGE WITH MONEY RECEIPT ***",
        "receipt_footer_note": "Thank you for shopping with us! Please visit again.",
        "receipt_show_salesman": True,
        "receipt_show_loyalty": True,
        "receipt_show_tax": True,
        "receipt_show_barcode": True,
        "barcode_brand_title": "VOGUE FASHION",
        "barcode_tagline": "Quality Garments",
        "barcode_footer_note": "Hotline: 01711-000111",
        "barcode_show_price": True,
        "barcode_show_mrp": True,
        "barcode_show_size_color": True,
    })

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branches = relationship("Branch", back_populates="tenant", cascade="all, delete-orphan")
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="tenant", cascade="all, delete-orphan")
    attendance_policy = relationship("AttendancePolicy", back_populates="tenant", uselist=False, cascade="all, delete-orphan")


class Branch(Base):
    """Represents a Showroom, Warehouse, or Outlet of a Tenant"""
    __tablename__ = "branches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g. "Dhanmondi Flagship Showroom"
    code = Column(String(20), nullable=False)  # e.g. "DHK01"
    address = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    is_warehouse = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="branches")
    users = relationship("User", back_populates="branch")
    stocks = relationship("InventoryStock", back_populates="branch", cascade="all, delete-orphan")


class AttendancePolicy(Base):
    """Configurable attendance rules per tenant/store"""
    __tablename__ = "attendance_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    is_enabled = Column(Boolean, default=True)  # Optional feature toggle
    require_manager_handshake = Column(Boolean, default=True) # Salesman checks in -> Manager verifies
    verification_mode = Column(String(30), default="QR_OR_PIN") # QR_ONLY, PIN_ONLY, QR_OR_PIN, ONE_CLICK
    
    shift_start_time = Column(String(10), default="09:30")  # HH:MM format
    shift_end_time = Column(String(10), default="19:30")
    grace_period_minutes = Column(Integer, default=15)  # Minutes after shift start before marked late
    half_day_late_minutes = Column(Integer, default=60)  # >60 mins late counts as half-day
    
    late_penalty_type = Column(String(30), default="INCENTIVE_DEDUCTION") # NONE, INCENTIVE_DEDUCTION, STRIKE_COUNT
    penalty_deduction_amount = Column(Integer, default=100) # e.g. 100 BDT or 3 strikes = 1 day leave

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="attendance_policy")


class SubscriptionPlan(Base):
    """Customizable monthly SaaS subscription plans created by SuperAdmin"""
    __tablename__ = "subscription_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)  # e.g. "Enterprise Omnichannel"
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "ENTERPRISE"
    monthly_price = Column(Integer, default=15000)  # in BDT
    currency = Column(String(10), default="BDT")
    max_branches = Column(Integer, default=10)
    max_users = Column(Integer, default=30)
    description = Column(Text, nullable=True)
    is_popular = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    features = Column(JSON, default=lambda: {
        "clothing_matrix": True,
        "attendance_handshake": True,
        "inter_branch_transfer": True,
        "staff_incentive": True,
        "custom_branding": True,
        "priority_support": True,
        "api_access": True
    })

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LandingContent(Base):
    """Dynamic Landing Page CMS & SEO Configuration managed by SuperAdmin"""
    __tablename__ = "landing_contents"

    id = Column(String(36), primary_key=True, default="default")
    
    # SEO & Structured Schema Data
    seo_meta = Column(JSON, default=lambda: {
        "title": "OmniFlow POS - Multi-Tenant Fashion & Retail Cloud ERP | Bangladesh",
        "description": "High-velocity multi-showroom POS and apparel matrix engine for Bangladesh retail fashion brands. Features 2FA biometric attendance, thermal barcodes & zero-storage privacy.",
        "keywords": "POS Bangladesh, Retail POS Dhaka, Clothing Matrix POS, Fashion ERP Bangladesh, Multi-Showroom Inventory, Thermal Barcode Print, 2FA Biometric Attendance, SuperAdmin SaaS POS",
        "og_title": "OmniFlow POS - The Next-Gen Retail & Apparel Cloud Engine",
        "og_description": "Hyper-fast POS, garment matrix hangtag generator, 2FA staff attendance & multi-branch stock transfers for Bangladesh retail chains.",
        "og_image": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
        "canonical_url": "https://omniflow.pos.bd",
        "author": "OmniFlow Cloud Systems Dhaka",
        "robots": "index, follow"
    })

    # Top Announcement Banner
    announcement = Column(JSON, default=lambda: {
        "is_visible": True,
        "badge": "NEW 2026",
        "text": "OmniFlow POS 2.0: Multi-Tenant Garment Matrix & Zero-Storage Privacy Engine Live",
        "link_text": "Explore Demo →"
    })

    # Main Hero Section
    hero = Column(JSON, default=lambda: {
        "eyebrow": "Built specifically for Bangladesh Retail & Multi-Showroom Chains",
        "headline_line1": "The Modern Multi-Tenant",
        "headline_gradient": "Fashion POS & Matrix ERP",
        "subheadline": "Eliminate operational chaos with instant garment hangtag barcodes, 2FA biometric attendance, split-payment fast billing, and inter-branch stock requisitions. Completely decoupled multi-tenant architecture with custom UI themes.",
        "cta_primary_text": "Launch Showroom POS",
        "cta_secondary_text": "View Monthly Plans",
        "stats": [
            {"value": "< 8ms", "label": "Sub-Second Billing"},
            {"value": "0 Bytes", "label": "Zero-Storage Privacy"},
            {"value": "100% ACID", "label": "Isolated Multi-Tenant"},
            {"value": "GMT+6", "label": "Dhaka NTP Synchronized"}
        ]
    })

    # Interactive Capabilities / Modules
    features = Column(JSON, default=lambda: [
        {
            "id": "matrix",
            "tab_label": "👗 Garment Size-Color Matrix",
            "badge": "Retail Garments & Apparel Matrix",
            "title": "One-Click Matrix Generation for Apparel Chains",
            "description": "Stop creating individual SKUs manually. Select your Fabric GSM, Season, Gender, Size Range (S, M, L, XL, XXL) and Color Palette to instantly generate dozens of unique barcode hangtags with MRP & Size indicators.",
            "bullets": [
                "Instant thermal hangtag barcode label printing (50mm × 35mm format)",
                "Live showroom stock matrix breakdown across all branch outlets",
                "Automated SKU formulation based on GSM and category codes"
            ]
        },
        {
            "id": "pos",
            "tab_label": "⚡ Fast POS & Split Payments",
            "badge": "High-Velocity Counter POS",
            "title": "Sub-Second POS Billing with Multi-Payment Split",
            "description": "Designed for peak retail rush hours. Scan barcodes via laser scanner, webcam, or instant SKU lookup. Split single invoices seamlessly across Cash, bKash, Nagad, and POS Debit/Credit cards with automatic change calculation.",
            "bullets": [
                "Real-time cart adjustment, item quantity modifier, and instant line deletion",
                "Customizable thermal receipt header, footer notes, and store VAT BIN numbers"
            ]
        },
        {
            "id": "attendance",
            "tab_label": "🛡️ 2FA QR Attendance & Incentive",
            "badge": "2FA Biometric Handshake",
            "title": "Zero-Storage Privacy & Staff Incentive Engine",
            "description": "Prevent proxy check-ins. Salesmen generate dynamic time-expiring attendance QR codes on their mobile, which are verified instantly by Store Managers. Attendance data drives monthly sales targets and automated commission payouts.",
            "bullets": [
                "Zero-Storage Privacy Protocol: Face camera captures are processed in RAM and discarded instantly",
                "Late grace periods and automated incentive commission calculations"
            ]
        },
        {
            "id": "transfers",
            "tab_label": "🚚 Inter-Branch Stock Requisition",
            "badge": "Inter-Branch Inventory Fleet",
            "title": "Showroom-to-Warehouse Stock Requisition",
            "description": "When a showroom runs low on specific garment sizes, store staff create instant digital requisitions. Central warehouse managers review, approve, and dispatch stock with transit tracking and automatic inventory handoffs.",
            "bullets": [
                "Eliminates garment stockouts in high-traffic outlets",
                "Real-time transfer verification upon physical arrival at showroom"
            ]
        }
    ])

    # Architecture Section
    architecture = Column(JSON, default=lambda: {
        "eyebrow": "Multi-Tenant Isolation",
        "title": "Each Tenant Gets an Isolated, Custom-Branded Universe",
        "subtitle": "Unlike legacy POS software, OmniFlow completely isolates tenant visual themes, receipt branding, and database transactions.",
        "pillars": [
            {
                "title": "Decoupled SuperAdmin Console",
                "description": "SuperAdmin operates on a standalone Midnight & Gold master console. Dedicated solely to tenant onboarding, plan pricing creation, global users, and server telemetry.",
                "badge": "Master Control"
            },
            {
                "title": "Dynamic Brand Whitelabeling",
                "description": "Each brand configures their custom app surface background tone (Slate, Cream, Mint, Sky, Dark), receipt header tagline, logo, and VAT identification numbers.",
                "badge": "Custom UI Themes"
            },
            {
                "title": "Strict ACID Data Isolation",
                "description": "Zero cross-tenant data leakage. Every transaction, sales history, employee account, and stock transfer is scoped strictly to the respective brand tenant.",
                "badge": "100% Security"
            }
        ]
    })

    # Testimonials / Client Reviews
    testimonials = Column(JSON, default=lambda: [
        {
            "client_name": "Tanvir Chowdhury",
            "role": "Operations Director",
            "brand": "Vogue Lifestyle Retail Ltd",
            "location": "Dhanmondi & Uttara, Dhaka",
            "quote": "Generating clothing size-color matrices for our seasonal panjabi and polo collections used to take 2 days. With OmniFlow, it takes 30 seconds with automatic hangtag barcodes!",
            "rating": 5
        },
        {
            "client_name": "Nafisa Rahman",
            "role": "Founder & Head of Retail",
            "brand": "Aura Boutiques",
            "location": "Banani 11, Dhaka",
            "quote": "The 2FA biometric attendance with zero-storage privacy solved all our staff proxy issues. Our cashiers love the split payment POS during weekend rush hours.",
            "rating": 5
        },
        {
            "client_name": "Sajid Hasan",
            "role": "Supply Chain Head",
            "brand": "Apex Trend Apparel",
            "location": "Jamuna Future Park",
            "quote": "Inter-branch stock requisitions transformed our multi-outlet inventory. Showrooms request low sizes and our central warehouse dispatches in real-time.",
            "rating": 5
        }
    ])

    # Frequently Asked Questions (FAQ)
    faqs = Column(JSON, default=lambda: [
        {
            "question": "Can I run OmniFlow POS on regular PC, Android tablet, and touch screens?",
            "answer": "Yes! OmniFlow POS is 100% responsive and works flawlessly on desktop Chrome, Android tablets, touch terminals, thermal receipt printers, and barcode laser scanners with zero hardware lock-in."
        },
        {
            "question": "How does the Clothing Matrix handle Size (S/M/L/XL) and Color variations?",
            "answer": "Our apparel matrix generator creates a 2D matrix of Size × Color × GSM. You can adjust prices and stock per cell or bulk populate. It automatically formats unique barcodes for 50x35mm thermal hangtags."
        },
        {
            "question": "What is the Zero-Storage Privacy Protocol for 2FA Attendance?",
            "answer": "Unlike intrusive biometric systems that store facial photos on external servers, OmniFlow processes verification ephemeral in RAM and releases the memory buffer immediately (0 bytes retained on disk)."
        },
        {
            "question": "How do Inter-Branch Stock Transfers work?",
            "answer": "When an outlet runs low on a garment size, staff generate a requisition with one click. Central warehouse reviews, approves, and marks as 'In Transit'. When physically received, showroom staff click 'Receive Stock' to auto-update local inventory."
        },
        {
            "question": "Can I change my Showroom UI Theme and Receipt format?",
            "answer": "Yes. Each store owner can choose from 6 preset surface tones (Slate, Cream, Mint, Sky, Dark, White) or enter custom HEX codes, plus customize their receipt logo, tagline, helpline, exchange policy, and VAT BIN."
        }
    ])

    # Footer Information
    footer = Column(JSON, default=lambda: {
        "company_name": "OmniFlow POS Cloud Systems",
        "tagline": "Asia/Dhaka (GMT+6) Enterprise Cloud POS & ERP",
        "hotline": "+880 1700-000000",
        "email": "support@omniflow.pos.bd",
        "address": "Level 7, Lotus Kamal Tower, Gulshan-2, Dhaka 1212",
        "copyright": "© 2026 OmniFlow POS SaaS. All Rights Reserved."
    })

    # Landing Page UI Theme & Styling
    theme = Column(JSON, default=lambda: {
        "bg_color": "#030712",
        "accent_color": "#10b981",
        "accent_gradient_to": "#059669",
        "secondary_color": "#f59e0b",
        "surface_color": "#0f172a",
        "surface_border": "#1e293b",
        "text_color": "#f8fafc",
        "preset": "MIDNIGHT_EMERALD"
    })

    # SuperAdmin Console UI Theme & Styling
    superadmin_theme = Column(JSON, default=lambda: {
        "bg_color": "#030712",
        "accent_color": "#f59e0b",
        "surface_color": "#0f172a",
        "border_color": "#1e293b",
        "text_color": "#f8fafc",
        "preset": "OBSIDIAN_GOLD"
    })

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Expense(Base):
    """Monthly and Daily Operating Expenses (Rent, Utilities, Marketing, Packaging, Misc)"""
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # RENT, UTILITIES, MARKETING, PACKAGING, LOGISTICS, MAINTENANCE, TEA_ENTERTAINMENT, MISC
    category = Column(String(50), nullable=False, default="MISC", index=True)
    title = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    expense_date = Column(DateTime, default=datetime.utcnow, index=True)
    month_year = Column(String(7), nullable=False, index=True) # e.g. "2026-10"
    
    payment_method = Column(String(30), default="CASH") # CASH, BANK, BKASH, CHEQUE
    receipt_voucher_no = Column(String(60), nullable=True)
    paid_to = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")
    branch = relationship("Branch")


