# Administrator User Manual
# Steak Kenangan POS System

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Target Users**: Restaurant Administrators, Managers
**Training Time**: 2-3 hours

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Order Management](#order-management)
5. [Product Management](#product-management)
6. [Inventory Management](#inventory-management)
7. [User Management](#user-management)
8. [Table Management](#table-management)
9. [Reports & Analytics](#reports--analytics)
10. [Contact Form Management](#contact-form-management)
11. [System Settings](#system-settings)
12. [Notifications](#notifications)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is Steak Kenangan POS?

Steak Kenangan POS is a complete restaurant management system designed specifically for Indonesian steakhouse operations. It provides:

- **Order Management**: Track all orders from creation to completion
- **Inventory Control**: Real-time stock tracking with low-stock alerts
- **Staff Management**: Role-based access for kitchen, servers, and counter staff
- **Reporting**: Comprehensive sales, revenue, and operational reports
- **Customer Engagement**: Contact form management and customer communication
- **Multi-language**: Support for Indonesian (Bahasa Indonesia) and English

### Who Should Use This Manual?

This manual is intended for:
- Restaurant Owners
- General Managers
- Operations Managers
- Administrators with full system access

### System Requirements

**To access the Admin Dashboard, you need**:
- A computer or tablet with a modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (minimum 2 Mbps)
- Admin or Manager role credentials
- Screen resolution: 1280x720 or higher (recommended: 1920x1080)

---

## Getting Started

### Accessing the System

1. **Open your web browser**
2. **Navigate to**: https://steakkenangan.com
3. **Click "Login"** button in the top-right corner
4. **Enter your credentials**:
   - Username: (provided by IT administrator)
   - Password: (provided during onboarding)
5. **Click "Masuk" (Login)**

**First Time Login?**
- You will be prompted to change your password
- Create a strong password (minimum 8 characters, mix of letters and numbers)

### Changing Language

The system supports Indonesian (Bahasa Indonesia) and English.

**To change language**:
1. Click on the **language selector** (ID/EN) in the top-right corner
2. Select your preferred language
3. The interface will immediately switch

**Note**: Product descriptions, menu items, and customer-facing content are automatically displayed in Indonesian.

### Changing Theme (Dark/Light Mode)

**To switch between light and dark themes**:
1. Click the **theme toggle** icon (sun/moon) in the top-right corner
2. The interface will switch immediately
3. Your preference is saved automatically

**Tip**: Dark mode reduces eye strain during night shifts.

---

## Dashboard Overview

The Admin Dashboard is your control center. It provides real-time insights into restaurant operations.

### Accessing the Dashboard

After login, you'll be redirected to: `/admin/dashboard`

### Dashboard Components

#### 1. Statistics Cards (Top Row)

Four key metrics are displayed:

| Metric | Description | Update Frequency |
|--------|-------------|------------------|
| **Total Orders** | Number of orders today | Real-time |
| **Revenue Today** | Total sales in IDR | Real-time |
| **Pending Orders** | Orders awaiting kitchen | Real-time |
| **Low Stock Items** | Products below threshold | Every 5 minutes |

**Example**:
```
┌─────────────────────────────────────────────────────────────┐
│ Total Orders        Revenue Today       Pending Orders      │
│    152              Rp 45,750,000            8              │
│ ↑ 12% from yesterday                    ⚠️ Low Stock: 3     │
└─────────────────────────────────────────────────────────────┘
```

**Color Indicators**:
- 🟢 Green: Normal operations
- 🟡 Yellow: Attention needed (e.g., 5+ pending orders)
- 🔴 Red: Urgent action required (e.g., 10+ pending orders, critical stock)

#### 2. Recent Orders (Left Panel)

Shows the last 10 orders with:
- Order ID (e.g., `ORD-20251226-001`)
- Customer name
- Order status badge
- Total amount
- Quick action buttons (View, Edit, Cancel)

**Order Status Colors**:
- 🟡 **Pending** (yellow): Awaiting kitchen preparation
- 🔵 **Preparing** (blue): Kitchen is working on it
- 🟢 **Ready** (green): Ready for serving/pickup
- ✅ **Completed** (green): Delivered and paid
- 🔴 **Cancelled** (red): Order cancelled

#### 3. Sales Chart (Center Panel)

A bar chart showing daily sales for the last 7 days.

**Features**:
- Hover over bars to see exact amounts
- Identifies trends (increasing/decreasing sales)
- Useful for weekly planning

#### 4. Top Products (Right Panel)

Lists the 10 best-selling products today, including:
- Product name
- Quantity sold
- Revenue generated
- Percentage of total sales

**Use Case**: Identify popular items to ensure adequate inventory.

---

## Order Management

### Viewing All Orders

**Navigation**: Click "Orders" in the left sidebar

**Order Table Columns**:
- Order ID
- Customer Name
- Order Type (Dine-in / Takeaway / Delivery)
- Table Number (for dine-in)
- Status
- Total Amount
- Order Date/Time
- Actions (View, Edit, Cancel)

### Order Filters

Use filters to narrow down orders:

**Status Filter**:
- All Orders
- Pending
- Preparing
- Ready
- Completed
- Cancelled

**Date Filter**:
- Today
- This Week
- This Month
- Custom Date Range

**Order Type Filter**:
- All Types
- Dine-in
- Takeaway
- Delivery

**Example Use Case**:
*"Show me all completed dine-in orders from yesterday"*
1. Select Status: Completed
2. Select Order Type: Dine-in
3. Select Date: Yesterday

### Viewing Order Details

**To view full order details**:
1. Click on an order row OR click the **"View"** button (eye icon)
2. A modal/page opens showing:
   - Customer information
   - Order items with quantities and prices
   - Subtotal, tax, total
   - Payment status
   - Order status history (timeline)
   - Special instructions/notes

**Order Status History Timeline**:
```
2025-12-26 12:30 PM - Order Created by Server (Jane)
2025-12-26 12:32 PM - Order Confirmed
2025-12-26 12:35 PM - Preparing in Kitchen
2025-12-26 12:50 PM - Ready for Serving
2025-12-26 01:05 PM - Served to Table
2025-12-26 01:30 PM - Payment Completed
```

### Editing an Order

**When to Edit**:
- Customer requests to add/remove items
- Correct a mistake (wrong item selected)
- Update special instructions

**Steps**:
1. Click **"Edit"** button (pencil icon)
2. Modify order items:
   - Add new items: Click "+ Add Item"
   - Remove items: Click "X" next to item
   - Change quantity: Use +/- buttons
3. Update special instructions if needed
4. Click **"Save Changes"**
5. Confirmation: "Order updated successfully"

**⚠️ Note**: You can only edit orders with status "Pending" or "Preparing". Completed orders cannot be edited.

### Cancelling an Order

**When to Cancel**:
- Customer changes their mind (before preparation starts)
- Item unavailable (kitchen out of stock)
- Duplicate order

**Steps**:
1. Click **"Cancel"** button (X icon)
2. A confirmation dialog appears: *"Are you sure you want to cancel this order?"*
3. Select cancellation reason:
   - Customer Request
   - Out of Stock
   - Duplicate Order
   - Other (specify)
4. Click **"Confirm Cancellation"**
5. Order status changes to "Cancelled"

**⚠️ Important**: Cancelled orders cannot be uncancelled. If customer changes mind again, create a new order.

### Creating a New Order (Manual Entry)

Admins can create orders manually (e.g., phone orders, walk-ins).

**Steps**:
1. Click **"+ New Order"** button (top-right)
2. Select Order Type:
   - Dine-in (requires table selection)
   - Takeaway
   - Delivery (requires customer address)
3. Enter Customer Information:
   - Name (required)
   - Phone Number (optional)
   - Email (optional)
4. Add Order Items:
   - Search or browse menu
   - Select item
   - Choose quantity
   - Add to cart
5. Add Special Instructions (optional):
   - Example: "No onions", "Extra spicy", "Birthday cake decoration"
6. Review Order Summary:
   - Subtotal
   - Tax (11% PPN)
   - Total
7. Click **"Submit Order"**
8. Confirmation: Order ID displayed (e.g., `ORD-20251226-045`)

### Printing Orders

**To print an order receipt**:
1. Open order details
2. Click **"Print"** button (printer icon)
3. A print preview appears
4. Click "Print" in browser dialog

**Printed Receipt Includes**:
- Restaurant name and logo
- Order ID and date/time
- Customer name and table number
- Itemized list with prices
- Subtotal, tax, total
- Payment method
- Served by (staff name)

---

## Product Management

### Viewing Products

**Navigation**: Click "Products" in the left sidebar

**Product Table Columns**:
- Image (thumbnail)
- Name
- Category
- Price (IDR)
- SKU
- Stock Quantity
- Status (Active/Inactive)
- Actions (View, Edit, Delete)

### Adding a New Product

**Steps**:
1. Click **"+ Add Product"** button (top-right)
2. Fill in Product Details:

   **Basic Information**:
   - Product Name (English) *required*
   - Product Name (Indonesian) *required*
   - SKU (Stock Keeping Unit) *required, unique* (e.g., `WGY-RNDG`)
   - Category *required* (select from dropdown)

   **Description**:
   - Description (English) *optional*
   - Description (Indonesian) *optional*
   - Example: "Premium wagyu sirloin with Padang rendang spices"

   **Pricing**:
   - Price (IDR) *required*
   - Format: Numbers only (e.g., 275000 for Rp 275.000)

   **Inventory**:
   - Initial Stock Quantity *required*
   - Low Stock Threshold *optional* (default: 5)
   - Example: Stock 50, Threshold 10 (alert when stock < 10)

   **Operational**:
   - Preparation Time (minutes) *optional* (default: 15)
   - Example: 25 for Rendang Wagyu
   - Sort Order *optional* (for menu display order)

   **Image** (optional):
   - Upload product image
   - Formats: JPG, PNG, WebP
   - Maximum size: 5 MB
   - Recommended: 800x800 pixels, square aspect ratio

   **Status**:
   - ☑️ Active (visible on menu)
   - ☐ Inactive (hidden from menu, useful for seasonal items)

3. Click **"Save Product"**
4. Confirmation: "Product created successfully"

**Example**:
```
Product Name: Rendang Wagyu
SKU: WGY-RNDG
Category: Signature Wagyu
Price: 275000
Stock: 50
Threshold: 10
Prep Time: 25 minutes
Status: Active
```

### Editing a Product

**Steps**:
1. Find the product in the list
2. Click **"Edit"** button (pencil icon)
3. Modify any fields
4. Click **"Save Changes"**
5. Confirmation: "Product updated successfully"

**Common Edits**:
- Price adjustment (due to cost changes)
- Stock update (after inventory count)
- Image update (better photo available)
- Status change (seasonal availability)

### Deleting a Product

**⚠️ Warning**: Deleting a product is permanent and cannot be undone.

**When to Delete**:
- Product permanently discontinued
- Duplicate entry (better to edit SKU)

**Steps**:
1. Find the product in the list
2. Click **"Delete"** button (trash icon)
3. Confirmation dialog: *"Are you sure? This cannot be undone."*
4. Type product name to confirm
5. Click **"Delete Product"**
6. Confirmation: "Product deleted successfully"

**⚠️ Note**: You cannot delete a product that appears in existing orders. Set it to "Inactive" instead.

### Bulk Operations

**Bulk Price Update**:
1. Select multiple products (checkbox in table)
2. Click **"Bulk Actions"** dropdown
3. Select "Update Prices"
4. Choose:
   - Increase by % (e.g., +10%)
   - Decrease by % (e.g., -5%)
   - Set fixed amount
5. Click "Apply"
6. Confirmation: "X products updated"

**Bulk Status Change**:
1. Select multiple products
2. Click **"Bulk Actions"** > "Change Status"
3. Select: Active or Inactive
4. Click "Apply"

---

## Inventory Management

### Viewing Inventory

**Navigation**: Click "Inventory" in the left sidebar

**Inventory Table Columns**:
- Product Name
- SKU
- Current Stock
- Low Stock Threshold
- Status Indicator (🟢 OK / 🟡 Low / 🔴 Critical)
- Last Restocked Date
- Actions (Adjust, View History)

### Stock Status Indicators

| Indicator | Meaning | Action Needed |
|-----------|---------|---------------|
| 🟢 **OK** | Stock > Threshold | No action |
| 🟡 **Low** | Stock ≤ Threshold | Reorder soon |
| 🔴 **Critical** | Stock < 3 | Reorder immediately |
| ⚫ **Out of Stock** | Stock = 0 | Product unavailable |

### Adjusting Stock

**When to Adjust Stock**:
- Received new inventory delivery
- Conducted physical inventory count
- Spoilage/waste occurred
- Correction of errors

**Steps**:
1. Find product in inventory list
2. Click **"Adjust Stock"** button
3. Select Adjustment Type:
   - **Add Stock** (received delivery)
   - **Remove Stock** (waste, spoilage)
   - **Set Stock** (manual count correction)
4. Enter Quantity:
   - For Add/Remove: Enter amount to change
   - For Set: Enter new total quantity
5. Enter Reason *required*:
   - Examples: "Delivery from supplier", "Spoilage", "Physical count correction"
6. Click **"Save Adjustment"**
7. Confirmation: "Stock adjusted successfully"

**Example**:
```
Product: Rendang Wagyu
Current Stock: 12
Adjustment Type: Add Stock
Quantity: 30
Reason: Delivery from PT Wagyu Indonesia
New Stock: 42
```

### Viewing Stock History

**To view all stock changes for a product**:
1. Find product in inventory list
2. Click **"View History"** button (clock icon)
3. A table shows:
   - Date/Time of adjustment
   - Previous Stock
   - Adjustment Amount (+/-)
   - New Stock
   - Adjustment Reason
   - Adjusted By (staff username)

**Example History**:
```
Date                  Prev  Change  New   Reason                 By
2025-12-26 10:00 AM    12    +30    42   Delivery from supplier admin
2025-12-25 08:30 PM    15    -3     12   Spoilage               manager1
2025-12-25 02:00 PM    20    -5     15   Sold (auto-deduct)     system
```

### Low Stock Alerts

**Where to See Alerts**:
- Dashboard Statistics Card: "Low Stock Items: X"
- Inventory page: Products with 🟡 or 🔴 indicators
- Notifications panel: Real-time low stock notifications

**Configuring Low Stock Threshold**:
1. Go to Inventory page
2. Click **"Edit"** on a product
3. Update "Low Stock Threshold" field
4. Click "Save"

**Recommended Thresholds**:
- High-demand items (e.g., Rendang Wagyu): 15-20 units
- Medium-demand items: 10 units
- Low-demand items: 5 units

### Exporting Inventory Report

**To export inventory data to CSV**:
1. Go to Inventory page
2. Click **"Export"** button (download icon)
3. Choose format: CSV (recommended for Excel)
4. File downloads automatically
5. Open in Excel/Google Sheets

**CSV File Includes**:
- Product Name
- SKU
- Current Stock
- Threshold
- Unit Value (price)
- Total Value (stock × price)
- Last Restocked Date

**Use Case**: Share with accountant for valuation, or with supplier for reordering.

---

## User Management

### Viewing Users

**Navigation**: Click "Users" in the left sidebar

**User Table Columns**:
- Username
- Full Name
- Role
- Email
- Status (Active/Inactive)
- Last Login
- Actions (View, Edit, Delete, Reset Password)

### User Roles

The system has 5 user roles with different permissions:

| Role | Access Level | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | Everything + user management |
| **Manager** | Business operations | Orders, products, inventory, reports (no user management) |
| **Server** | Dine-in orders only | Create/view orders, update table status |
| **Counter** | All order types + payment | Create orders (all types), process payments |
| **Kitchen** | Kitchen display only | View orders, update preparation status |

### Adding a New User

**Steps**:
1. Click **"+ Add User"** button (top-right)
2. Fill in User Details:

   **Basic Information**:
   - Username *required, unique*
     - Format: lowercase, no spaces (e.g., `jane.doe`)
   - Full Name *required*
   - Email *optional but recommended*

   **Credentials**:
   - Password *required*
     - Minimum 8 characters
     - Must include letters and numbers
     - Example: `Welcome2025!`
   - Confirm Password *required*

   **Role Assignment** *required*:
   - Select from dropdown: Admin, Manager, Server, Counter, Kitchen

   **Status**:
   - ☑️ Active (user can log in)
   - ☐ Inactive (user cannot log in, but account preserved)

3. Click **"Create User"**
4. Confirmation: "User created successfully"
5. **Important**: Share username and temporary password with the new user securely

**Example**:
```
Username: budi.santoso
Full Name: Budi Santoso
Email: budi@steakkenangan.com
Role: Kitchen
Password: Kitchen2025!
Status: Active
```

### Editing a User

**Steps**:
1. Find user in the list
2. Click **"Edit"** button (pencil icon)
3. Modify fields:
   - Full Name
   - Email
   - Role
   - Status
   - **Note**: Cannot change username (it's unique identifier)
4. Click **"Save Changes"**
5. Confirmation: "User updated successfully"

**Common Edits**:
- Role change (e.g., promote Server to Manager)
- Deactivate user (set Status to Inactive)
- Update email address

### Resetting User Password

**When to Reset**:
- User forgot password
- Security concern (password compromised)
- Temporary password needs to be changed

**Steps**:
1. Find user in the list
2. Click **"Reset Password"** button (key icon)
3. Enter New Password:
   - Follow password rules (minimum 8 characters)
4. Confirm New Password
5. Click **"Reset Password"**
6. Confirmation: "Password reset successfully"
7. **Important**: Inform the user of their new temporary password securely

### Deactivating a User

**When to Deactivate** (instead of deleting):
- Employee left the company
- Temporary suspension
- Seasonal staff (off-season)

**Steps**:
1. Find user in the list
2. Click **"Edit"** button
3. Change Status to **"Inactive"**
4. Click "Save Changes"
5. User cannot log in but data is preserved

**Reactivating a User**:
1. Follow same steps
2. Change Status back to **"Active"**

### Deleting a User

**⚠️ Warning**: Deleting a user removes them from the system. Cannot be undone.

**When to Delete**:
- Duplicate account
- Test account no longer needed

**⚠️ Recommendation**: Use "Deactivate" instead of "Delete" to preserve audit logs.

**Steps**:
1. Find user in the list
2. Click **"Delete"** button (trash icon)
3. Confirmation: *"Are you sure? This cannot be undone."*
4. Type username to confirm
5. Click **"Delete User"**

---

## Table Management

### Viewing Tables

**Navigation**: Click "Tables" in the left sidebar

**Table Card View**:
Each table is displayed as a card showing:
- Table Number
- Capacity (number of seats)
- Current Status with color coding
- QR Code (for customer self-ordering)
- Actions (Edit, Generate QR, Mark Available/Occupied)

### Table Status

| Status | Color | Meaning |
|--------|-------|---------|
| **Available** | 🟢 Green | Table is empty, ready for seating |
| **Occupied** | 🔴 Red | Table has active customers |
| **Reserved** | 🟡 Yellow | Table reserved for specific time |
| **Cleaning** | 🔵 Blue | Table being cleaned/reset |

### Adding a New Table

**Steps**:
1. Click **"+ Add Table"** button (top-right)
2. Fill in Table Details:
   - Table Number *required, unique* (e.g., `A01`, `B05`)
   - Capacity *required* (number of seats: 2, 4, 6, 8, etc.)
   - Location *optional* (e.g., "Window Side", "VIP Area")
   - QR Code: Auto-generated
3. Click **"Create Table"**
4. Confirmation: "Table created successfully"

**Example**:
```
Table Number: A01
Capacity: 4
Location: Main Dining Area
Status: Available
```

### Editing a Table

**Steps**:
1. Find table in the grid
2. Click **"Edit"** button
3. Modify:
   - Table Number
   - Capacity
   - Location
4. Click "Save Changes"

### Changing Table Status

**Manual Status Change**:
1. Find table in the grid
2. Click on table card
3. Select new status from dropdown:
   - Available
   - Occupied
   - Reserved
   - Cleaning
4. Status updates immediately

**Automatic Status Changes**:
- Table becomes "Occupied" when an order is assigned to it
- Table becomes "Available" when order is completed and payment is done

### QR Code for Self-Ordering

Each table has a unique QR code for customer self-ordering.

**Generating QR Code**:
1. Find table in the grid
2. Click **"Generate QR"** button (QR icon)
3. QR code image displays
4. Click **"Download"** or **"Print"**

**Printing QR Codes**:
1. Download QR code image
2. Open in image editor or Word
3. Add table number label
4. Print on cardstock or laminate
5. Place on table (table tent or frame)

**QR Code URL Format**:
```
https://steakkenangan.com/order/table/A01
```

**Customer Self-Ordering Flow**:
1. Customer scans QR code with phone
2. Web page opens with menu
3. Customer selects items and submits order
4. Order appears in Kitchen Display and Admin Dashboard
5. Server brings food to table

---

## Reports & Analytics

### Accessing Reports

**Navigation**: Click "Reports" in the left sidebar

### Available Reports

#### 1. Sales Report

**Filters**:
- Date Range: Today, This Week, This Month, Custom
- Order Type: All, Dine-in, Takeaway, Delivery

**Metrics Displayed**:
- Total Sales (IDR)
- Number of Orders
- Average Order Value
- Sales by Category
- Sales by Product
- Hourly sales distribution

**Chart Types**:
- Line chart: Sales trend over time
- Bar chart: Sales by category
- Pie chart: Order type distribution

**Export Options**:
- PDF (for printing/sharing)
- CSV (for Excel analysis)

#### 2. Revenue Report

**Filters**:
- Date Range
- Payment Method (Cash, Card, E-Wallet)

**Metrics Displayed**:
- Gross Revenue
- Tax Collected (11% PPN)
- Net Revenue
- Revenue by Payment Method
- Daily/Weekly/Monthly comparisons

**Chart Types**:
- Stacked bar chart: Revenue breakdown
- Line chart: Revenue trend

#### 3. Product Performance Report

**Filters**:
- Date Range
- Category

**Metrics Displayed**:
- Top 10 Best-Selling Products
- Bottom 10 Products (slow-moving)
- Revenue by Product
- Quantity Sold
- Average Order Quantity

**Use Cases**:
- Identify menu optimization opportunities
- Plan inventory based on popularity
- Adjust pricing for low-performing items

#### 4. Inventory Valuation Report

**Metrics Displayed**:
- Current Stock Quantity (all products)
- Unit Cost (per product)
- Total Inventory Value (IDR)
- Stock by Category
- Low Stock Items

**Use Case**: Financial reporting, asset valuation

#### 5. Staff Performance Report

**Filters**:
- Date Range
- Staff Role

**Metrics Displayed** (per staff member):
- Orders Processed
- Total Sales Generated
- Average Order Value
- Customer Satisfaction (if reviews enabled)

**Use Case**: Performance reviews, staff recognition

### Exporting Reports

**To export any report**:
1. Select report type
2. Configure filters
3. Click **"Export"** button (download icon)
4. Choose format:
   - **PDF**: For printing, presentations
   - **CSV**: For Excel, Google Sheets
5. File downloads automatically

**Example File Names**:
- `sales_report_2025-12-01_to_2025-12-31.pdf`
- `inventory_valuation_2025-12-26.csv`

### Scheduling Reports

**To schedule automated reports via email**:
1. Go to Reports page
2. Click **"Schedule"** button
3. Configure:
   - Report Type
   - Frequency (Daily, Weekly, Monthly)
   - Day/Time
   - Recipients (email addresses)
4. Click "Save Schedule"
5. Reports will be emailed automatically

**Example**:
*"Send Sales Report every Monday at 9:00 AM to manager@steakkenangan.com"*

---

## Contact Form Management

### Accessing Contact Messages

**Navigation**: Click "Contact" in the left sidebar

**Message Table Columns**:
- Name (sender)
- Email
- Subject
- Status (New, Read, Replied, Archived)
- Date Received
- Actions (View, Reply, Archive)

### Viewing Messages

**Steps**:
1. Find message in the list
2. Click **"View"** button (eye icon)
3. Message details display:
   - Sender Name
   - Email Address
   - Phone Number (if provided)
   - Subject
   - Message Content
   - Date/Time Received
   - Status
   - Reply history (if any)

### Replying to Messages

**Steps**:
1. Open message (click "View")
2. Click **"Reply"** button
3. Compose reply in text editor
4. Click **"Send Reply"**
5. Email is sent to customer
6. Status automatically changes to "Replied"

**⚠️ Note**: Replies are sent via email configured in system settings (SMTP).

### Changing Message Status

**Status Options**:
- **New**: Unread message (default)
- **Read**: Opened but not yet replied
- **Replied**: Response sent to customer
- **Archived**: Resolved/closed (hidden from main view)

**To change status**:
1. Find message in the list
2. Click status dropdown
3. Select new status
4. Status updates immediately

### Archiving Messages

**When to Archive**:
- Issue resolved
- Spam/irrelevant message
- Old messages (for cleanup)

**Steps**:
1. Find message in the list
2. Click **"Archive"** button
3. Confirmation: Message moves to "Archived" tab

**Viewing Archived Messages**:
1. Go to Contact page
2. Click "Archived" tab
3. All archived messages display
4. Can unarchive if needed (click "Unarchive")

### Exporting Contact Messages

**To export messages to CSV**:
1. Go to Contact page
2. Click **"Export"** button (download icon)
3. Choose date range (optional)
4. File downloads automatically

**CSV Includes**:
- Name, Email, Phone, Subject, Message, Status, Date

**Use Case**: Share with marketing team, analyze common inquiries

---

## System Settings

### Accessing Settings

**Navigation**: Click "Settings" in the left sidebar

### General Settings

**Restaurant Information**:
- Restaurant Name
- Address
- Phone Number
- Email
- Operating Hours

**To Update**:
1. Edit fields
2. Click "Save Settings"
3. Confirmation: "Settings updated successfully"

### Tax Configuration

**Indonesia PPN (VAT) Rate**:
- Default: 11%
- Can be adjusted (e.g., if tax law changes)

**To Update Tax Rate**:
1. Go to Settings > Tax Configuration
2. Enter new rate (as percentage)
3. Click "Save"
4. **⚠️ Note**: Applies to all new orders (existing orders unchanged)

### Payment Methods

**Enable/Disable Payment Methods**:
- Cash
- Credit/Debit Card
- E-Wallet (GoPay, OVO, Dana)
- Bank Transfer

**To Configure**:
1. Go to Settings > Payment Methods
2. Toggle checkboxes:
   - ☑️ Enabled (visible at checkout)
   - ☐ Disabled (hidden from checkout)
3. Click "Save"

### Email (SMTP) Configuration

**For sending emails** (contact form replies, notifications):

**Required Fields**:
- SMTP Host (e.g., `smtp.gmail.com`)
- SMTP Port (e.g., `587` for TLS)
- SMTP Username (your email address)
- SMTP Password (app password, not regular password)
- Sender Name (e.g., "Steak Kenangan Support")

**To Configure**:
1. Go to Settings > Email Settings
2. Fill in SMTP details
3. Click **"Test Connection"** (sends test email)
4. If successful, click "Save"

**Gmail Example**:
```
Host: smtp.gmail.com
Port: 587
Username: support@steakkenangan.com
Password: (app password from Google Account)
Sender: Steak Kenangan Support
```

### Backup Configuration

**Automated Backups** are configured in system settings.

**Options**:
- Backup Frequency: Daily (default), Weekly, Monthly
- Backup Time: (e.g., 2:00 AM)
- Retention Policy:
  - Daily: Keep 7 backups
  - Weekly: Keep 4 backups
  - Monthly: Keep 3 backups
- S3/Cloudflare R2 (optional): Upload to cloud storage

**To Configure**:
1. Go to Settings > Backup
2. Adjust frequency and retention
3. (Optional) Configure S3:
   - Bucket Name
   - Access Key
   - Secret Key
   - Endpoint URL
4. Click "Save"

**To Trigger Manual Backup**:
1. Go to Settings > Backup
2. Click **"Backup Now"** button
3. Backup runs immediately
4. Confirmation: "Backup completed successfully"

### System Health Monitoring

**System Health Dashboard**:
- Backend Status (🟢 Healthy / 🔴 Down)
- Database Status (🟢 Connected / 🔴 Disconnected)
- Disk Space (% used)
- Memory Usage (% used)
- CPU Usage (% used)

**To View**:
1. Go to Settings > System Health
2. Real-time metrics display
3. Auto-refreshes every 30 seconds

**Health Alerts**:
- 🔴 Disk space > 90%: "Low disk space"
- 🔴 Memory > 85%: "High memory usage"
- 🔴 Database down: "Database connection lost"

---

## Notifications

### Notification Panel

**Accessing Notifications**:
1. Click the **bell icon** (🔔) in the top-right corner
2. A dropdown displays recent notifications
3. Badge shows unread count (e.g., 🔴5)

### Notification Types

| Icon | Type | Description |
|------|------|-------------|
| 🛒 | New Order | A new order has been created |
| ⚠️ | Low Stock | Product stock below threshold |
| ✅ | Order Complete | An order has been completed |
| 💳 | Payment Received | Payment processed successfully |
| 📧 | New Message | New contact form submission |
| 🔐 | Security Alert | Failed login attempts detected |

### Notification Actions

**Mark as Read**:
- Click on a notification
- It will no longer show as "new"

**Mark All as Read**:
- Click "Mark All as Read" button
- All notifications marked as read

**Clear Notifications**:
- Click "Clear All" button
- Removes all notifications from panel

### Notification Settings

**To configure notifications**:
1. Go to Settings > Notifications
2. Toggle notification types:
   - ☑️ New Orders (recommended)
   - ☑️ Low Stock Alerts (recommended)
   - ☑️ Order Completion
   - ☑️ Payment Confirmation
   - ☑️ Contact Form Messages
   - ☐ Security Alerts (for security team only)
3. Click "Save"

**Email Notifications** (optional):
- Enable email notifications for critical events
- Configure in Settings > Notifications > Email Alerts

---

## Best Practices

### Daily Operations

**Morning Routine** (9:00 AM - 10:00 AM):
1. Check Dashboard for yesterday's summary
2. Review Low Stock items, plan restocking
3. Check pending orders (if any from previous day)
4. Verify all staff are active in system
5. Check system health (Settings > System Health)

**During Service** (11:00 AM - 10:00 PM):
1. Monitor Dashboard for real-time orders
2. Respond to low stock alerts promptly
3. Address customer contact form messages
4. Check kitchen status (no backed-up orders)

**Evening Routine** (10:00 PM - 11:00 PM):
1. Review Sales Report for the day
2. Compare with targets/previous day
3. Check all orders are completed
4. Verify all tables are marked "Available"
5. Check backup logs (Settings > Backup)

### Weekly Tasks

**Monday**:
- Review Sales Report for previous week
- Plan inventory reorders based on usage
- Staff meeting: review top products, low performers

**Wednesday**:
- Check Inventory, conduct mini physical count (spot check)
- Review User Activity Logs (Settings > Logs)

**Friday**:
- Export and review weekly reports (sales, revenue, product performance)
- Share with management team

### Monthly Tasks

**First Week of Month**:
- Generate monthly reports
- Conduct full physical inventory count
- Reconcile inventory valuation with accounting
- Review user permissions, deactivate inactive users
- Test backup restore procedure (see Operations Runbook)
- Update menu prices if needed (seasonal adjustments)

### Security Best Practices

**Password Management**:
- Change admin password every 90 days
- Use strong passwords (mix of letters, numbers, symbols)
- Never share passwords via email or chat
- Use password manager (e.g., LastPass, 1Password)

**User Access Control**:
- Deactivate users immediately upon termination
- Review user list monthly, remove inactive accounts
- Assign minimum necessary role (principle of least privilege)
- Never share admin credentials

**Data Protection**:
- Ensure daily backups are running (check logs)
- Test restore procedure quarterly
- Do not export sensitive data to personal devices
- Use VPN when accessing system remotely (optional)

### Performance Optimization

**For Faster Dashboard Loading**:
- Close unused browser tabs
- Clear browser cache weekly
- Use modern browser (Chrome, Firefox, Edge latest versions)
- Ensure stable internet connection (minimum 2 Mbps)

**For Better Reporting**:
- Generate reports during off-peak hours (early morning)
- Use date range filters to limit data volume
- Export large reports to CSV instead of viewing in browser

---

## Troubleshooting

### Cannot Log In

**Issue**: "Invalid credentials" error

**Solutions**:
1. Verify username and password are correct (case-sensitive)
2. Check Caps Lock is off
3. Try password reset (contact IT administrator)
4. Clear browser cookies and cache
5. Try incognito/private browsing mode
6. Verify account is Active (ask admin to check Users page)

---

### Dashboard Not Loading

**Issue**: Blank screen or loading spinner forever

**Solutions**:
1. Refresh page (F5 or Ctrl+R)
2. Check internet connection
3. Clear browser cache:
   - Chrome: Ctrl+Shift+Delete > Clear browsing data
4. Try different browser (Chrome, Firefox, Edge)
5. Check System Health (if accessible via Settings)
6. Contact IT support if issue persists

---

### Orders Not Appearing

**Issue**: New orders not showing in Orders page

**Solutions**:
1. Refresh page (F5)
2. Check date filter (ensure "Today" or "All" is selected)
3. Check status filter (ensure "All Orders" is selected)
4. Clear browser cache
5. Verify orders exist in Kitchen Display (ask kitchen staff)
6. Check backend logs (Settings > Logs, for admins)

---

### Products Not Saving

**Issue**: "Error saving product" or changes not persisting

**Solutions**:
1. Check all required fields are filled (marked with *)
2. Verify SKU is unique (not already used by another product)
3. Ensure price is a valid number (no commas, only digits)
4. Check image file size (maximum 5 MB)
5. Refresh page and try again
6. Check internet connection stability
7. Contact IT support with error message screenshot

---

### Export Not Working

**Issue**: CSV or PDF export fails or downloads empty file

**Solutions**:
1. Disable popup blocker in browser
2. Try different browser
3. Check if date range has data (try "This Month")
4. Clear browser cache
5. Ensure stable internet connection
6. Contact IT support if issue persists

---

### Slow Performance

**Issue**: System is slow, pages take long to load

**Solutions**:
1. Check internet speed (minimum 2 Mbps required)
2. Close unused browser tabs and applications
3. Clear browser cache and cookies
4. Restart browser
5. Check System Health (Settings > System Health):
   - If CPU > 80%: Wait a few minutes (may be running backups)
   - If Memory > 85%: Restart services (contact IT)
   - If Disk > 90%: Free up space (contact IT)
6. Contact IT support if issue persists

---

### Printer Not Working

**Issue**: Receipts not printing

**Solutions**:
1. Check printer is powered on and connected
2. Check paper is loaded
3. Verify printer is selected in browser print dialog
4. Try printing a test page from browser (File > Print)
5. Restart printer
6. Update printer drivers (contact IT)

---

### Backup Failed

**Issue**: "Backup failed" notification or email

**Solutions**:
1. Go to Settings > Backup > View Logs
2. Identify error message:
   - "Database connection failed": Database may be down (contact IT)
   - "Disk full": Free up disk space (contact IT)
   - "S3 access denied": Check S3 credentials (Settings > Backup)
3. Try manual backup (click "Backup Now")
4. Contact IT support with error log

---

## Support & Training

### Getting Help

**Level 1: Self-Service**
- Use this manual (search for your issue)
- Check Troubleshooting section

**Level 2: IT Support**
- Email: support@steakkenangan.com
- Phone: +62 821 1234 5678 (Mon-Fri, 9 AM - 6 PM)
- Response Time: 24 hours

**Level 3: Emergency Support**
- Critical issues only (system down, data loss)
- Email: emergency@steakkenangan.com
- Phone: +62 821 1234 5678 (24/7)
- Response Time: 1 hour

### Training Resources

**Video Tutorials**:
- YouTube Channel: Steak Kenangan Training
- Playlists:
  - Admin Basics (30 min)
  - Order Management (15 min)
  - Inventory Management (20 min)
  - Reporting & Analytics (25 min)

**Live Training Sessions**:
- Scheduled monthly (first Monday, 10:00 AM)
- Register: training@steakkenangan.com
- Duration: 1.5 hours
- Online (Zoom) or On-site

**Documentation**:
- This manual (print or PDF)
- Quick Reference Cards (one-page guides)
- API Documentation (for developers)

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Alt + D | Go to Dashboard |
| Alt + O | Go to Orders |
| Alt + P | Go to Products |
| Alt + I | Go to Inventory |
| Alt + U | Go to Users |
| Alt + R | Go to Reports |
| Ctrl + N | Create New (Order/Product/User, depending on page) |
| Ctrl + F | Search/Filter |
| Esc | Close modal/dialog |

### Glossary

- **SKU**: Stock Keeping Unit (unique product identifier)
- **PPN**: Pajak Pertambahan Nilai (Indonesia VAT, 11%)
- **IDR**: Indonesian Rupiah (currency)
- **SMTP**: Email sending protocol
- **CSV**: Comma-Separated Values (spreadsheet format)
- **QR Code**: Quick Response Code (for table ordering)
- **Dine-in**: Customer eats at restaurant
- **Takeaway**: Customer takes food to go
- **Delivery**: Food delivered to customer address

### Indonesia IDR Formatting

**Currency Display Format**:
- Standard: `Rp 275.000` (dot as thousands separator)
- With decimals: `Rp 275.000,00` (comma as decimal separator)

**Examples**:
- Rp 50.000 (fifty thousand)
- Rp 1.500.000 (one and a half million)
- Rp 275.000 (two hundred seventy-five thousand)

### Contact Information

**Steak Kenangan Restaurant**
Jl. Sudirman No. 123
Jakarta Selatan, DKI Jakarta 12190
Indonesia

**Phone**: +62 21 5555 1234
**WhatsApp**: +62 812 3456 7890
**Email**: info@steakkenangan.com
**Website**: https://steakkenangan.com

**Support**:
- Technical Support: support@steakkenangan.com
- Training: training@steakkenangan.com
- Emergency: emergency@steakkenangan.com

---

**END OF ADMIN MANUAL**

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Document Owner**: IT Department, Steak Kenangan
