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

### 6. System Settings UI Completion

**Problem:** AdminSettings component fetches data but UI is incomplete/placeholder.

**Solution:** Complete the system settings interface with full CRUD functionality.

**Settings to Implement:**

**Restaurant Information:**
- Restaurant name (editable text)
- Tagline (text input)
- Currency (dropdown: IDR, USD, EUR) - locked to IDR for Indonesia
- Default language (dropdown: id-ID, en-US)

**Financial Settings:**
- Tax rate (percentage, 0-100, default 11)
- Service charge (percentage, 0-100, default 5)
- Tax calculation method (inclusive/exclusive)
- Enable rounding (yes/no)

**Receipt Settings:**
- Receipt header text (textarea, 200 chars)
- Receipt footer text (textarea, 200 chars)
- Show restaurant logo (checkbox)
- Paper size (58mm, 80mm)
- Print customer copy automatically (checkbox)

**System Configuration:**
- Backup frequency (hourly, daily, weekly)
- Data retention (days, default 365)
- Session timeout (minutes, default 60)
- Enable audit logging (checkbox)
- Low stock threshold (number, default 10)

**Integration:**
- Order processing must read tax/service charge from settings
- Receipt generation must use configured header/footer
- All settings persist to `system_settings` table

**Acceptance Criteria:**
- [ ] All settings editable and saveable
- [ ] Settings used by order/payment/receipt systems
- [ ] Validation prevents invalid values
- [ ] Changes persist across restarts
- [ ] System health shows accurate status

---

### 7. User Edit Functionality

**Problem:** Can create and delete users but cannot edit existing users.

**Solution:** Add edit functionality to staff management.

**Backend (Already Exists):**
- `PUT /api/v1/admin/users/:id` endpoint exists

**Frontend Updates:**
```typescript
// File: frontend/src/components/admin/AdminStaffManagement.tsx

Add:
- "Edit" button on each user card
- Edit modal with form:
  - First name, Last name (editable)
  - Email (editable)
  - Username (readonly - security)
  - Role (dropdown: admin, manager, server, counter, kitchen)
  - Active status (toggle)
  - Reset password button (generates temporary password)
- Form validation matching create user
- Save updates via PUT endpoint
```

**Security Considerations:**
- Cannot edit your own role (prevent lockout)
- Admin only can change roles
- Username immutable after creation
- Password reset generates temporary password, forces change on login

**Acceptance Criteria:**
- [ ] Edit button opens pre-filled form
- [ ] Can update name, email, role, active status
- [ ] Username immutable for security
- [ ] Validation prevents invalid data
- [ ] Cannot edit own role
- [ ] Changes save successfully

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

### 9. Indonesian Language Support (i18n)

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

### 12. Barcode Product Scanning

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

### 13. Testing Suite Implementation

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

### Week 1: Critical Fixes
- [ ] Update all currency formatting to IDR
- [ ] Replace seed data with Indonesian menu
- [ ] Create contact submissions admin page
- [ ] Fix tax rate to 11%
- [ ] Test all currency displays
- [ ] Verify menu data loads correctly

### Week 2: High Priority
- [ ] Implement inventory management (backend + frontend)
- [ ] Complete system settings UI
- [ ] Add user edit functionality
- [ ] Activate notification generation
- [ ] Test inventory tracking
- [ ] Verify notifications work

### Week 3: Medium Priority
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