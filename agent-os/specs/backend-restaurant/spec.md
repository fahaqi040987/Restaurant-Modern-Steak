# Specification: B2C Restaurant Website

## Goal
Create a public-facing restaurant website that showcases the Modern Steak brand, provides essential customer information (hours, location, contact), displays the menu, and offers a seamless staff login portal to access the existing POS system.

## User Stories
- As a potential customer, I want to view the restaurant menu and location so that I can decide to visit
- As a restaurant staff member, I want to quickly access the staff portal so that I can manage orders and operations
- As a returning customer, I want to easily find contact information and operating hours so that I can plan my visit

## Specific Requirements

**Landing Page (Homepage)**
- Hero section with restaurant branding, tagline, and high-quality steak imagery
- Featured dishes showcase (3-4 highlight items from product catalog)
- Operating hours summary with "Open Now" / "Closed" status indicator
- Quick action buttons: View Menu, Contact Us, Get Directions
- Brief "About Us" section with restaurant story snippet
- Responsive design with dark/elegant theme (charcoal #1a1a1a, gold #d4a574, burgundy #722f37)

**Menu Page**
- Display all active products from existing `products` table
- Category-based organization using existing `categories` table
- Menu item cards showing: name, description, price, image (if available)
- Dietary tags display (vegetarian, gluten-free, spicy) from product data
- Filter by category functionality
- Search functionality for menu items
- Read-only display (no ordering capability)

**Contact & Location Page**
- Full address display with copy-to-clipboard button
- Embedded Google Maps with restaurant pin (requires lat/long configuration)
- Get Directions button (opens Google Maps/Waze)
- Day-by-day operating hours table with current day highlighted
- Phone number with click-to-call on mobile devices
- Email address with mailto link
- Contact form: Name, Email, Phone (optional), Subject dropdown, Message
- Form submission stores to database and/or sends email notification

**Staff Login Portal**
- Clean branded login form at `/staff` or `/login` route
- Username and password fields with show/hide password toggle
- "Remember me" checkbox functionality
- Integration with existing authentication system (`/api/auth/login`)
- Role-based redirect after login: Admin→/admin/dashboard, Kitchen→/kitchen, Server→/admin/server, Counter→/admin/counter
- Error handling for invalid credentials with user-friendly messages
- Already logged-in users redirect to appropriate dashboard

**URL Structure**
- Public Landing: `/public` (redirects from `/` for unauthenticated users)
- Public Menu: `/public/menu`
- Public About: `/public/about`
- Public Contact: `/public/contact`
- Staff Login: `/staff`

**Navigation & Layout**
- Sticky header with: Logo (links to homepage), Home, Menu, About, Contact links
- Ensure navigation links correctly point to the `/public/*` routes
- Staff Login button (subtle, top-right corner)
- Mobile hamburger menu for responsive navigation
- Footer with: Logo, quick links, operating hours, contact info, social media icons, copyright, subtle "Staff Portal" link

**Backend: Public API Endpoints**
- `GET /api/v1/public/menu` - Returns active products with categories (no auth required)
- `GET /api/v1/public/categories` - Returns active categories (no auth required)
- `GET /api/v1/public/restaurant` - Returns restaurant info: name, address, hours, contact, social links
- `POST /api/v1/public/contact` - Submits contact form (rate limited, validates input)

**Backend: Restaurant Configuration**
- New `restaurant_info` table or config for: name, tagline, description, address, city, phone, email, WhatsApp
- Store map coordinates (latitude, longitude) for Google Maps embed
- Operating hours configuration with day-of-week, open/close times, isClosed flag
- Social media URLs: Instagram, Facebook, Twitter
- Branding assets: logo URL, hero image URL

**SEO & Performance**
- Meta tags for all pages (title, description, Open Graph)
- Structured data (JSON-LD) for Restaurant and LocalBusiness schema
- Image optimization with lazy loading
- Lighthouse Performance score target: > 90
- First Contentful Paint target: < 1.5 seconds

## Existing Code to Leverage

**Authentication System (`backend/internal/handlers/auth.go`)**
- Existing login endpoint `/api/auth/login` handles username/password authentication
- JWT token generation and validation already implemented
- User roles (admin, kitchen, server, counter) already defined in system
- Reuse for staff portal login without modification

**Products API (`backend/internal/handlers/products.go`)**
- Existing `GET /api/products` returns product list with categories
- Product model includes: name, description, price, category_id, image_url, is_available
- Create public wrapper endpoint that filters to active products only

**Categories API (`backend/internal/handlers/products.go`)**
- Existing `GET /api/categories` returns category list
- Reuse for public menu category filtering

**Frontend Components (`frontend/src/components/ui/`)**
- Button, Card, Input, Form components from shadcn/ui already available
- Toast notifications system already implemented
- Loading spinners and skeleton loaders available
- Reuse existing component library for consistent styling

**TanStack Router (`frontend/src/routes/`)**
- Existing route structure with protected routes pattern
- `__root.tsx` layout wrapper pattern can be extended
- Add new public routes following existing patterns

## Out of Scope
- Online ordering or checkout functionality
- Table reservation system with real-time availability
- Customer accounts or loyalty program
- Payment processing on public website
- Real-time order tracking for customers
- Mobile application
- Multi-language support
- Customer reviews or ratings integration
- Newsletter subscription management
- Online delivery integration

---

# Specification: Admin System Improvements

## Goal
Enhance the admin dashboard with production-ready features including user profile management, functional navigation, server product CRUD operations, and real system configuration backed by database.

## User Stories
- As an admin user, I want to access my profile settings directly from the header menu so that I can update my information quickly
- As a server staff, I want to create, edit, and delete products so that I can manage the menu efficiently
- As an admin, I want production-ready system settings that persist to database so that I can configure the restaurant operations
- As any staff user, I want to receive real notifications instead of demo toasts so that I stay informed of system events

## Specific Requirements

### 1. User Profile & Navigation Access

**Profile Page (`/admin/profile`)**
- Display current user information: username, email, first name, last name, role (read-only)
- Edit profile form with fields: first name, last name, email
- Change password section: current password, new password, confirm password
- Password strength indicator and validation
- Save button that persists changes to database via API
- Success/error toast notifications on save
- Responsive layout with proper form validation

**Notifications Center (`/admin/notifications`)**
- List of system notifications sorted by date (newest first)
- Notification types: order updates, low stock alerts, system messages, user actions
- Mark as read/unread functionality
- Filter by notification type
- Delete notification option
- Pagination or infinite scroll for large lists
- Badge counter on header menu showing unread count
- Real-time updates via polling or WebSocket (optional for v1)

**Header Navigation Updates**
- UserMenu dropdown items must have functional onClick handlers
- Profile → Navigate to `/admin/profile`
- Settings → Navigate to `/admin/settings`
- Notifications → Navigate to `/admin/notifications`
- Remove duplicate navigation patterns (consolidate to route-based only)

### 2. Server Product Management

**Server Station Product CRUD (`/admin/server`)**
- **Create Product:**
  - "Add New Product" button at top of product list
  - Modal form with fields: name, description, price, category (dropdown), SKU, preparation time, is_available toggle
  - Image upload or URL input (optional)
  - Form validation: required fields, price must be positive number
  - Save creates product via `POST /api/v1/products` endpoint

- **Edit Product:**
  - "Edit" button on each product card
  - Opens modal pre-filled with current product data
  - Same form fields as create
  - Save updates product via `PUT /api/v1/products/:id` endpoint

- **Delete Product:**
  - "Delete" button on each product card with confirmation dialog
  - Confirmation message: "Are you sure you want to delete [product name]? This action cannot be undone."
  - On confirm, calls `DELETE /api/v1/products/:id` endpoint
  - Shows success toast on deletion

- **Permissions:**
  - Only server and admin roles can access product management
  - Kitchen and counter roles remain read-only

**Alternative Implementation:**
- Create separate `/admin/products` route with full product management interface
- Available to admin and manager roles only
- More comprehensive than server station (bulk actions, import/export)

### 3. Production Notification System

**Remove Demo Components:**
- Remove `<ToastDemo />` component from AdminLayout settings section
- Remove demo toast buttons from AdminSettings
- Keep `toast-helpers.ts` utility (production-ready)

**Notification Preferences in Settings:**
- Email notifications toggle (on/off)
- Notification type preferences with checkboxes:
  - Order updates (new orders, order status changes)
  - Low stock alerts (inventory below threshold)
  - Payment confirmations
  - System alerts (errors, maintenance)
  - Daily reports (summary emails)
- Email address for notifications (editable)
- Quiet hours configuration: start time, end time (no notifications during this period)
- Test notification button to verify email delivery
- Save preferences to database via API

**Backend Notification System:**
- Create `notifications` table: id, user_id, type, title, message, is_read, created_at
- Create `notification_preferences` table: user_id, email_enabled, types_enabled (JSON), quiet_hours_start, quiet_hours_end
- `GET /api/v1/notifications` - List user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `GET /api/v1/notifications/preferences` - Get user preferences
- `PUT /api/v1/notifications/preferences` - Update preferences

### 4. Production System Configuration

**Database Schema:**
```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    category VARCHAR(50), -- 'restaurant', 'financial', 'receipt', 'system'
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Backend API Endpoints:**
- `GET /api/v1/settings` - Returns all settings as key-value object
- `GET /api/v1/settings/:key` - Get specific setting
- `PUT /api/v1/settings` - Batch update multiple settings (admin only)
- `PUT /api/v1/settings/:key` - Update single setting (admin only)
- `GET /api/v1/health` - System health check endpoint returning:
  ```json
  {
    "database": {
      "status": "connected",
      "latency_ms": 12,
      "last_check": "2024-12-12T10:30:00Z"
    },
    "api": {
      "status": "online",
      "version": "1.0.0"
    },
    "backup": {
      "status": "up_to_date",
      "last_backup": "2024-12-12T02:00:00Z",
      "next_backup": "2024-12-13T02:00:00Z"
    }
  }
  ```

**Frontend AdminSettings Updates:**
- Replace `useState` with `useQuery` to fetch settings from API
- Replace dummy `handleSave` with `useMutation` to persist changes
- Remove browser `alert()` - use toast notifications
- Add loading states during fetch/save
- Add error handling with user-friendly messages
- Real-time system status from `/api/v1/health` endpoint
- Poll health endpoint every 30 seconds for status updates
- Show connection errors in red, warnings in yellow

**Settings Categories:**

1. **Restaurant Information:**
   - Restaurant name (text)
   - Currency (dropdown: USD, EUR, GBP, IDR)
   - Timezone (dropdown)

2. **Financial Settings:**
   - Tax rate (percentage, 0-100)
   - Service charge (percentage, 0-100)
   - Tax calculation method (dropdown: inclusive, exclusive)

3. **Receipt Settings:**
   - Receipt header text (textarea)
   - Receipt footer text (textarea)
   - Show logo on receipt (checkbox)
   - Receipt paper size (dropdown: 58mm, 80mm)

4. **System Configuration:**
   - Backup frequency (dropdown: hourly, daily, weekly)
   - Data retention period (number input, days)
   - Session timeout (number input, minutes)
   - Enable audit logs (checkbox)

5. **System Status (Read-Only):**
   - Database connection status with latency
   - API status and version
   - Last backup time and next scheduled backup
   - System uptime
   - Total storage used

### 5. Additional Improvements

**Form Validation:**
- Use Zod schemas for all forms (profile, products, settings)
- Show field-level validation errors
- Disable submit button during validation or API calls
- Clear error messages on field change

**Permission System:**
- Check user role before showing edit/delete buttons
- API endpoints should verify permissions server-side
- Show appropriate error if user lacks permission

**Loading States:**
- Skeleton loaders for initial data fetch
- Spinner on save buttons during API calls
- Optimistic updates where appropriate (mark notification as read)

**Error Handling:**
- Network errors: "Unable to connect. Please check your connection."
- Validation errors: Show field-specific messages
- Server errors: "Something went wrong. Please try again."
- Retry buttons for failed operations

## Technical Implementation

### Backend Requirements

**New Go Files:**
- `backend/internal/handlers/settings.go` - Settings CRUD handlers
- `backend/internal/handlers/notifications.go` - Notification handlers
- `backend/internal/handlers/health.go` - Health check handler
- `backend/internal/models/settings.go` - Settings models
- `backend/internal/models/notification.go` - Notification models

**Database Migrations:**
- `database/migrations/03_system_settings.sql` - System settings table
- `database/migrations/04_notifications.sql` - Notifications and preferences tables

**Route Updates (`backend/internal/api/routes.go`):**
```go
// Settings (admin only)
admin.GET("/settings", getSettings)
admin.PUT("/settings", updateSettings)
admin.GET("/health", getSystemHealth)

// Notifications (all authenticated users)
authenticated.GET("/notifications", getNotifications)
authenticated.PUT("/notifications/:id/read", markNotificationRead)
authenticated.DELETE("/notifications/:id", deleteNotification)
authenticated.GET("/notifications/preferences", getNotificationPreferences)
authenticated.PUT("/notifications/preferences", updateNotificationPreferences)

// User profile (all authenticated users)
authenticated.GET("/profile", getUserProfile)
authenticated.PUT("/profile", updateUserProfile)
authenticated.PUT("/profile/password", changePassword)

// Products (server and admin roles)
server.POST("/products", createProduct)
server.PUT("/products/:id", updateProduct)
server.DELETE("/products/:id", deleteProduct)
```

### Frontend Requirements

**New Files:**
- `frontend/src/routes/admin/profile.tsx` - User profile page
- `frontend/src/routes/admin/notifications.tsx` - Notifications center
- `frontend/src/components/admin/ProductFormModal.tsx` - Product create/edit modal
- `frontend/src/components/admin/DeleteConfirmDialog.tsx` - Reusable delete confirmation
- `frontend/src/lib/validation/settings-schema.ts` - Zod schema for settings
- `frontend/src/lib/validation/product-schema.ts` - Zod schema for products
- `frontend/src/lib/validation/profile-schema.ts` - Zod schema for profile

**Updated Files:**
- `frontend/src/components/admin/UserMenu.tsx` - Add onClick navigation
- `frontend/src/components/admin/AdminSettings.tsx` - Connect to backend API
- `frontend/src/components/admin/ServerStation.tsx` - Add CRUD buttons and modals
- `frontend/src/components/admin/AdminLayout.tsx` - Remove ToastDemo component
- `frontend/src/api/client.ts` - Add new API methods

**API Client Methods:**
```typescript
// Settings
getSettings(): Promise<Record<string, any>>
updateSettings(settings: Record<string, any>): Promise<void>
getSystemHealth(): Promise<HealthStatus>

// Notifications
getNotifications(filters?: NotificationFilters): Promise<Notification[]>
markNotificationRead(id: string): Promise<void>
deleteNotification(id: string): Promise<void>
getNotificationPreferences(): Promise<NotificationPreferences>
updateNotificationPreferences(prefs: NotificationPreferences): Promise<void>

// Profile
getUserProfile(): Promise<UserProfile>
updateUserProfile(data: Partial<UserProfile>): Promise<void>
changePassword(currentPassword: string, newPassword: string): Promise<void>

// Products (for server role)
createProduct(data: ProductInput): Promise<Product>
updateProduct(id: string, data: Partial<ProductInput>): Promise<Product>
deleteProduct(id: string): Promise<void>
```

## Success Metrics
- All 5 user menu items functional with proper navigation
- Server role can perform full CRUD on products
- System settings persist to database and survive restarts
- No demo/dummy components in production views
- System health accurately reflects real status
- Profile changes saved successfully with validation
- Notification system operational with preferences

## Out of Scope (v1)
- Real-time notifications via WebSocket
- Email delivery system (notification preferences UI only)
- Advanced product features (variants, modifiers, combo deals)
- User avatar upload
- Two-factor authentication for profile
- Audit log viewer UI
- Bulk product import/export
- Advanced analytics dashboard

---

# Specification: Indonesian Cuisine Localization & System Improvements

## Goal
Transform the Modern Steak POS system into a production-ready Indonesian steakhouse platform with proper localization (IDR currency, Indonesian menu items), complete unused features, fix critical bugs, and enhance admin portal functionality.

## Priority Classification
- 🔴 **CRITICAL** - Must fix before production (blocking issues)
- 🟡 **HIGH** - Important for launch (1-2 weeks)
- 🟢 **MEDIUM** - Enhances user experience (2-4 weeks)
- 🔵 **LOW** - Nice to have (future iterations)

## User Stories
- As an Indonesian restaurant owner, I want all prices displayed in Rupiah (IDR) so that my staff and customers see familiar currency
- As a restaurant admin, I want to manage Indonesian steak menu items so that the system reflects our actual offerings
- As a staff member, I want to use the system in Bahasa Indonesia so that I can work more efficiently
- As an admin, I want to view customer contact form submissions so that I can respond to inquiries
- As a manager, I want to track inventory levels so that I can prevent stockouts
- As any staff, I want to receive real notifications so that I stay informed of important events

---

## 🔴 CRITICAL FIXES (Week 1)

### 1. Currency Localization - IDR Implementation

**Problem:** System inconsistently uses USD in admin/POS interfaces while public website correctly uses IDR.

**Solution:**
- Update all `formatCurrency` functions to use Indonesian locale and IDR
- Remove hardcoded USD currency references
- Ensure consistent formatting: `Rp 250.000` format

**Files to Update:**
```typescript
// Format pattern to implement everywhere:
new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}).format(amount)

