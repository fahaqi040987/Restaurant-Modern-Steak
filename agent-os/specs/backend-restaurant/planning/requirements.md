# Requirements Specification: B2C Restaurant Website

## Document Information
- **Feature:** Public Restaurant Website (B2C)
- **Version:** 1.0.0
- **Created:** December 2024
- **Status:** Planning

---

## 1. Overview

### 1.1 Purpose
Create a public-facing B2C restaurant website that showcases the restaurant brand, provides essential information to customers, and serves as a gateway to the internal staff portal (POS system).

### 1.2 Goals
- **Brand Presence:** Establish a professional online presence for the restaurant
- **Customer Information:** Provide essential details (hours, location, contact)
- **Staff Access:** Seamless login portal for staff to access POS system
- **Mobile-First:** Responsive design optimized for mobile visitors

### 1.3 Success Metrics
- Page load time: < 3 seconds
- Mobile-friendly score: > 90 (Google Lighthouse)
- SEO score: > 85
- Bounce rate: < 40%

---

## 2. Target Users

### 2.1 Primary Users

#### 2.1.1 Potential Customers (B2C)
- **Goal:** Find restaurant information, menu preview, location
- **Needs:** Quick access to hours, address, contact info
- **Behavior:** Often on mobile, searching for nearby dining options

#### 2.1.2 Existing Customers
- **Goal:** Check hours, make reservations, view menu
- **Needs:** Easy access to essential info, updates on specials
- **Behavior:** Return visitors, may bookmark the site

#### 2.1.3 Restaurant Staff
- **Goal:** Access staff portal (POS system)
- **Needs:** Quick login to dashboard
- **Behavior:** Desktop or tablet at work, quick access needed

---

## 3. Functional Requirements

### 3.1 Public Pages

#### 3.1.1 Landing Page (Homepage)
**Priority:** Critical
**Route:** `/`

**Features:**
- Hero section with restaurant branding and tagline
- Featured dishes showcase (3-4 highlight items)
- Operating hours summary
- Quick action buttons (View Menu, Contact Us, Get Directions)
- Restaurant ambiance gallery (image carousel)
- Brief "About Us" section
- Call-to-action for reservations (if applicable)

**Design Requirements:**
- Full-width hero image with overlay text
- Smooth scroll animations
- Responsive grid for featured items
- Dark/elegant theme matching "Modern Steak" branding

#### 3.1.2 About Us Page
**Priority:** High
**Route:** `/about`

**Features:**
- Restaurant story and history
- Mission and values
- Chef/team introduction (optional)
- Restaurant gallery (interior, food, ambiance)
- Awards and recognition (if any)

#### 3.1.3 Menu Page
**Priority:** Critical
**Route:** `/menu`

**Features:**
- Category-based menu organization (Appetizers, Main Course, Sides, Desserts, Beverages)
- Menu item cards with:
  - Item name
  - Description
  - Price
  - Image (optional)
  - Dietary tags (🌱 Vegetarian, 🌾 Gluten-free, 🌶️ Spicy)
- Filter by category
- Search functionality
- "Chef's Recommendations" highlight section

**Note:** Read-only display from existing product catalog (no ordering)

#### 3.1.4 Location & Contact Page
**Priority:** Critical
**Route:** `/contact`

**Features:**
- **Location Section:**
  - Full address with copy button
  - Embedded Google Maps with pin
  - Get directions button (opens Google Maps/Waze)
  - Nearby landmarks description
  
- **Operating Hours:**
  - Day-by-day hours display
  - Current status indicator (Open Now / Closed)
  - Holiday hours notice (if applicable)
  
- **Contact Information:**
  - Phone number (click-to-call on mobile)
  - Email address (mailto link)
  - WhatsApp button (optional)
  
- **Contact Form:**
  - Name (required)
  - Email (required)
  - Phone (optional)
  - Subject dropdown (Reservation, Feedback, Catering, General Inquiry)
  - Message (required)
  - Submit button with confirmation

#### 3.1.5 Gallery Page (Optional)
**Priority:** Low
**Route:** `/gallery`

**Features:**
- Photo grid with lightbox view
- Categories: Food, Interior, Events
- Lazy loading for performance

### 3.2 Staff Portal Access

#### 3.2.1 Staff Login Page
**Priority:** Critical
**Route:** `/staff` or `/login`

**Features:**
- Clean, branded login form
- Username/Email field
- Password field with show/hide toggle
- "Remember me" checkbox
- Login button
- Forgot password link (future feature)
- Error handling with user-friendly messages
- Redirect to appropriate dashboard based on role:
  - Admin → `/admin/dashboard`
  - Kitchen → `/kitchen`
  - Server → `/admin/server`
  - Counter/Cashier → `/admin/counter`

**Security Requirements:**
- Rate limiting on login attempts
- Session timeout after inactivity
- Secure password handling (existing auth system)

### 3.3 Navigation & Layout

#### 3.3.1 Header/Navbar
**Features:**
- Restaurant logo (links to homepage)
- Navigation links: Home, Menu, About, Contact
- Staff Login button (subtle, top-right)
- Mobile hamburger menu
- Sticky header on scroll

