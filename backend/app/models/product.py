import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False) # e.g. "Men's Formal Shirts", "Panjabi", "Snacks"
    slug = Column(String(100), nullable=False)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")


class Product(Base):
    """Parent Product Definition (e.g. Premium Cotton Oxford Shirt)"""
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    name = Column(String(150), nullable=False)
    product_type = Column(String(30), default="CLOTHING")  # CLOTHING, GENERAL, GROCERY
    brand = Column(String(80), nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    
    # Defaults (can be overridden at variant level)
    base_cost_price = Column(Float, default=0.0)
    base_selling_price = Column(Float, default=0.0)
    
    # Clothing Specific Metadata
    has_variants = Column(Boolean, default=True)
    fabric = Column(String(50), nullable=True) # Cotton, Silk, Denim, Linen
    unit = Column(String(20), default="PCS") # PCS, KG, LTR, PKT
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="products")
    category = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    """Individual SKU/Matrix Variant (e.g. Size: M, Color: Navy Blue) with specific barcode"""
    __tablename__ = "product_variants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    
    sku = Column(String(60), nullable=False, index=True)
    barcode = Column(String(60), nullable=False, index=True) # Code128 / EAN13 barcode string
    
    # Clothing Attributes
    size = Column(String(30), nullable=True)   # S, M, L, XL, XXL, 30, 32, 34, 36, Free Size
    color = Column(String(50), nullable=True)  # Navy Blue, Maroon, Olive Green, White, Black
    color_code = Column(String(20), nullable=True) # #001f3f
    
    cost_price = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    mrp = Column(Float, nullable=False, default=0.0)
    
    # Low stock alert threshold
    min_stock_alert = Column(Integer, default=5)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="variants")
    stocks = relationship("InventoryStock", back_populates="variant", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="variant")

    __table_args__ = (
        UniqueConstraint('tenant_id', 'barcode', name='uq_tenant_barcode'),
    )


class InventoryStock(Base):
    """Stock count per Showroom / Branch / Warehouse for a specific variant"""
    __tablename__ = "inventory_stocks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(String(36), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    rack_location = Column(String(50), nullable=True) # e.g. "Rack-A2-Shelf3"
    
    last_restocked_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    branch = relationship("Branch", back_populates="stocks")
    variant = relationship("ProductVariant", back_populates="stocks")

    __table_args__ = (
        UniqueConstraint('branch_id', 'variant_id', name='uq_branch_variant_stock'),
    )