// Files requiring changes:
- frontend/src/components/server/ServerInterface.tsx (line ~225)
- frontend/src/components/counter/CounterInterface.tsx
- frontend/src/components/kitchen/KitchenDisplay.tsx
- frontend/src/components/admin/AdminDashboard.tsx
- frontend/src/components/admin/OrderManagement.tsx
- frontend/src/components/admin/AdminReports.tsx
```

**Backend:**
- Verify `system_settings.currency` default is 'IDR'
- Update seed data if needed

**Acceptance Criteria:**
- [ ] All order totals display as "Rp X.XXX"
- [ ] No USD symbols anywhere in admin/POS
- [ ] Public website maintains correct IDR formatting
- [ ] Reports and invoices show IDR
- [ ] System settings show IDR as default currency

---

### 2. Indonesian Steak Menu - Seed Data Replacement

**Problem:** Database contains Western food (Pizza, Burgers) instead of Indonesian steakhouse items.

**Solution:** Replace `database/init/02_seed_data.sql` with Indonesian cuisine.

**New Menu Structure:**

**Categories:**
1. **Steak Nusantara** (Indonesian-style steaks)
2. **Steak Premium** (International cuts)
3. **Makanan Pembuka** (Appetizers)
4. **Makanan Pendamping** (Sides)
5. **Minuman** (Beverages)
6. **Dessert**

**Sample Products:**
```sql
-- Steak Nusantara
('Rendang Wagyu Steak', 'Wagyu steak dengan bumbu rendang khas Padang', 285000, 'steak-nusantara-id', true),
('Sate Wagyu Premium', 'Sate wagyu dengan bumbu kacang spesial', 195000, 'steak-nusantara-id', true),
('Beef Ribs Sambal Matah', 'Iga sapi bakar dengan sambal matah Bali', 245000, 'steak-nusantara-id', true),