#### 3.3.2 Footer
**Features:**
- Restaurant logo and tagline
- Quick links (Home, Menu, Contact)
- Operating hours summary
- Contact info (phone, email, address)
- Social media links (Instagram, Facebook, etc.)
- Copyright notice
- "Staff Portal" link (small/subtle)

---

## 4. Technical Requirements

### 4.1 Frontend Architecture

#### 4.1.1 Technology Stack
- **Framework:** React with TanStack Router (existing)
- **Styling:** Tailwind CSS (existing)
- **Components:** Shadcn/ui (existing)
- **Build:** Vite (existing)

#### 4.1.2 New Routes Structure
```
/                    → Landing Page (public)
/menu                → Menu Page (public)
/about               → About Us Page (public)
/contact             → Contact Page (public)
/gallery             → Gallery Page (public, optional)
/staff               → Staff Login Page (public, redirects if logged in)
/login               → Alias for /staff
/admin/*             → Staff Portal (protected, existing)
/kitchen             → Kitchen Display (protected, existing)
```

### 4.2 Backend Requirements

#### 4.2.1 New API Endpoints
```
GET  /api/v1/public/menu          → Public menu items (active products only)
GET  /api/v1/public/categories    → Public categories
GET  /api/v1/public/restaurant    → Restaurant info (hours, contact, location)
POST /api/v1/public/contact       → Submit contact form
```

#### 4.2.2 Restaurant Configuration (New)
Database table or config for:
```go
type RestaurantInfo struct {
    Name            string
    Tagline         string
    Description     string
    Address         string
    City            string
    PostalCode      string
    Country         string
    Phone           string
    Email           string
    WhatsApp        string    // optional
    MapLatitude     float64
    MapLongitude    float64
    GoogleMapsURL   string
    
    // Operating Hours
    Hours           []OperatingHours
    
    // Social Media
    Instagram       string
    Facebook        string
    Twitter         string
    
    // Branding
    LogoURL         string
    HeroImageURL    string
    GalleryImages   []string
}

type OperatingHours struct {
    DayOfWeek   int       // 0=Sunday, 6=Saturday
    OpenTime    string    // "09:00"
    CloseTime   string    // "22:00"
    IsClosed    bool
}
```

### 4.3 SEO Requirements
- Meta tags for all pages (title, description, keywords)
- Open Graph tags for social sharing
- Structured data (JSON-LD) for:
  - Restaurant schema
  - Menu schema
  - LocalBusiness schema
- Sitemap.xml generation
- robots.txt configuration

### 4.4 Performance Requirements
- Lighthouse Performance Score: > 90
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Image optimization (WebP, lazy loading)
- Code splitting for routes

---

## 5. UI/UX Design Guidelines

### 5.1 Design Theme
- **Style:** Modern, elegant, sophisticated
- **Colors:** Dark theme with warm accents (matching steak house aesthetic)
  - Primary: Deep charcoal (#1a1a1a)
  - Secondary: Warm gold/amber (#d4a574)
  - Accent: Rich burgundy (#722f37)
  - Text: Cream white (#f5f5dc)
- **Typography:** 
  - Headings: Serif font (Playfair Display)
  - Body: Sans-serif (Inter)
- **Imagery:** High-quality food photography, warm lighting

### 5.2 Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 5.3 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- Color contrast ratios > 4.5:1

---

## 6. Implementation Phases

### Phase 1: Core Public Pages (MVP)
- [ ] Landing page with hero and basic info
- [ ] Menu page (read from existing products)
- [ ] Contact page with map and form
- [ ] Staff login portal integration
- [ ] Responsive navigation

### Phase 2: Enhanced Content
- [ ] About Us page
- [ ] Gallery page
- [ ] Restaurant configuration admin panel
- [ ] SEO optimization

### Phase 3: Advanced Features (Future)
- [ ] Online reservations
- [ ] Email newsletter signup
- [ ] Customer reviews integration
- [ ] Multi-language support

---

## 7. Acceptance Criteria

### 7.1 Landing Page
- [ ] Hero section displays with restaurant branding
- [ ] Operating hours are accurate and update from config
- [ ] "Open Now" status calculates correctly based on current time
- [ ] All CTAs navigate to correct pages
- [ ] Page loads in < 3 seconds on 3G

### 7.2 Menu Page
- [ ] Displays all active products from database
- [ ] Categories filter works correctly
- [ ] Search returns relevant results
- [ ] Images load with lazy loading
- [ ] Prices display in correct currency format

### 7.3 Contact Page
- [ ] Google Maps embed loads and shows correct location
- [ ] Click-to-call works on mobile devices
- [ ] Contact form validates inputs
- [ ] Form submission shows success message
- [ ] Form data is stored/emailed to restaurant

### 7.4 Staff Login
- [ ] Login form validates required fields
- [ ] Successful login redirects to appropriate dashboard
- [ ] Invalid credentials show error message
- [ ] Already logged-in users redirect to dashboard
- [ ] Session persists across page refreshes

---

## 8. Dependencies

### 8.1 External Services
- Google Maps Embed API (for location map)
- Email service (for contact form, e.g., SendGrid, Resend)

### 8.2 Internal Dependencies
- Existing product/category API
- Existing authentication system
- Existing user roles system

---

## 9. Out of Scope (v1.0)

- Online ordering/checkout
- Table reservations with availability
- Customer accounts/loyalty program
- Payment processing on website
- Real-time order tracking
- Mobile app