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

**Navigation & Layout**
- Sticky header with: Logo (links to homepage), Home, Menu, About, Contact links
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