-- Steak Premium  
('Australian Ribeye', 'Ribeye Australia 300gr premium', 325000, 'steak-premium-id', true),
('Wagyu Tenderloin', 'Tenderloin wagyu A5 250gr', 485000, 'steak-premium-id', true),
('Tomahawk Steak', 'Tomahawk 800gr untuk 2-3 orang', 725000, 'steak-premium-id', true),

-- Makanan Pembuka
('Lumpia Isi Daging', 'Lumpia crispy isi daging sapi cincang', 45000, 'appetizer-id', true),
('Sop Buntut', 'Sup buntut sapi dengan sayuran', 78000, 'appetizer-id', true),
('Beef Carpaccio', 'Irisan tipis daging sapi mentah dengan truffle', 95000, 'appetizer-id', true),

-- Makanan Pendamping
('Nasi Goreng Wagyu', 'Nasi goreng dengan potongan wagyu', 65000, 'sides-id', true),
('Sambal Trio', 'Sambal matah, terasi, dan ijo', 25000, 'sides-id', true),
('Kentang Goreng Balado', 'French fries dengan balado pedas', 35000, 'sides-id', true),
('Nasi Putih', 'Nasi putih hangat', 15000, 'sides-id', true),

-- Minuman
('Es Teh Manis', 'Teh manis dingin', 15000, 'beverages-id', true),
('Jus Alpukat', 'Jus alpukat segar', 28000, 'beverages-id', true),
('Es Kelapa Muda', 'Air kelapa muda segar', 22000, 'beverages-id', true),
('Kopi Susu Gula Aren', 'Kopi susu dengan gula aren', 32000, 'beverages-id', true),

-- Dessert
('Es Campur Modern', 'Es campur dengan ice cream vanilla', 38000, 'dessert-id', true),
('Pisang Goreng Cokelat', 'Pisang goreng dengan saus cokelat', 32000, 'dessert-id', true),
```

**Implementation:**
1. Create `database/init/03_indonesian_menu.sql`
2. Clear existing products: `DELETE FROM products; DELETE FROM categories;`
3. Insert Indonesian categories
4. Insert Indonesian products with proper pricing in IDR
5. Update restaurant info to Indonesian steakhouse theme

**Acceptance Criteria:**
- [ ] All products have Indonesian names
- [ ] Prices in IDR range (15k - 750k)
- [ ] Categories reflect Indonesian cuisine structure
- [ ] Descriptions in Bahasa Indonesia
- [ ] Menu makes sense for steakhouse concept

---

### 3. Contact Form Submissions - Admin Interface

**Problem:** Customer contact forms submit to database but no admin interface exists to view them.

**Solution:** Create admin page to manage contact submissions.

**Database (Already Exists):**
```sql
-- Table: contact_submissions (already created in previous spec)
```

**Backend Endpoints (NEW):**
```go
// File: backend/internal/handlers/contact.go

// GET /api/v1/admin/contacts - List all contact submissions
// GET /api/v1/admin/contacts/:id - Get specific submission
// PUT /api/v1/admin/contacts/:id/status - Update status (new, in_progress, resolved, spam)
// DELETE /api/v1/admin/contacts/:id - Delete submission
```

**Frontend Pages (NEW):**
```typescript
// File: frontend/src/routes/admin/contacts.tsx
// File: frontend/src/components/admin/ContactSubmissions.tsx

Features:
- Table view with columns: Date, Name, Email, Subject, Status, Actions
- Filter by status: All, New, In Progress, Resolved
- Search by name/email/subject
- Click row to view full message
- Mark as resolved/spam buttons
- Reply via email button (opens mailto with pre-filled recipient)
- Delete with confirmation
- Pagination (50 per page)
- Export to CSV functionality
```

**Status Workflow:**
- **new** (default) - Unread submission
- **in_progress** - Admin reviewing/responding
- **resolved** - Issue closed
- **spam** - Marked as spam

**Acceptance Criteria:**
- [ ] Admin can view all contact submissions
- [ ] Can filter and search submissions
- [ ] Can mark status (new → in_progress → resolved)
- [ ] Can delete spam submissions
- [ ] Email link opens mail client with recipient
- [ ] New submissions badge shows count in sidebar

---

### 4. Tax Rate Configuration - 11% VAT for Indonesia

**Problem:** Tax rate hardcoded to 10%, but Indonesian VAT is 11%.

**Solution:**
1. Update system settings default: `tax_rate = 11.00`
2. Make order calculation read from `system_settings.tax_rate`
3. Remove hardcoded `0.10` multipliers

**Files to Update:**
```go
// backend/internal/handlers/orders.go
// Current (wrong):
taxAmount := subtotal * 0.10

// New (correct):
taxRate, _ := getSettingFloat("tax_rate") // reads from system_settings
taxAmount := subtotal * (taxRate / 100)
```

**Frontend Settings:**
```typescript
// AdminSettings.tsx
// Add validation: tax_rate must be 0-100
// Show as percentage in UI
// Default to 11 for Indonesian setup
```

**Acceptance Criteria:**
- [ ] Default tax rate is 11%
- [ ] Order totals calculate with correct tax
- [ ] Admin can change tax rate in settings
- [ ] Changes persist to database
- [ ] Old orders maintain their original tax rate

---

## 🟡 HIGH PRIORITY (Week 2)

### 5. Inventory Management System

**Problem:** `inventory` table exists but no handlers or UI to manage stock.

**Solution:** Complete inventory management implementation.

**Backend Handlers (NEW):**
```go
// File: backend/internal/handlers/inventory.go

type InventoryHandler struct {
    db *sql.DB
}

// GET /api/v1/inventory - List all inventory with current stock
// GET /api/v1/inventory/:product_id - Get inventory for specific product
// POST /api/v1/inventory/adjust - Adjust stock (add/remove with reason)
// GET /api/v1/inventory/low-stock - Get items below minimum threshold
// GET /api/v1/inventory/history/:product_id - Stock movement history
```

**Frontend Pages (NEW):**
```typescript
// File: frontend/src/routes/admin/inventory.tsx
// File: frontend/src/components/admin/InventoryManagement.tsx

