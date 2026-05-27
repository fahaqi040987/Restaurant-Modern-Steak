# Franchise Page Design Spec

**Date:** 2026-05-24
**Status:** Approved
**Phase:** Phase 1 (Frontend-First)
**Approach:** Frontend with hardcoded content first; backend API + admin management deferred to Phase 2

## Overview

Add a Franchise section to the public B2C website with 5 pages, a dedicated navigation bar, i18n support (ID/EN), and light/dark theme compatibility. Content is hardcoded initially; dynamic management via admin dashboard will be built in Phase 2.

## Requirements

- 5 franchise pages accessible under `/site/franchise/*`
- Dedicated FranchiseNavbar that replaces the main site header within franchise routes
- "Franchise" link added to the main public Header after "Contact"
- Full i18n support (Indonesian and English)
- Light and dark theme support via existing CSS variable system
- Responsive design (mobile-friendly)
- Application form with client-side validation (no backend submission in Phase 1)

## Routing

| # | Route | File | Description |
|---|-------|------|-------------|
| 1 | `/site/franchise` | `routes/site/franchise/index.tsx` | Hero landing page |
| 2 | `/site/franchise/atmosphere` | `routes/site/franchise/atmosphere.tsx` | Outlet gallery (indoor/outdoor, day/night) |
| 3 | `/site/franchise/menu` | `routes/site/franchise/menu.tsx` | Franchise menu packages |
| 4 | `/site/franchise/investment` | `routes/site/franchise/investment.tsx` | Investment info (costs, ROI, benefits) |
| 5 | `/site/franchise/apply` | `routes/site/franchise/apply.tsx` | Franchise application form |

## Franchise Navigation

When users are on any `/site/franchise/*` route, the main site header is replaced with a dedicated FranchiseNavbar.

### Layout

```
[Logo STEAK KENANGAN]     [GERAI] [MENU] [PLAN]     [DAFTAR SEKARANG]
```

### Nav Items

| Item | Route | Behavior |
|------|-------|----------|
| Logo | `/site` | Returns to main website home |
| GERAI | `/site/franchise/atmosphere` | Outlet gallery |
| MENU | `/site/franchise/menu` | Franchise packages |
| PLAN | `/site/franchise/investment` | Investment info |
| DAFTAR SEKARANG | `/site/franchise/apply` | CTA button, orange accent |

### Behavior

- Sticky fixed position at top
- Active state highlights current page's nav item
- Mobile: collapses to hamburger menu
- Small "Kembali ke website" element to navigate back to main site
- Clicking logo returns to main website (header switches back)

## Page Designs

### Page 1: Hero Landing (`/site/franchise`)

**Source:** `hero_view/screen.png`

- Full-viewport hero section with dark background + gradient overlay
- Large headline in Playfair Display with key words highlighted in accent color
- Sub-headline describing the franchise experience
- CTA button: "Lihat Paket Franchise" linking to `/site/franchise/menu`
- Scroll indicator at bottom

### Page 2: Atmosphere Gallery (`/site/franchise/atmosphere`)

**Source:** `atmosphere_view_updated_nav/screen.png`

- Section headline about outlet ambiance
- 2x2 image grid with overlay labels:
  - Foto Outlet Siang (Daytime Outlet Photo)
  - Foto Area Indoor (Indoor Area Photo)
  - Foto Outlet Malam (Nighttime Outlet Photo)
  - Foto Area Outdoor (Outdoor Area Photo)
- Placeholder images initially; will be dynamic in Phase 2
- Mobile: single column layout

### Page 3: Menu/Paket (`/site/franchise/menu`)

**Source:** `menu_view/screen.png`

- List of franchise packages in card/list format
- Each package shows: name, short description, menu highlights
- Classic menu style: Playfair Display for names, dotted line separators
- Prices or package tiers displayed clearly

### Page 4: Investment (`/site/franchise/investment`)

**Source:** `investment_view/screen.png`

