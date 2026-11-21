# OmniFlow — Cloud-Based Multi-Tenant POS, Clothing Matrix Inventory & 2FA Attendance SaaS Engine

OmniFlow is an enterprise-grade, high-concurrency **Cloud Multi-Tenant SaaS Retail POS and ERP system** built with a **Python FastAPI (Async)** backend and an ultra-fast, mobile-optimized **React PWA** frontend.

Designed specifically for **Clothing & Fashion Retailers, Multi-Outlet Showrooms, and General Retailing Stores**.

---

## 🌟 Key Architecture & Features

### 1. ⚡ High-Speed Mobile & Desktop POS
- **Desktop-Free Fast Cashier Counter:** Optimized for tablets, touch displays, and mobile browsers with instant response.
- **Hardware Laser & Mobile Camera Barcode Scanner:** Real-time lookup with stock level indicators across all branch showrooms.
- **Clothing Matrix Variant Selector:** Instant size pills (`S`, `M`, `L`, `XL`, `XXL`, `40`, `42`) & color swatches.
- **Park / Hold Cart:** Hold customer carts and resume in 1-click without losing items.
- **Split Payments:** Accepts Cash, bKash, Nagad, Rocket, Card, and Customer Store Credit with live change calculation.
- **Thermal Receipt (58mm / 80mm ESC/POS):** Includes brand logo, showroom branch address, itemized variants, return/exchange policy, and barcode/QR verification.

### 2. 👗 Clothing Matrix & Hangtag Barcode Studio
- **1-Click Matrix Generator:** Auto-generates complete combinations (e.g. 5 Sizes x 3 Colors = 15 Unique SKUs and Code128 Barcodes).
- **Printable Fashion Hangtag Labels:** Print A4 sheets or thermal roll stickers with Brand, Size, Color, MRP, and Barcode.
- **Multi-Showroom Stock Allocation:** Tracks inventory in Dhanmondi, Uttara, Banani, and Central Warehouse independently.

### 3. 🔐 Secure 2FA Attendance & Handshake Engine (Optional Tenant Feature)
- **Store Manager Verification Handshake:** Salesman hits Check-In from their mobile -> Manager verifies via:
  - Dynamic 60s rotating QR code
  - 6-digit Quick PIN handshake
  - 1-Click Manager Verification Queue
- **Configurable Grace Period & Late Rules (Tenant Settings):**
  - Configurable Shift Start (e.g., 09:30 AM)
  - Configurable Grace Period (e.g., 15 mins)
  - Late deduction from monthly sales incentive or strike accumulation.

### 4. 📈 Salesman Performance & Incentive Commission Portal
- **Showroom-wise Unique Employee IDs:** e.g. `VOGUE-DHK01-SLS-001`
- **Personal Sales Portal:**
  - Real-time Month Target vs Sales Progress Meter
  - Today's Sales Attributed & Invoices Served
  - Real-time Earned Incentive Commission in BDT (e.g. 2.5%)
  - Today's Attendance status.

### 5. 🛡️ Stock Shortage & Requisitions Workflow (Staff Safety Protocol)
- Salesmen and Cashiers can submit **Stock In / Shortage / Damage Requisitions**.
- Store Manager or Admin must **1-Click Approve** before live inventory adjustments occur, preventing stock theft and discrepancies.

### 6. 📊 Consolidated Multi-Branch Analytics
- Showroom-to-showroom comparative revenue charts.
- Payment channel settlement breakdown (Cash vs MFS vs Card).
- Popular garment sizes and dead-stock alerts.

---

## 🚀 How to Run the System

### Single-Command Unified Launch:
```bash
python start.py
```
Then open:
* **Web / Mobile POS:** `http://localhost:8000`
* **Mobile Phone (on same Wi-Fi):** `http://<your-ip>:8000`
* **Interactive API Documentation:** `http://localhost:8000/docs`

---

## 🔑 Demo Login Personas (Password: `password123`)

| Role | Email / Code | Notes |
| :--- | :--- | :--- |
| **Brand Owner (HQ)** | `owner@vogue.com` | Full multi-branch access & policy control |
| **Store Manager** | `manager.dhanmondi@vogue.com` | Showroom approvals, Handshake PIN `1234` |
| **Cashier** | `cashier.dhanmondi@vogue.com` | Fast POS billing & drawer close |
| **Senior Salesman** | `sales.dhanmondi@vogue.com` | Sales portal, target tracker & check-in |

*(You can also switch personas in 1-click using the top-right profile menu).*
\n## Security Configuration\n\nSet a stable SECRET_KEY environment variable before deploying so sessions and tokens remain valid across restarts. When no value is set, the app generates a temporary key for the current process. Do not commit .env files, local databases, or TLS private keys.\n