Features:
- Table view: Product, Category, Current Stock, Min Stock, Max Stock, Status
- Color coding: Green (OK), Yellow (Low), Red (Out of Stock)
- "Adjust Stock" button per item opens modal:
  - Operation: Add or Remove
  - Quantity input
  - Reason dropdown: Purchase, Sale, Spoilage, Manual Adjustment, Inventory Count
  - Notes textarea
- Bulk import from CSV
- Low stock alert badge in header
- Stock history modal per product
- Export current inventory to CSV
```

**Database Enhancement:**
```sql
-- Add inventory_history table for audit trail
CREATE TABLE inventory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL, -- 'add', 'remove'
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL,
    notes TEXT,
    adjusted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Notifications:**
- Generate notification when stock falls below minimum
- Daily inventory report for managers

**Acceptance Criteria:**
- [ ] Can view current stock for all products
- [ ] Can add/remove stock with reason tracking
- [ ] Low stock items highlighted in red
- [ ] Stock history viewable per product
- [ ] Notifications sent when stock is low
- [ ] CSV import/export working

---

### 6. System Settings UI Completion ✅ IMPLEMENTED

**Status:** ✅ **COMPLETED** (Dec 13, 2025)

**Problem:** AdminSettings component fetches data but UI is incomplete/placeholder.

**Solution:** Complete the system settings interface with full CRUD functionality.

**Implementation Details:**

**Backend Integration:**
- ✅ `GET /api/v1/settings` - Fetches all system settings
- ✅ `PUT /api/v1/settings` - Updates settings (batch)
- ✅ `GET /api/v1/health` - System health check with real-time status
- ✅ Settings persist to `system_settings` table
- ✅ Auto-refetch health every 30 seconds

**Frontend:**
- ✅ **File:** `frontend/src/components/admin/AdminSettings.tsx` (630 lines)
- ✅ **File:** `frontend/src/api/client.ts` - getSettings(), updateSettings(), getSystemHealth()
- ✅ useQuery for data fetching with loading states
- ✅ useMutation for save operations with optimistic updates
- ✅ Toast notifications for success/error
- ✅ Real-time system health monitoring

**Settings Categories Implemented:**

**1. Language Settings:**
- ✅ Language switcher (id-ID, en-US)
- ✅ Instant language switching
- ✅ Persists to localStorage

**2. Restaurant Information:**
- ✅ Restaurant name (editable text)
- ✅ Tagline (text input)
- ✅ Currency (dropdown: IDR, USD, EUR)
- ✅ Default language (dropdown)

**3. Financial Settings:**
- ✅ Tax rate (percentage, 0-100, default 11)
- ✅ Service charge (percentage, 0-100, default 5)
- ✅ Tax calculation method (inclusive/exclusive)
- ✅ Enable rounding (yes/no)

**4. Receipt Settings:**
- ✅ Receipt header text (textarea, 200 chars)
- ✅ Receipt footer text (textarea, 200 chars)
- ✅ Show restaurant logo (checkbox)
- ✅ Paper size (58mm, 80mm)
- ✅ Print customer copy automatically (checkbox)

**5. System Configuration:**
- ✅ Backup frequency (hourly, daily, weekly)
- ✅ Data retention (days, default 365)
- ✅ Session timeout (minutes, default 60)
- ✅ Enable audit logging (checkbox)
- ✅ Low stock threshold (number, default 10)

**6. System Health Status:**
- ✅ Database connection status with latency
- ✅ API status and version
- ✅ Last backup time and next scheduled backup
- ✅ Real-time status indicators (green/red/yellow)
- ✅ Auto-refresh every 30 seconds

**Integration:**
- ✅ Order processing reads tax/service charge from settings
- ✅ Receipt generation uses configured header/footer
- ✅ All settings persist to `system_settings` table
- ✅ React Query cache invalidation

**Acceptance Criteria:**
- [x] All settings editable and saveable
- [x] Settings used by order/payment/receipt systems
- [x] Validation prevents invalid values
- [x] Changes persist across restarts
- [x] System health shows accurate status
- [x] Loading states during fetch/save
- [x] Error handling with user-friendly messages
- [x] Toast notifications on save/error

---

### 7. User Edit Functionality ✅ IMPLEMENTED

**Status:** ✅ **COMPLETED** (Dec 13, 2025)

**Problem:** Can create and delete users but cannot edit existing users.

**Solution:** Add edit functionality to staff management.

**Implementation Details:**

**Backend:**
- ✅ `PUT /api/v1/admin/users/:id` endpoint exists and functional
- ✅ Validates user data and permissions
- ✅ Prevents users from editing their own role
- ✅ Username immutable after creation

**Frontend:**
- ✅ **File:** `frontend/src/components/admin/AdminStaffManagement.tsx`
- ✅ **File:** `frontend/src/components/admin/AdminStaffTable.tsx`
- ✅ **File:** `frontend/src/components/forms/UserForm.tsx`

**Features Implemented:**
- ✅ "Edit" button on each user row in table
- ✅ Edit modal with UserForm in edit mode
- ✅ Form fields: First name, Last name, Email (editable)
- ✅ Username (readonly for security)
- ✅ Role dropdown (admin, manager, server, counter, kitchen)
- ✅ Form validation with Zod schema
- ✅ Save updates via PUT endpoint with mutations
- ✅ Success/error toast notifications

**Security Features:**
- ✅ Cannot edit your own role (prevents lockout)
- ✅ Admin-only role changes
- ✅ Username immutable after creation
- ✅ Password reset requires separate endpoint

**Acceptance Criteria:**
- [x] Edit button opens pre-filled form
- [x] Can update name, email, role, active status
- [x] Username immutable for security
- [x] Validation prevents invalid data
- [x] Cannot edit own role
- [x] Changes save successfully
- [x] Toast notifications on success/error
- [x] Query invalidation refreshes user list

---

### 8. Notification System Activation

**Problem:** Notification infrastructure exists but no notifications are actually generated.

**Solution:** Implement notification generation for key events.

**Notification Events:**

**Order Events:**
```go
// When order created:
createNotification(userID, "order", "New Order #1234", 
    "New dine-in order for Table 5 - 3 items")

// When order status changes:
createNotification(userID, "order", "Order Ready #1234", 
    "Order for Table 5 is ready to serve")
```

**Inventory Events:**
```go
// When stock falls below minimum:
createNotification(adminUsers, "inventory", "Low Stock Alert", 
    "Wagyu Tenderloin stock is below minimum (3 remaining)")

// Daily inventory report:
createNotification(managerUsers, "report", "Daily Inventory Report",
    "5 items low stock, 2 items out of stock")
```

**Payment Events:**
```go
// When payment received:
createNotification(userID, "payment", "Payment Received #1234",
    "Payment of Rp 500.000 received for Table 5")
```

**System Events:**
```go
// Database connection issues:
createNotification(adminUsers, "system", "Database Warning",
    "Database latency is high (>100ms)")

// Backup completion:
createNotification(adminUsers, "system", "Backup Complete",
    "Daily backup completed successfully")
```

**Implementation:**
```go
// File: backend/internal/services/notification.go

type NotificationService struct {
    db *sql.DB
}

func (s *NotificationService) Create(userIDs []uuid.UUID, notifType, title, message string) error {
    // Check user preferences
    // Check quiet hours
    // Insert notification
    // Send email if enabled (future)
}
```

**Acceptance Criteria:**
- [ ] Notifications generated on key events
- [ ] Respects user preferences
- [ ] Respects quiet hours setting
- [ ] Unread badge shows count
- [ ] Mark as read functionality works
- [ ] Notification types filter correctly

---

## 🟢 MEDIUM PRIORITY (Week 3)

### 9. Empty States - Better UX for No Data

**Problem:** When lists/tables are empty, users see blank space or generic "No data" messages, causing confusion about what to do next.

**Solution:** Implement comprehensive empty state components across the application with helpful messages and call-to-action buttons.

**Features:**

**Empty State Component:**
- **File:** `frontend/src/components/ui/empty-state.tsx`
- Reusable component with icon, title, description, and action buttons
- Full variant: Large icon, prominent title, detailed description, primary + secondary actions
- Inline variant: Compact version for smaller spaces
- Supports custom children for flexible layouts

**Component API:**
```typescript
interface EmptyStateProps {
  icon: LucideIcon           // Icon component from lucide-react
  title: string              // Main heading
  description: string        // Helpful explanation
  action?: {                 // Primary action button
    label: string
    onClick: () => void
  }
  secondaryAction?: {        // Optional secondary action
    label: string
    onClick: () => void
  }
  className?: string         // Custom styling
  children?: ReactNode       // Custom content
}
```