- Investment breakdown in structured layout
- Key data: initial capital, estimated ROI, partnership benefits
- Card-based or comparison table format
- Clear visual hierarchy with accent-colored highlights on key numbers

### Page 5: Application Form (`/site/franchise/apply`)

**Source:** `application_view/screen.png`

- Registration form with fields:
  - Nama lengkap (Full name)
  - Email
  - Nomor telepon (Phone number)
  - Lokasi pilihan (Preferred location)
  - Pesan (Message)
- Client-side validation via React Hook Form + Zod
- Submit shows success message (no backend in Phase 1)
- Dark-themed form inputs matching the franchise aesthetic

## Styling

### Design System

Based on `nocturnal_elegance` design system, adapted to existing CSS variables:

- **Primary accent:** `var(--public-accent)` (Flame Orange in dark mode)
- **Background:** `var(--public-primary)` (Charcoal in dark mode)
- **Text:** `var(--public-text-primary)` and `var(--public-text-secondary)`
- **Borders:** `var(--public-border)`
- **Fonts:** `var(--font-heading)` (Playfair Display), `var(--font-accent)` (Pacifico), Inter for body

### Layout Constants

- Container max-width: 1200px (`.public-container`)
- Section vertical gap: 120px
- Mobile side margins: 16px
- Card border-radius: 8px
- Button border-radius: 4px

### Responsive Breakpoints

- Desktop: multi-column grids, full navbar
- Mobile: single column, hamburger menu, stacked cards

## File Structure

### New Files

```
frontend/src/
  routes/site/franchise/
    index.tsx                      # Hero landing page
    atmosphere.tsx                 # Outlet gallery
    menu.tsx                       # Franchise menu packages
    investment.tsx                 # Investment info
    apply.tsx                      # Application form
  components/franchise/
    FranchiseNavbar.tsx            # Dedicated franchise navigation
    FranchiseLayout.tsx            # Layout wrapper for franchise pages
    HeroSection.tsx                # Hero section component
    AtmosphereGallery.tsx          # Gallery grid component
    FranchiseMenuSection.tsx       # Menu packages component
    InvestmentInfo.tsx             # Investment info component
    ApplicationForm.tsx            # Application form component
```

### Modified Files

```
frontend/src/components/public/Header.tsx   # Add "Franchise" nav link after "Contact"
frontend/src/routes/__root.tsx              # Ensure franchise routes are covered
frontend/src/i18n/locales/id.json           # Add Indonesian franchise translation keys
frontend/src/i18n/locales/en.json           # Add English franchise translation keys
```

## i18n Keys

All franchise text will use translation keys under the `franchise` namespace:

```
franchise.nav.gerai
franchise.nav.menu
franchise.nav.plan
franchise.nav.register
franchise.hero.title
franchise.hero.subtitle
franchise.hero.cta
franchise.atmosphere.title
franchise.atmosphere.outletDay
franchise.atmosphere.indoor
franchise.atmosphere.outletNight
franchise.atmosphere.outdoor
franchise.menu.title
franchise.investment.title
franchise.apply.title
franchise.apply.name
franchise.apply.email
franchise.apply.phone
franchise.apply.location
franchise.apply.message
franchise.apply.submit
franchise.apply.success
```

## Phase 2 Scope (Deferred)

- Backend API endpoints for franchise content CRUD
- Admin dashboard UI for managing franchise page content
- Application form submissions stored in database
- Image upload for outlet gallery photos
- Email notifications on form submission

## Design References

- `stitch_industrial_premium_direction_prd 3/hero_view/screen.png`
- `stitch_industrial_premium_direction_prd 3/atmosphere_view_updated_nav/screen.png`
- `stitch_industrial_premium_direction_prd 3/menu_view/screen.png`
- `stitch_industrial_premium_direction_prd 3/investment_view/screen.png`
- `stitch_industrial_premium_direction_prd 3/application_view/screen.png`
- `stitch_industrial_premium_direction_prd 3/nocturnal_elegance/DESIGN.md`
