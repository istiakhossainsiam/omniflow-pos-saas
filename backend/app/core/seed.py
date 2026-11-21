from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.security import get_password_hash
from app.models.tenant import Tenant, Branch, AttendancePolicy, SubscriptionPlan
from app.models.user import User, UserRole, EmployeeProfile, MonthlyTarget
from app.models.product import Category, Product, ProductVariant, InventoryStock
from app.models.incentive import IncentiveRule
from app.models.order import Customer

async def seed_initial_data(db: AsyncSession):
    # Ensure Default Subscription Plans exist
    plans_res = await db.execute(select(SubscriptionPlan))
    existing_plans = plans_res.scalars().all()
    if not existing_plans:
        default_plans = [
            SubscriptionPlan(
                name="Starter Single-Store",
                code="GROWTH",
                monthly_price=4000,
                currency="BDT",
                max_branches=1,
                max_users=5,
                is_popular=False,
                description="Ideal for single boutique showroom with fast POS billing and inventory tracking.",
                features={
                    "clothing_matrix": True,
                    "fast_pos": True,
                    "barcode_generator": True,
                    "attendance_handshake": False,
                    "inter_branch_transfer": False,
                    "staff_incentive": False,
                    "custom_branding": False,
                    "api_access": False
                }
            ),
            SubscriptionPlan(
                name="Pro Fashion Chain",
                code="PRO",
                monthly_price=8000,
                currency="BDT",
                max_branches=5,
                max_users=15,
                is_popular=True,
                description="Built for growing retail fashion brands with multi-showroom network and live matrix stock.",
                features={
                    "clothing_matrix": True,
                    "fast_pos": True,
                    "barcode_generator": True,
                    "attendance_handshake": True,
                    "inter_branch_transfer": True,
                    "staff_incentive": True,
                    "custom_branding": True,
                    "api_access": False
                }
            ),
            SubscriptionPlan(
                name="Enterprise Omnichannel",
                code="ENTERPRISE",
                monthly_price=15000,
                currency="BDT",
                max_branches=25,
                max_users=60,
                is_popular=False,
                description="Full-scale enterprise retail ERP with infinite scalability, 2FA biometric attendance & dedicated SLA.",
                features={
                    "clothing_matrix": True,
                    "fast_pos": True,
                    "barcode_generator": True,
                    "attendance_handshake": True,
                    "inter_branch_transfer": True,
                    "staff_incentive": True,
                    "custom_branding": True,
                    "api_access": True,
                    "priority_support": True
                }
            )
        ]
        for p in default_plans:
            db.add(p)
        await db.commit()

    # Check if database is already seeded
    result = await db.execute(select(Tenant))
    first_tenant = result.scalars().first()
    if first_tenant:
        # Ensure SuperAdmin exists
        sa_check = await db.execute(select(User).where(User.email == "superadmin@omniflow.com"))
        if not sa_check.scalar_one_or_none():
            b_res = await db.execute(select(Branch).where(Branch.tenant_id == first_tenant.id))
            first_b = b_res.scalars().first()
            if first_b:
                sa = User(
                    tenant_id=first_tenant.id,
                    branch_id=first_b.id,
                    employee_code="OMNI-GLOBAL-ADM-001",
                    email="superadmin@omniflow.com",
                    full_name="Global SaaS SuperAdmin",
                    phone="+8801700000000",
                    hashed_password=get_password_hash("password123"),
                    role=UserRole.SUPER_ADMIN,
                    manager_pin="0000"
                )
                db.add(sa)
                await db.commit()
        return

    print("[INFO] Seeding Multi-Tenant POS SaaS database...")

    # 1. Create Demo Tenant (Fashion & Lifestyle Brand)
    tenant = Tenant(
        name="Vogue Lifestyle Retail Ltd",
        slug="vogue",
        email="owner@voguelifestyle.com",
        phone="+8801711000111",
        currency="BDT",
        subscription_plan="ENTERPRISE",
        features={
            "attendance_handshake": True,
            "incentive_module": True,
            "inter_branch_transfer": True,
            "staff_stock_requisition": True,
            "clothing_matrix": True,
            "barcode_generator": True
        }
    )
    db.add(tenant)
    await db.flush()

    # 2. Create Showroom Branches
    branch_dhanmondi = Branch(
        tenant_id=tenant.id,
        name="Dhanmondi Flagship Showroom",
        code="DHK01",
        address="House 42, Road 7/A, Dhanmondi, Dhaka",
        phone="+8801811223344",
        is_warehouse=False
    )
    branch_uttara = Branch(
        tenant_id=tenant.id,
        name="Uttara Sector-3 Outlet",
        code="UTT02",
        address="Plot 18, Sector 3, Uttara, Dhaka",
        phone="+8801811556677",
        is_warehouse=False
    )
    branch_warehouse = Branch(
        tenant_id=tenant.id,
        name="Central Garment Warehouse",
        code="WH001",
        address="Tejgaon Industrial Area, Dhaka",
        phone="+8801811998877",
        is_warehouse=True
    )
    db.add_all([branch_dhanmondi, branch_uttara, branch_warehouse])
    await db.flush()

    # 3. Create Attendance Policy with configurable Handshake & Grace Period
    attendance_policy = AttendancePolicy(
        tenant_id=tenant.id,
        is_enabled=True,
        require_manager_handshake=True,
        verification_mode="QR_OR_PIN",
        shift_start_time="09:30",
        shift_end_time="19:30",
        grace_period_minutes=15,
        half_day_late_minutes=60,
        late_penalty_type="INCENTIVE_DEDUCTION",
        penalty_deduction_amount=100
    )
    db.add(attendance_policy)

    # 4. Create Incentive Rule (2.5% on retail sales)
    incentive_rule = IncentiveRule(
        tenant_id=tenant.id,
        title="Showroom Staff 2.5% Sales Incentive",
        rule_type="PERCENTAGE",
        percentage_rate=2.5,
        min_sales_threshold=50000.0,
        is_active=True
    )
    db.add(incentive_rule)

    # 5. Create Users (Admin, Store Manager, Cashier, Salesman)
    password_hash = get_password_hash("password123")

    # Store Owner (All branches access)
    owner = User(
        tenant_id=tenant.id,
        branch_id=branch_dhanmondi.id,
        employee_code="VOGUE-HQ-OWN-001",
        email="owner@vogue.com",
        full_name="Tanvir Rahman (Brand Owner)",
        phone="+8801711000111",
        hashed_password=password_hash,
        role=UserRole.STORE_OWNER,
        manager_pin="9999"
    )
    db.add(owner)

    # Dhanmondi Store Manager
    manager = User(
        tenant_id=tenant.id,
        branch_id=branch_dhanmondi.id,
        employee_code="VOGUE-DHK01-MGR-001",
        email="manager.dhanmondi@vogue.com",
        full_name="Mahmudul Hasan (Store Manager)",
        phone="+8801811223301",
        hashed_password=password_hash,
        role=UserRole.STORE_MANAGER,
        manager_pin="1234"
    )
    db.add(manager)

    # Dhanmondi Cashier
    cashier = User(
        tenant_id=tenant.id,
        branch_id=branch_dhanmondi.id,
        employee_code="VOGUE-DHK01-CSH-001",
        email="cashier.dhanmondi@vogue.com",
        full_name="Sabbir Ahmed (Cashier)",
        phone="+8801811223302",
        hashed_password=password_hash,
        role=UserRole.CASHIER,
        manager_pin=None
    )
    db.add(cashier)

    # Dhanmondi Senior Salesman
    salesman = User(
        tenant_id=tenant.id,
        branch_id=branch_dhanmondi.id,
        employee_code="VOGUE-DHK01-SLS-001",
        email="sales.dhanmondi@vogue.com",
        full_name="Rakib Hossain (Senior Sales Executive)",
        phone="+8801811223303",
        hashed_password=password_hash,
        role=UserRole.SALESMAN,
        manager_pin=None
    )
    db.add(salesman)
    await db.flush()

    # Employee Profiles & Monthly Targets
    salesman_profile = EmployeeProfile(
        user_id=salesman.id,
        designation="Senior Sales Executive",
        department="Floor Sales",
        base_salary=18000.0,
        commission_rate=2.5,
        shift="Morning"
    )
    db.add(salesman_profile)

    # Current month target for salesman (e.g. 2,50,000 BDT)
    current_month_str = datetime.utcnow().strftime("%Y-%m")
    target = MonthlyTarget(
        tenant_id=tenant.id,
        user_id=salesman.id,
        branch_id=branch_dhanmondi.id,
        month_year=current_month_str,
        target_amount=250000.0,
        target_items_count=80,
        bonus_on_achieve=6000.0
    )
    db.add(target)

    # 6. Create Categories
    cat_shirts = Category(
        tenant_id=tenant.id,
        name="Men's Oxford Shirts",
        slug="mens-oxford-shirts"
    )
    cat_panjabi = Category(
        tenant_id=tenant.id,
        name="Exclusive Panjabi Collection",
        slug="exclusive-panjabi"
    )
    cat_polo = Category(
        tenant_id=tenant.id,
        name="Premium Pique Polo",
        slug="premium-polo"
    )
    cat_denim = Category(
        tenant_id=tenant.id,
        name="Stretch Denim Jeans",
        slug="denim-jeans"
    )
    db.add_all([cat_shirts, cat_panjabi, cat_polo, cat_denim])
    await db.flush()

    # 7. Create Products & Matrix Variants with Barcodes
    # Product 1: Oxford Cotton Shirt
    prod_shirt = Product(
        tenant_id=tenant.id,
        category_id=cat_shirts.id,
        name="Royal Oxford Slim-Fit Shirt",
        product_type="CLOTHING",
        brand="Vogue Formal",
        fabric="100% Egyptian Cotton",
        unit="PCS",
        base_cost_price=950.0,
        base_selling_price=1850.0
    )
    db.add(prod_shirt)
    await db.flush()

    # Variants for Shirt: Sizes (M, L, XL) x Colors (Navy Blue, White)
    shirt_variants_data = [
        {"size": "M", "color": "Navy Blue", "sku": "SHT-OXF-NVY-M", "barcode": "8901001001", "cost": 950.0, "sell": 1850.0, "mrp": 2100.0},
        {"size": "L", "color": "Navy Blue", "sku": "SHT-OXF-NVY-L", "barcode": "8901001002", "cost": 950.0, "sell": 1850.0, "mrp": 2100.0},
        {"size": "XL", "color": "Navy Blue", "sku": "SHT-OXF-NVY-XL", "barcode": "8901001003", "cost": 950.0, "sell": 1850.0, "mrp": 2100.0},
        {"size": "M", "color": "Crisp White", "sku": "SHT-OXF-WHT-M", "barcode": "8901001004", "cost": 950.0, "sell": 1850.0, "mrp": 2100.0},
        {"size": "L", "color": "Crisp White", "sku": "SHT-OXF-WHT-L", "barcode": "8901001005", "cost": 950.0, "sell": 1850.0, "mrp": 2100.0},
        {"size": "XL", "color": "Crisp White", "sku": "SHT-OXF-WHT-XL", "barcode": "8901001006", "cost": 950.0, "sell": 1850.0, "mrp": 2100.0},
    ]

    for vdata in shirt_variants_data:
        variant = ProductVariant(
            tenant_id=tenant.id,
            product_id=prod_shirt.id,
            sku=vdata["sku"],
            barcode=vdata["barcode"],
            size=vdata["size"],
            color=vdata["color"],
            cost_price=vdata["cost"],
            selling_price=vdata["sell"],
            mrp=vdata["mrp"],
            min_stock_alert=3
        )
        db.add(variant)
        await db.flush()

        # Stock for Dhanmondi showroom and Central Warehouse
        stock_dhk = InventoryStock(
            tenant_id=tenant.id,
            branch_id=branch_dhanmondi.id,
            variant_id=variant.id,
            quantity=15,
            rack_location="Rack-A1"
        )
        stock_utt = InventoryStock(
            tenant_id=tenant.id,
            branch_id=branch_uttara.id,
            variant_id=variant.id,
            quantity=10,
            rack_location="Rack-B2"
        )
        stock_wh = InventoryStock(
            tenant_id=tenant.id,
            branch_id=branch_warehouse.id,
            variant_id=variant.id,
            quantity=50,
            rack_location="Warehouse-Bay4"
        )
        db.add_all([stock_dhk, stock_utt, stock_wh])

    # Product 2: Designer Festive Panjabi
    prod_panjabi = Product(
        tenant_id=tenant.id,
        category_id=cat_panjabi.id,
        name="Kabli Jacquard Semi-Fit Panjabi",
        product_type="CLOTHING",
        brand="Vogue Heritage",
        fabric="Jacquard Silk Cotton",
        unit="PCS",
        base_cost_price=1600.0,
        base_selling_price=3450.0
    )
    db.add(prod_panjabi)
    await db.flush()

    panjabi_variants_data = [
        {"size": "40 (M)", "color": "Emerald Green", "sku": "PAN-JAC-EMR-40", "barcode": "8902002001", "cost": 1600.0, "sell": 3450.0, "mrp": 3800.0},
        {"size": "42 (L)", "color": "Emerald Green", "sku": "PAN-JAC-EMR-42", "barcode": "8902002002", "cost": 1600.0, "sell": 3450.0, "mrp": 3800.0},
        {"size": "44 (XL)", "color": "Emerald Green", "sku": "PAN-JAC-EMR-44", "barcode": "8902002003", "cost": 1600.0, "sell": 3450.0, "mrp": 3800.0},
        {"size": "40 (M)", "color": "Midnight Black", "sku": "PAN-JAC-BLK-40", "barcode": "8902002004", "cost": 1600.0, "sell": 3450.0, "mrp": 3800.0},
        {"size": "42 (L)", "color": "Midnight Black", "sku": "PAN-JAC-BLK-42", "barcode": "8902002005", "cost": 1600.0, "sell": 3450.0, "mrp": 3800.0},
    ]

    for vdata in panjabi_variants_data:
        variant = ProductVariant(
            tenant_id=tenant.id,
            product_id=prod_panjabi.id,
            sku=vdata["sku"],
            barcode=vdata["barcode"],
            size=vdata["size"],
            color=vdata["color"],
            cost_price=vdata["cost"],
            selling_price=vdata["sell"],
            mrp=vdata["mrp"],
            min_stock_alert=2
        )
        db.add(variant)
        await db.flush()

        stock_dhk = InventoryStock(
            tenant_id=tenant.id,
            branch_id=branch_dhanmondi.id,
            variant_id=variant.id,
            quantity=12,
            rack_location="Rack-P1"
        )
        db.add(stock_dhk)

    # Product 3: Classic Pique Polo
    prod_polo = Product(
        tenant_id=tenant.id,
        category_id=cat_polo.id,
        name="Classic Heavy Pique Polo",
        product_type="CLOTHING",
        brand="Vogue Casual",
        fabric="220 GSM Combed Cotton",
        unit="PCS",
        base_cost_price=450.0,
        base_selling_price=950.0
    )
    db.add(prod_polo)
    await db.flush()

    polo_variants_data = [
        {"size": "M", "color": "Maroon", "sku": "POLO-PIQ-MRN-M", "barcode": "8903003001", "cost": 450.0, "sell": 950.0, "mrp": 1100.0},
        {"size": "L", "color": "Maroon", "sku": "POLO-PIQ-MRN-L", "barcode": "8903003002", "cost": 450.0, "sell": 950.0, "mrp": 1100.0},
        {"size": "XL", "color": "Maroon", "sku": "POLO-PIQ-MRN-XL", "barcode": "8903003003", "cost": 450.0, "sell": 950.0, "mrp": 1100.0},
    ]

    for vdata in polo_variants_data:
        variant = ProductVariant(
            tenant_id=tenant.id,
            product_id=prod_polo.id,
            sku=vdata["sku"],
            barcode=vdata["barcode"],
            size=vdata["size"],
            color=vdata["color"],
            cost_price=vdata["cost"],
            selling_price=vdata["sell"],
            mrp=vdata["mrp"],
            min_stock_alert=5
        )
        db.add(variant)
        await db.flush()

        stock_dhk = InventoryStock(
            tenant_id=tenant.id,
            branch_id=branch_dhanmondi.id,
            variant_id=variant.id,
            quantity=20,
            rack_location="Rack-C1"
        )
        db.add(stock_dhk)

    # 8. Create Demo Customers
    cust1 = Customer(
        tenant_id=tenant.id,
        name="Farhan Chowdhury",
        phone="01712345678",
        email="farhan@gmail.com",
        loyalty_points=120,
        store_credit_balance=0.0,
        total_spent=5300.0
    )
    cust2 = Customer(
        tenant_id=tenant.id,
        name="Sadia Islam",
        phone="01987654321",
        email="sadia@yahoo.com",
        loyalty_points=50,
        store_credit_balance=500.0, # Store credit from garment return
        total_spent=3450.0
    )
    db.add_all([cust1, cust2])

    await db.commit()
    print("[SUCCESS] Seed data populated successfully!")