**Integrated Components:**

1. **Order History** (`AdminOrderHistory.tsx`)
   - Empty with filters: "No orders match your search" + "Clear Filters" button
   - Empty without filters: "No orders yet. New orders will appear here"
   - Icon: Receipt
   - Height: 400px centered display

2. **Staff Management** (`AdminStaffManagement.tsx`)
   - Empty with search: "No staff found" + "Clear Search" button
   - Empty without search: "No staff yet. Start by adding new staff" + "Add Staff" button
   - Icon: Users
   - Contextual messaging based on search state

3. **Inventory Management** (`InventoryManagement.tsx`)
   - Empty state: "No inventory items yet"
   - Description: "Inventory system ready. Items appear automatically when products are added with stock info"
   - Icon: PackageOpen
   - No action button (passive state)

4. **Product Management** (`AdminMenuManagement.tsx`)
   - Products empty with search: "No products found" + "Clear Search" button
   - Products empty: "No products yet. Start by adding your first product" + "Add Product" button
   - Categories empty with search: "No categories found" + "Clear Search" button
   - Categories empty: "No categories yet. Create categories to organize your menu" + "Add Category" button
   - Icons: UtensilsCrossed (products), Tag (categories)

5. **Table Management** (`AdminTableManagement.tsx`)
   - Empty with filters: "No tables found" + "Clear Filters" button
   - Empty without filters: "No tables yet. Start by adding your first table" + "Add Table" button
   - Icon: Table
   - Filter-aware messaging

6. **Contact Submissions** (`ContactSubmissions.tsx`)
   - Empty with status filter: "No messages with this status" + "View All Messages" button
   - Empty without filter: "No contact messages yet. Messages from website contact form will appear here"
   - Icon: Inbox
   - Informative description about where messages come from

**Design Patterns:**

**Visual Hierarchy:**
```tsx
<div className="flex flex-col items-center justify-center p-8 text-center">
  <div className="rounded-full bg-muted p-6 mb-4">
    <Icon className="w-12 h-12 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">{title}</h3>
  <p className="text-muted-foreground max-w-md mb-6">{description}</p>
  <div className="flex gap-3">
    <Button onClick={action.onClick}>{action.label}</Button>
  </div>
</div>
```

**Contextual Messaging Rules:**
1. **With Search/Filters:** Explain why results are empty + offer to clear filters
2. **Without Search/Filters:** Explain what the feature does + offer to create first item
3. **Passive States:** Explain automatic behavior (e.g., inventory auto-populates)
4. **Error States:** Clear explanation + recovery action

**Integration in Tables:**
```typescript
<TableBody>
  {items.length === 0 ? (
    <TableRow>
      <TableCell colSpan={columns} className="h-[400px] p-0">
        <EmptyState
          icon={IconComponent}
          title="No items found"
          description="Helpful explanation here"
          action={{ label: "Action", onClick: handler }}
        />
      </TableCell>
    </TableRow>
  ) : (
    items.map(item => <TableRow>...</TableRow>)
  )}
</TableBody>
```

**Benefits:**

**For Users:**
- Clear understanding of empty states
- Guided next actions
- Reduced confusion and support requests
- Professional appearance

**For Business:**
- Improved onboarding experience
- Higher feature adoption
- Reduced training time
- Better user satisfaction

**Technical Implementation:**

**Files Created:**
1. ✅ `frontend/src/components/ui/empty-state.tsx` (97 lines)
   - EmptyState component (main variant)
   - EmptyStateInline component (compact variant)

**Files Modified:**
1. ✅ `frontend/src/components/admin/AdminOrderHistory.tsx` - Order history empty state
2. ✅ `frontend/src/components/admin/AdminStaffManagement.tsx` - Staff list empty state
3. ✅ `frontend/src/components/admin/InventoryManagement.tsx` - Inventory empty state
4. ✅ `frontend/src/components/admin/AdminMenuManagement.tsx` - Products & categories empty states
5. ✅ `frontend/src/components/admin/AdminTableManagement.tsx` - Tables empty state
6. ✅ `frontend/src/components/admin/ContactSubmissions.tsx` - Contact messages empty state

**Acceptance Criteria:**
- [x] EmptyState component created and reusable
- [x] All major list/table views have empty states
- [x] Contextual messaging based on filter/search state
- [x] Action buttons navigate to appropriate forms
- [x] Icons visually represent the content type
- [x] No generic "No data" messages remaining
- [x] Responsive design works on mobile/tablet
- [x] TypeScript types properly defined

**Testing Checklist:**
- [x] Empty order history (with/without filters)
- [x] Empty staff list (with/without search)
- [x] Empty inventory list
- [x] Empty products list (with/without search)
- [x] Empty categories list (with/without search)
- [x] Empty tables list (with/without filters)
- [x] Empty contact submissions (with/without status filter)
- [x] Action buttons trigger correct handlers
- [x] Clear filter buttons reset state properly

**User Experience Improvements:**

**Before:**
- Blank table with "No data" message
- Users confused about next steps
- No guidance for filtered results
- Generic messaging

**After:**
- Large icon with visual context
- Clear title explaining the state
- Descriptive text with helpful guidance
- Prominent action button for next step
- Different messages for filtered vs empty states
- Professional, polished appearance

**Future Enhancements (Out of Scope):**
- Animated empty state illustrations
- Video tutorials in empty states
- Tips/suggestions carousel
- Recently deleted items restore
- Suggested actions based on user role
- Empty state templates for custom pages

---

### 10. Indonesian Language Support (i18n)

**Problem:** All UI text is in English.

**Solution:** Add internationalization with Bahasa Indonesia support.

**Implementation:**
```bash
npm install react-i18next i18next
```

**File Structure:**
```
frontend/src/
  locales/
    en/
      common.json
      orders.json
      products.json
    id/
      common.json
      orders.json
      products.json
  i18n.ts
```

**Example Translations:**
```json
// locales/id/common.json
{
  "orders": "Pesanan",
  "products": "Produk",
  "categories": "Kategori",
  "tables": "Meja",
  "staff": "Staff",
  "settings": "Pengaturan",
  "logout": "Keluar",
  "save": "Simpan",
  "cancel": "Batal",
  "delete": "Hapus",
  "edit": "Edit",
  "create": "Buat Baru"
}

// locales/id/orders.json
{
  "new_order": "Pesanan Baru",
  "order_number": "No. Pesanan",
  "table_number": "No. Meja",
  "customer_name": "Nama Pelanggan",
  "order_type": "Tipe Pesanan",
  "dine_in": "Makan di Tempat",
  "takeout": "Bawa Pulang",
  "total": "Total",
  "subtotal": "Subtotal",
  "tax": "Pajak",
  "service_charge": "Service Charge"
}
```

**Language Switcher:**
- Add to header: Flag icon dropdown
- Options: 🇮🇩 Bahasa | 🇬🇧 English
- Persist preference to localStorage
- Default to Indonesian for production

**Acceptance Criteria:**
- [ ] All UI text translatable
- [ ] Indonesian translations complete
- [ ] Language switcher in header
- [ ] Preference persists
- [ ] Date/time formatted per locale
- [ ] Currency respects locale (Rp vs $)

---

### 10. Receipt Thermal Printer Integration

**Problem:** Receipt shows on screen but cannot print to physical printer.

**Solution:** Integrate thermal printer support.

**Printer Library:**
```bash
npm install electron-pos-printer
# or
npm install escpos escpos-usb
```

**Implementation:**
```typescript
// File: frontend/src/lib/printer.ts

import { PosPrinter } from 'electron-pos-printer';

interface ReceiptData {
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod: string;
}

export async function printReceipt(data: ReceiptData, printerName?: string) {
  const options = {
    preview: false,
    width: '80mm',
    margin: '0 0 0 0',
    copies: 2, // customer + kitchen copy
    printerName: printerName || 'default',
    silent: true
  };

  const receipt = [
    {
      type: 'text',
      value: 'MODERN STEAK INDONESIA',
      style: 'text-align:center;font-size:20px;font-weight:bold;'
    },
    {
      type: 'text',
      value: 'Jl. Sudirman No. 123, Jakarta',
      style: 'text-align:center;'
    },
    // ... format receipt content
  ];

  await PosPrinter.print(receipt, options);
}
```

**Settings Integration:**
- Add printer configuration to system settings
- Printer name/IP selection
- Paper size (58mm/80mm)
- Auto-print option (yes/no)
- Test print button

