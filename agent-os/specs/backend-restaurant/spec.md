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