**Acceptance Criteria:**
- [ ] Can print receipt to thermal printer
- [ ] Receipt formatted correctly (80mm paper)
- [ ] Prints customer copy + kitchen copy
- [ ] Auto-print after payment (if enabled)
- [ ] Test print works from settings
- [ ] Handles printer errors gracefully

---

### 11. Order Status History Viewer

**Problem:** `order_status_history` table tracks changes but no UI to view them.

**Solution:** Add order history modal/section.

**Frontend Component:**
```typescript
// File: frontend/src/components/admin/OrderStatusHistory.tsx

Features:
- Timeline view of status changes
- Shows: Status, Changed By, Timestamp, Notes
- Icons for each status type
- Color coding (pending=yellow, completed=green, cancelled=red)
- Accessible from order detail view
```

**Display Format:**
```
Order #1234 Status History
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 COMPLETED
   by: John Doe (Counter)
   at: Dec 12, 2024 14:30
   note: Payment received

🔵 READY
   by: Kitchen Staff
   at: Dec 12, 2024 14:15
   note: All items prepared

🟡 PREPARING
   by: Jane Server
   at: Dec 12, 2024 13:45
   note: Order confirmed
```

**Acceptance Criteria:**
- [ ] History visible in order detail view
- [ ] Timeline format with timestamps
- [ ] Shows who made each change
- [ ] Color coded by status
- [ ] Includes change notes if any

---

## 🔵 LOW PRIORITY (Week 4)

### 12. Dark/Light Mode Theme System

**Problem:** System lacks theme customization, causing eye strain in different lighting conditions.

**Solution:** Implement comprehensive dark/light mode system with automatic detection and persistence.

**Features:**

**Theme Provider:**
- React Context-based theme management
- Three modes: light, dark, system (follows OS preference)
- Automatic detection via `prefers-color-scheme` media query
- LocalStorage persistence across sessions
- Seamless switching without page reload

**Theme Toggle Component:**
- Dropdown menu with sun/moon icons
- Options: Light, Dark, System
- Animated icon transitions
- Accessible with keyboard navigation
- Positioned in admin sidebar above user menu

**CSS Implementation:**
- Tailwind CSS dark mode with class strategy
- CSS custom properties for theming
- Consistent color scheme in both modes:
  - Light: White backgrounds, dark text
  - Dark: Dark backgrounds (#222.2 84% 4.9%), light text
- All UI components support both themes
- Smooth transitions between modes

**Color Palette:**

Light Mode:
```css
--background: 0 0% 100%
--foreground: 222.2 84% 4.9%
--card: 0 0% 100%
--primary: 222.2 47.4% 11.2%
--border: 214.3 31.8% 91.4%
```

Dark Mode:
```css
--background: 222.2 84% 4.9%
--foreground: 210 40% 98%
--card: 222.2 84% 4.9%
--primary: 210 40% 98%
--border: 217.2 32.6% 17.5%
```

**Implementation Details:**

**Files Created:**
- `frontend/src/components/theme-provider.tsx` - Theme context and provider
- `frontend/src/components/theme-toggle.tsx` - Toggle component with dropdown

**Files Modified:**
- `frontend/src/main.tsx` - Wrap app with ThemeProvider
- `frontend/tailwind.config.js` - Add `darkMode: ["class"]`
- `frontend/src/index.css` - Already has dark mode CSS variables
- `frontend/src/components/admin/AdminLayout.tsx` - Add ThemeToggle component

**Usage Example:**
```typescript
// In any component:
import { useTheme } from '@/components/theme-provider'

const { theme, setTheme } = useTheme()

// Set theme programmatically:
setTheme('dark')
setTheme('light')
setTheme('system')
```

**User Experience:**
1. User clicks theme toggle in sidebar
2. Dropdown shows three options with icons
3. Selected theme applies instantly
4. Theme persists to localStorage (`pos-theme` key)
5. System preference auto-detects on first visit
6. All pages and components reflect theme change

**Acceptance Criteria:**
- [ ] Theme toggle visible in admin sidebar
- [ ] Three modes functional (light, dark, system)
- [ ] Theme persists across sessions
- [ ] System preference auto-detection works
- [ ] All UI components render correctly in both themes
- [ ] Smooth transitions without flash
- [ ] No layout shifts during theme change
- [ ] Accessible with keyboard and screen readers

**Testing Checklist:**
- [ ] Test on Windows (system theme detection)
- [ ] Test on macOS (system theme detection)
- [ ] Test localStorage persistence
- [ ] Verify all admin pages in dark mode
- [ ] Verify all admin pages in light mode
- [ ] Check POS interface compatibility
- [ ] Check kitchen display compatibility
- [ ] Verify receipt printer output (should be unaffected)

**Technical Benefits:**
- Reduces eye strain for staff during night shifts
- Professional appearance option for client demos
- Aligns with modern UI/UX standards
- Improves accessibility compliance
- Energy savings on OLED displays

**Future Enhancements (Out of Scope):**
- Custom color themes (brand colors)
- Per-user theme preferences (requires backend)
- Scheduled theme switching (auto dark at night)
- High contrast mode for accessibility
- Theme preview before applying

---

### 13. Barcode Product Scanning

**Solution:** Add barcode scanning for faster product selection.

**Database:**
```sql
-- Add index to products.barcode column
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
```

**Frontend:**
```typescript
// Use existing barcode field in products
// Add scanner input box in ServerStation and CounterInterface
// On scan, auto-add product to cart
```

**Acceptance Criteria:**
- [ ] Barcode input field visible
- [ ] Scanning adds product instantly
- [ ] Shows error if barcode not found
- [ ] Works with USB barcode scanners

---

### 14. Testing Suite Implementation

**Problem:** Only ~2% test coverage.

**Solution:** Add comprehensive testing.

**Backend Tests:**
```go
// File: backend/internal/handlers/orders_test.go
// File: backend/internal/handlers/products_test.go
// File: backend/internal/handlers/auth_test.go

- Test all CRUD operations
- Test role-based permissions
- Test validation errors
- Test concurrent operations
```

**Frontend Tests:**
```typescript
// Use Vitest + React Testing Library

// File: frontend/src/components/admin/__tests__/OrderManagement.test.tsx
// File: frontend/src/components/server/__tests__/ServerInterface.test.tsx

- Component rendering tests
- User interaction tests
- API integration tests (mocked)
- Form validation tests
```

**E2E Tests:**
```typescript
// Use Playwright or Cypress

test('Complete order flow', async () => {
  // Login as server
  // Select table
  // Add products to cart
  // Submit order
  // Verify order appears in kitchen
  // Mark items as ready
  // Process payment
  // Verify order completed
});
```

**Target Coverage:**
- Backend: >80%
- Frontend: >70%
- E2E: Critical flows

---

## Implementation Checklist

### ✅ Week 3: Completed Features (Dec 13, 2025)
- [x] **Dark/Light Mode** - Theme system with persistence and system detection
- [x] **Empty States** - Better UX for no data scenarios across all components
- [x] **Staff Editing** - Complete CRUD for users (create, read, update, delete)
- [x] **Advanced Settings** - System configuration panel with backend integration

### Week 1: Critical Fixes
- [ ] Update all currency formatting to IDR
- [ ] Replace seed data with Indonesian menu
- [x] Create contact submissions admin page
- [ ] Fix tax rate to 11%
- [ ] Test all currency displays
- [ ] Verify menu data loads correctly

### Week 2: High Priority
- [x] Implement inventory management (backend + frontend)
- [x] Complete system settings UI
- [x] Add user edit functionality
- [ ] Activate notification generation
- [ ] Test inventory tracking
- [ ] Verify notifications work

### Week 3: Medium Priority
- [x] Dark/Light Mode - Theme system (COMPLETED Dec 13, 2025)
- [x] Empty States - Better UX (COMPLETED Dec 13, 2025)
- [ ] Add Indonesian language support (i18n)
- [ ] Integrate thermal printer
- [ ] Add order status history viewer
- [ ] Translation completion
- [ ] Printer testing

### Week 4: Polish & Testing
- [ ] Add barcode scanning
- [ ] Implement test suite (backend/frontend/e2e)
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Production deployment preparation
- [ ] User acceptance testing

---

## Success Metrics

**Technical Metrics:**
- [ ] 0 currency inconsistencies (all IDR)
- [ ] 100% Indonesian menu items
- [ ] Test coverage >70%
- [ ] Page load time <2 seconds
- [ ] No critical bugs in production

**Business Metrics:**
- [ ] Staff can use system in Indonesian
- [ ] Inventory tracking prevents stockouts
- [ ] Customer inquiries responded within 24 hours
- [ ] Receipt printing works reliably
- [ ] System uptime >99.5%

---

## Risk Mitigation

**High Risk:**
- Currency changes affect all order calculations → Extensive testing required
- Menu data replacement → Backup current database before migration
- Printer integration may fail on different hardware → Provide fallback (PDF export)

**Medium Risk:**
- i18n may miss some strings → Comprehensive text audit needed
- Notification spam → Implement rate limiting and user preferences

**Low Risk:**
- Barcode scanner compatibility → Test with multiple scanner models
- Test implementation time → Can be done iteratively

---

## 🔴 PRODUCTION BUG FIXES (Critical - Reported Dec 13, 2025)

### 1. Admin Dashboard - Settings & Reports Navigation

**Problem:** Settings and Reports buttons in admin dashboard do not redirect properly.

**Location:** `http://localhost:3000/admin/dashboard`

**Expected Behavior:**
- "Settings" button → Navigate to `/admin/settings`
- "Reports" button → Navigate to `/admin/reports`

**Root Cause:** Missing onClick handlers or incorrect route paths.

**Solution:**
```typescript
// File: frontend/src/components/admin/AdminDashboard.tsx
// Update button onClick to use router navigation:
const navigate = useNavigate()

<Button onClick={() => navigate('/admin/settings')}>
  <Settings className="mr-2" /> Settings
</Button>

<Button onClick={() => navigate('/admin/reports')}>
  <FileText className="mr-2" /> Reports
</Button>
```

**Acceptance Criteria:**
- [ ] Clicking "Settings" navigates to settings page
- [ ] Clicking "Reports" navigates to reports page
- [ ] No console errors on click

---

### 2. Server Station - Send Order to Kitchen Broken

**Problem:** "Send to Kitchen" button in server station does not submit orders.

**Location:** `http://localhost:3000/admin/server`

**Expected Behavior:**
- Server selects products → clicks "Send to Kitchen" → order created with status "pending"
- Kitchen display shows new order immediately

**Possible Causes:**
- Missing API endpoint integration
- Incorrect order submission payload
- Missing validation before submission

**Solution:**
```typescript
// File: frontend/src/components/admin/ServerStation.tsx
// Verify mutation is connected:
const createOrderMutation = useMutation({
  mutationFn: async (orderData) => {
    return await apiClient.createOrder({
      table_id: selectedTable,
      items: cartItems,
      order_type: 'dine-in',
      customer_name: customerName,
      notes: orderNotes
    })
  },
  onSuccess: (data) => {
    toast.success('Order sent to kitchen!')
    queryClient.invalidateQueries(['orders'])
    clearCart()
  }
})
```

**Backend Verification:**
- Ensure `POST /api/v1/orders` endpoint exists
- Check if order validation is too strict
- Verify JWT token is included in request headers

**Acceptance Criteria:**
- [ ] Order submits successfully to backend
- [ ] Kitchen display updates with new order
- [ ] Success toast appears
- [ ] Cart clears after submission

---

### 3. Counter Station - Create Order & Payment Processing Failure

**Problem:** 
- "Create Order" button does not proceed
- "Process Payment" button also fails

**Location:** `http://localhost:3000/admin/counter`

**Expected Behavior:**
- Counter staff adds items → clicks "Create Order" → payment modal opens
- Selects payment method → clicks "Process Payment" → order marked as paid

**Debugging Steps:**
1. Check browser console for errors
2. Verify API endpoint responses
3. Check if validation is blocking submission

**Solution:**
```typescript
// File: frontend/src/components/counter/CounterInterface.tsx

// Fix 1: Ensure order creation validation
const handleCreateOrder = () => {
  if (cartItems.length === 0) {
    toast.error('Cart is empty')
    return
  }
  if (!selectedPaymentMethod) {
    toast.error('Select payment method')
    return
  }
  
  createOrderMutation.mutate({
    items: cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    })),
    payment_method: selectedPaymentMethod,
    order_type: 'takeaway' // or 'dine-in'
  })
}

// Fix 2: Process payment mutation
const processPaymentMutation = useMutation({
  mutationFn: async (paymentData) => {
    return await apiClient.processPayment({
      order_id: currentOrder.id,
      payment_method: paymentData.method,
      amount_paid: paymentData.amount
    })
  },
  onSuccess: () => {
    toast.success('Payment processed!')
    navigate('/admin/counter')
  }
})
```

**Acceptance Criteria:**
- [ ] Create Order button submits successfully
- [ ] Payment modal opens with order details
- [ ] Process Payment completes transaction
- [ ] Receipt can be printed

---

### 4. Counter vs Server Station - UX Confusion

**Question:** What's the difference between Counter (`/admin/counter`) and Server (`/admin/server`) menus?

**Current Implementation:**
- **Server Station** (`/admin/server`): For waiters managing dine-in orders with table assignments
- **Counter Station** (`/admin/counter`): For takeaway/delivery orders without table selection

**User Suggestion:** Remove one interface to reduce confusion.

**Recommendation:**
- **Keep Counter Station** - Used for takeaway orders (most common in Indonesian steakhouses)
- **Keep Server Station** - Used for dine-in table service
- **Solution:** Clarify with role-based access:
  - Server role → Only see Server Station
  - Counter role → Only see Counter Station
  - Admin role → See both

**Implementation:**
```typescript
// File: frontend/src/components/RoleBasedLayout.tsx
// Hide unused station based on role:

if (userRole === 'server') {
  // Show: /admin/server only
  // Hide: /admin/counter
}

if (userRole === 'counter') {
  // Show: /admin/counter only
  // Hide: /admin/server
}
```

**Alternative:** Merge both into single "Orders" interface with toggle:
```typescript
<Tabs>
  <TabsList>
    <TabsTrigger value="dine-in">Dine-In (Tables)</TabsTrigger>
    <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
  </TabsList>
</Tabs>
```

**Acceptance Criteria:**
- [ ] User understands which station to use
- [ ] Role-based visibility implemented
- [ ] No duplicate functionality

---

### 5. Theme Toggle Not Visible in Settings

**Problem:** User cannot find dark/light theme toggle in settings page.

**Location:** `http://localhost:3000/admin/settings`

**Expected Location:** Theme toggle should be in:
1. **Settings page** - Under "Appearance" section
2. **Header/Sidebar** - Quick access toggle

**Current Status:**
- Theme toggle exists in AdminLayout sidebar (when expanded)
- Not visible in Settings page

**Solution:**
```typescript
// File: frontend/src/components/admin/AdminSettings.tsx
// Add Appearance section:

<Card>
  <CardHeader>
    <CardTitle>Appearance Settings</CardTitle>
    <CardDescription>Customize the look and feel</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <Label>Theme</Label>
        <p className="text-sm text-muted-foreground">
          Choose light or dark theme
        </p>
      </div>
      <ThemeToggle />
    </div>
  </CardContent>
</Card>
```

**Sidebar Toggle:**
- Already implemented in `AdminLayout.tsx`
- Located above UserMenu when sidebar is expanded
- **Issue:** Only visible when sidebar is open

**Fix:** Make theme toggle always accessible:
```typescript
// Option 1: Add to collapsed sidebar as icon-only button
{!sidebarExpanded && (
  <Button variant="ghost" size="icon">
    <Sun className="h-5 w-5" />
  </Button>
)}

// Option 2: Add to header next to UserMenu
<div className="flex items-center gap-2">
  <ThemeToggle />
  <UserMenu />
</div>
```

**Acceptance Criteria:**
- [ ] Theme toggle visible in Settings page
- [ ] Theme toggle accessible from header/sidebar
- [ ] Theme changes apply immediately
- [ ] Theme preference persists across sessions

---

### 6. Settings Save - Invalid Format Error

**Problem:** Saving settings returns "invalid format" error.

**Location:** `http://localhost:3000/admin/settings`

**Error Message:** "Invalid format, failed to save"

**Possible Causes:**
1. **Frontend validation error** - Zod schema rejecting data
2. **Backend validation error** - API expecting different format
3. **Data type mismatch** - String vs Number, etc.

**Debugging:**
```typescript
// File: frontend/src/components/admin/AdminSettings.tsx
// Add detailed error logging:

const saveSettingsMutation = useMutation({
  mutationFn: async (newSettings) => {
    console.log('Submitting settings:', newSettings)
    return await apiClient.updateSettings(newSettings)
  },
  onError: (error) => {
    console.error('Settings save error:', error)
    console.error('Error response:', error.response?.data)
    toast.error(`Failed to save: ${error.response?.data?.message || error.message}`)
  }
})
```

**Common Issues:**

**Issue 1: Tax Rate as String**
```typescript
// Wrong:
tax_rate: "11" // String

// Correct:
tax_rate: 11 // Number
```

**Issue 2: Missing Required Fields**
```typescript
// Backend expects all fields, frontend sends partial update
// Solution: Merge with existing settings
const updatedSettings = {
  ...existingSettings,
  ...newSettings
}
```

**Issue 3: Invalid JSON in Text Fields**
```typescript
// If using JSON fields, validate first:
try {
  JSON.parse(settings.metadata)
} catch (e) {
  toast.error('Invalid JSON in metadata field')
  return
}
```

**Solution:**
```typescript
// File: backend/internal/handlers/settings.go
// Add detailed validation error messages:

func UpdateSettings(c *gin.Context) {
    var settings map[string]interface{}
    if err := c.ShouldBindJSON(&settings); err != nil {
        c.JSON(400, gin.H{
            "error": "Invalid format",
            "details": err.Error(),
            "hint": "Check tax_rate is number, not string"
        })
        return
    }
    
    // Validate specific fields
    if taxRate, ok := settings["tax_rate"].(float64); ok {
        if taxRate < 0 || taxRate > 100 {
            c.JSON(400, gin.H{
                "error": "Invalid tax_rate",
                "details": "Must be between 0 and 100"
            })
            return
        }
    }
}
```

**Acceptance Criteria:**
- [ ] Settings save successfully
- [ ] Error messages are specific and helpful
- [ ] No "invalid format" generic errors
- [ ] Validation happens on both frontend and backend

---

### 7. Inventory Management - Raw Stock Input Missing

**Question:** Where is the menu to input inventory for raw stock (French fries, tomato, sauce, etc)?

**Location:** `http://localhost:3000/admin/inventory`

**Current Status:** Inventory page likely shows finished products only.

**Expected Behavior:** 
- Admin can add raw ingredients (not just menu items)
- Track stock levels for ingredients
- Link ingredients to products (recipe management)

**Solution 1: Add Ingredients Section**

```typescript
// File: frontend/src/routes/admin/inventory.tsx
// Add tabs for Products vs Ingredients:

<Tabs defaultValue="products">
  <TabsList>
    <TabsTrigger value="products">Finished Products</TabsTrigger>
    <TabsTrigger value="ingredients">Raw Ingredients</TabsTrigger>
  </TabsList>
  
  <TabsContent value="products">
    {/* Existing product inventory */}
  </TabsContent>
  
  <TabsContent value="ingredients">
    <IngredientsInventory />
  </TabsContent>
</Tabs>
```

**Database Schema:**
```sql
-- Create ingredients table
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- kg, gram, liter, piece
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,2) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link ingredients to products (recipe)
CREATE TABLE product_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL, -- Amount needed per product
    UNIQUE(product_id, ingredient_id)
);
```

**API Endpoints:**
```
POST   /api/v1/inventory/ingredients        - Create ingredient
GET    /api/v1/inventory/ingredients        - List all ingredients
PUT    /api/v1/inventory/ingredients/:id    - Update ingredient
DELETE /api/v1/inventory/ingredients/:id    - Delete ingredient
POST   /api/v1/inventory/ingredients/:id/adjust - Adjust stock
```

**Frontend Component:**
```typescript
// File: frontend/src/components/admin/IngredientsInventory.tsx

<Card>
  <CardHeader>
    <CardTitle>Raw Ingredients Inventory</CardTitle>
    <Button onClick={() => setShowAddModal(true)}>
      <Plus /> Add Ingredient
    </Button>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ingredient</TableHead>
          <TableHead>Current Stock</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Min Stock</TableHead>
          <TableHead>Cost/Unit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map(ing => (
          <TableRow key={ing.id}>
            <TableCell>{ing.name}</TableCell>
            <TableCell>{ing.current_stock}</TableCell>
            <TableCell>{ing.unit}</TableCell>
            <TableCell>{ing.minimum_stock}</TableCell>
            <TableCell>{formatCurrency(ing.cost_per_unit)}</TableCell>
            <TableCell>
              <Badge variant={ing.current_stock < ing.minimum_stock ? 'destructive' : 'success'}>
                {ing.current_stock < ing.minimum_stock ? 'Low Stock' : 'OK'}
              </Badge>
            </TableCell>
            <TableCell>
              <Button onClick={() => handleAdjustStock(ing)}>
                Adjust Stock
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

**Acceptance Criteria:**
- [ ] Can add raw ingredients (name, unit, cost)
- [ ] Can adjust ingredient stock levels
- [ ] Low stock alerts for ingredients
- [ ] Can link ingredients to products (optional v2)

---

### 8. Staff Update - 404 Error

**Problem:** Updating staff fails with 404 status code.

**Location:** `http://localhost:3000/admin/staff`

**Error:** `PUT /api/v1/admin/users/:id` returns 404

**Possible Causes:**
1. **Incorrect API endpoint path** - Frontend calling wrong URL
2. **Backend route not registered** - Missing PUT handler
3. **User ID format issue** - UUID vs string mismatch
4. **Middleware blocking request** - Auth/permission check failing

**Debugging:**
```typescript
// File: frontend/src/components/admin/AdminStaffManagement.tsx
// Add logging to mutation:

const updateUserMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    console.log('Updating user:', { id, data })
    console.log('API URL:', `/api/v1/admin/users/${id}`)
    return await apiClient.updateUser(id, data)
  },
  onError: (error) => {
    console.error('Update error:', error)
    console.error('Error response:', error.response)
  }
})
```

**Solution 1: Verify API Client**
```typescript
// File: frontend/src/api/client.ts
// Ensure endpoint is correct:

export const updateUser = async (userId: string, data: Partial<User>) => {
  // Wrong: /api/v1/users/:id (missing /admin)
  // Correct: /api/v1/admin/users/:id
  
  const response = await axiosInstance.put(
    `/api/v1/admin/users/${userId}`,
    data
  )
  return response.data
}
```

**Solution 2: Backend Route Registration**
```go
// File: backend/internal/api/routes.go
// Verify route exists:

admin := router.Group("/api/v1/admin")
admin.Use(authMiddleware(), adminMiddleware())
{
    // Ensure this line exists:
    admin.PUT("/users/:id", handlers.UpdateUser)
}
```

**Solution 3: Handler Implementation**
```go
// File: backend/internal/handlers/users.go
func UpdateUser(c *gin.Context) {
    userID := c.Param("id")
    
    // Validate UUID
    if _, err := uuid.Parse(userID); err != nil {
        c.JSON(400, gin.H{"error": "Invalid user ID format"})
        return
    }
    
    var updateData User
    if err := c.ShouldBindJSON(&updateData); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Check if user exists
    var existingUser User
    if err := db.First(&existingUser, "id = ?", userID).Error; err != nil {
        c.JSON(404, gin.H{"error": "User not found"})
        return
    }
    
    // Update user
    if err := db.Model(&existingUser).Updates(updateData).Error; err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, existingUser)
}
```

**Solution 4: Check Permissions**
```go
// Ensure user has permission to update users
func UpdateUser(c *gin.Context) {
    currentUser := c.MustGet("user").(User)
    
    // Only admin and manager can update users
    if currentUser.Role != "admin" && currentUser.Role != "manager" {
        c.JSON(403, gin.H{"error": "Insufficient permissions"})
        return
    }
    
    // Rest of handler...
}
```

**Testing:**
```bash
# Test with curl:
curl -X PUT http://localhost:8080/api/v1/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name",
    "email": "updated@example.com"
  }'
```

**Acceptance Criteria:**
- [ ] Staff update returns 200 status
- [ ] User data updates in database
- [ ] Success toast appears
- [ ] User list refreshes with updated data
- [ ] No 404 errors in console

---

## Production Readiness Criteria

System is production-ready when:
- ✅ All CRITICAL fixes completed and tested
- ✅ Currency displays correctly everywhere (IDR)
- ✅ Menu contains Indonesian steak items
- ✅ Contact forms visible to admin
- ✅ Tax calculations correct (11%)
- ✅ System settings functional
- ✅ Inventory tracking operational
- ✅ No TypeScript/Go compilation errors
- ✅ Database migrations applied successfully
- ✅ User acceptance testing passed
- ✅ Performance benchmarks met
- ✅ Security audit completed
- ✅ Backup/restore procedures tested
- ✅ Staff training completed

**Target Launch Date:** 4 weeks from implementation start