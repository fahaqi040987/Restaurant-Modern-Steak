# Franchise Dynamic Content Management

**Date:** 2026-05-27
**Status:** Approved

## Problem

All franchise page content (Vision & Mission, Package Menu, Investment Plans & Pricing) is hardcoded in i18n translation JSON files (`id-ID.json`, `en-US.json`). Any content change requires a code deployment. The admin needs to update this content dynamically from the admin panel.

## Scope

Three content sections on the franchise landing pages:
1. **Vision & Mission** — mission text + dynamic vision point list
2. **Package Menu** — CRUD franchise packages (name, description, highlights per package)
3. **Investment Plans & Pricing** — price range per package, ROI estimate, benefits list

All content must support **Indonesian + English** input from admin panel.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Single `franchise_content` table with JSONB | Follows existing `system_settings` pattern. Simple schema, flexible structure. Only 3 sections with ~20 fields total. |
| Admin UI | 1 page with 3 tabs | All franchise content in one place. Less navigation overhead. |
| Packages | Dynamic CRUD | Admin can add, edit, delete, reorder packages. Not fixed to 3. |
| i18n | Bilingual fields in JSONB (`{id: "...", en: "..."}`) | Consistent with existing i18n system. Frontend picks field by active locale. |
| Fallback | Existing translation JSON when API data is empty | Backward compatible. No broken pages if database is empty. |

## Database

### Migration: `012_create_franchise_content.sql`

```sql
CREATE TABLE franchise_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section VARCHAR(50) NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_franchise_content_section ON franchise_content(section);

-- Seed with current hardcoded data
INSERT INTO franchise_content (section, content) VALUES
('vision_mission', '{
  "mission": {
    "id": "Menjadi destinasi utama pilihan masyarakat Indonesia untuk menikmati pengalaman bersantap steak berkualitas premium dengan rasa yang lezat, harga yang ramah dan suasana tempat yang nyaman serta modern.",
    "en": "To become the primary destination for Indonesians to enjoy premium quality steak dining with delicious taste, friendly prices, and a comfortable modern atmosphere."
  },
  "visions": [
    {
      "id": "Menyajikan Steak berkualitas tinggi yang diolah dengan bahan baku pilihan serta dengan rasa berkelas dan harga terjangkau.",
      "en": "Serve high-quality steak prepared with premium ingredients, exceptional taste, and affordable prices."
    },
    {
      "id": "Menghadirkan kemudahan akses pada tempat steak kenangan, selalu hadir disekitaran tempat tinggal masyarakat.",
      "en": "Provide easy access to Steak Kenangan locations, always present around residential areas."
    },
    {
      "id": "Menciptakan suasana yang nyaman dan modern, dengan menyediakan tempat yang didesain secara yang estetik dan menarik.",
      "en": "Create a comfortable and modern atmosphere with aesthetically designed spaces."
    }
  ]
}'),
('packages', '{
  "packages": [
    {
      "slug": "starter",
      "name": {
        "id": "Paket Starter",
        "en": "Starter Package"
      },
      "description": {
        "id": "Ideal untuk memulai bisnis restoran steak pertama Anda dengan dukungan penuh dari tim kami.",
        "en": "Ideal for starting your first steak restaurant business with full support from our team."
      },
      "highlights": {
        "id": "10 menu unggulan, pelatihan staff, desain interior standar",
        "en": "10 signature menus, staff training, standard interior design"
      },
      "priceRange": {
        "id": "Rp 500 Juta - Rp 750 Juta",
        "en": "IDR 500M - IDR 750M"
      },
      "isFeatured": false,
      "sortOrder": 0,
      "isActive": true
    },
    {
      "slug": "premium",
      "name": {
        "id": "Paket Premium",
        "en": "Premium Package"
      },
      "description": {
        "id": "Pengalaman franchise lengkap dengan branding premium dan dukungan operasional menyeluruh.",
        "en": "Complete franchise experience with premium branding and comprehensive operational support."
      },
      "highlights": {
        "id": "20 menu lengkap, pelatihan intensif, desain interior premium, marketing support",
        "en": "20 complete menus, intensive training, premium interior design, marketing support"
      },
      "priceRange": {
        "id": "Rp 750 Juta - Rp 1.2 Miliar",
        "en": "IDR 750M - IDR 1.2B"
      },
      "isFeatured": true,
      "sortOrder": 1,
      "isActive": true
    },
    {
      "slug": "signature",
      "name": {
        "id": "Paket Signature",
        "en": "Signature Package"
      },
      "description": {
        "id": "Pengalaman eksklusif untuk mitra pilihan dengan hak istimewa dan dukungan penuh waktu.",
        "en": "Exclusive experience for selected partners with privileges and full-time support."
      },
      "highlights": {
        "id": "Full menu, chef dedicated, desain custom, marketing premium, priority support",
        "en": "Full menu, dedicated chef, custom design, premium marketing, priority support"
      },
      "priceRange": {
        "id": "Rp 1.2 Miliar - Rp 2 Miliar",
        "en": "IDR 1.2B - IDR 2B"
      },
      "isFeatured": false,
      "sortOrder": 2,
      "isActive": true
    }
  ]
}'),
('investment', '{
  "title": {
    "id": "Investasi & Keuntungan",
    "en": "Investment & Benefits"
  },
  "subtitle": {
    "id": "Lihat mengapa bergabung dengan Steak Kenangan adalah keputusan bisnis yang cerdas.",
    "en": "See why joining Steak Kenangan is a smart business decision."
  },
  "roiEstimate": {
    "id": "18-24 Bulan",
    "en": "18-24 Months"
  },
  "benefits": [
    {
      "id": "Brand recognition yang sudah terbukti",
      "en": "Proven brand recognition",
      "icon": "shield"
    },
    {
      "id": "Pelatihan operasional & manajemen",
      "en": "Operational & management training",
      "icon": "award"
    },
    {
      "id": "Sistem supply chain terintegrasi",
      "en": "Integrated supply chain system",
      "icon": "truck"
    },
    {
      "id": "Dukungan marketing & promosi",
      "en": "Marketing & promotion support",
      "icon": "megaphone"
    },
    {
      "id": "Sistem POS & teknologi modern",
      "en": "Modern POS system & technology",
      "icon": "trending-up"
    },
    {
      "id": "Tim support dedicated 24/7",
      "en": "Dedicated 24/7 support team",
      "icon": "headphones"
    }
  ]
}');
```

### Drizzle Schema Addition

Add to `backend/src/db/schema.ts`:

```typescript
export const franchiseContent = pgTable(
  'franchise_content',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    section: varchar('section', { length: 50 }).unique().notNull(),
    content: jsonb('content').notNull().default({}),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    sectionIdx: index('idx_franchise_content_section').on(table.section),
  }),
);
```

## API

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/franchise/content` | None | Get all sections |
| GET | `/api/franchise/content/:section` | None | Get one section |
| PUT | `/api/franchise/content/:section` | Admin | Update one section |

### Handler: `backend/src/handlers/franchise-content.ts`

**GET all:**
- Query all 3 rows from `franchise_content`
- Return `{ vision_mission: <content>, packages: <content>, investment: <content> }`
- If a section row doesn't exist, return `null` for that section

**GET by section:**
- Query single row by `section` param
- Validate `section` is one of: `vision_mission`, `packages`, `investment`
- Return the content JSONB directly

**PUT by section:**
- Require admin auth
- Validate `section` param
- Validate request body with Zod schema per section
- Upsert (INSERT ON CONFLICT UPDATE) the row
- Return updated content

### Zod Validation Schemas

```typescript
const bilingualField = z.object({ id: z.string().min(1), en: z.string().min(1) });

const visionMissionSchema = z.object({
  mission: bilingualField,
  visions: z.array(bilingualField).min(1),
});

const packageSchema = z.object({
  slug: z.string().min(1).max(50),
  name: bilingualField,
  description: bilingualField,
  highlights: bilingualField,
  priceRange: bilingualField,
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

const packagesSchema = z.object({
  packages: z.array(packageSchema).min(1),
});

const investmentSchema = z.object({
  title: bilingualField,
  subtitle: bilingualField,
  roiEstimate: bilingualField,
  benefits: z.array(z.object({
    id: z.string().min(1),
    en: z.string().min(1),
    icon: z.string().min(1),
  })).min(1),
});
```

## Frontend — Public Pages

### Strategy

Each franchise component will:
1. Use TanStack Query to fetch content from `GET /api/franchise/content`
2. Select the `id` or `en` field from content based on active locale from `react-i18next`
3. Fallback to existing translation JSON keys if API returns no data

### Files Modified

**`frontend/src/components/franchise/VisionMission.tsx`**
- Add `useQuery` for franchise content
- Read `mission.id/en` and `visions[].id/en` based on locale
- Fallback to `t('franchise.visionMission.*')` if no API data

**`frontend/src/components/franchise/FranchiseMenuSection.tsx`**
- Add `useQuery` for franchise content
- Read packages array from API response
- Map each package to card: name, description, highlights (split by comma), priceRange
- Fallback to `t('franchise.menu.*')` if no API data

**`frontend/src/components/franchise/InvestmentInfo.tsx`**
- Add `useQuery` for franchise content
- Read investment data: title, subtitle, roiEstimate, benefits
- Fallback to `t('franchise.investment.*')` if no API data

### Helper Hook

Create `frontend/src/hooks/useFranchiseContent.ts`:

```typescript
function useFranchiseContent(section?: string) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'id-ID' ? 'id' : 'en';

  const query = useQuery({
    queryKey: ['franchise-content', section],
    queryFn: () => fetchFranchiseContent(section),
  });

  return { ...query, locale };
}
```

## Frontend — Admin Panel

### Route

`/admin/franchise-content` — single page with 3 tabs.

### Layout

```
┌─────────────────────────────────────────────────┐
│ Franchise Content Management                     │
├─────────────────────────────────────────────────┤
│ [Visi & Misi] [Paket Franchise] [Investasi]     │
├─────────────────────────────────────────────────┤
│                                                  │
│  (Tab content here)                              │
│                                                  │
├─────────────────────────────────────────────────┤
│                                    [Simpan]      │
└─────────────────────────────────────────────────┘
```

### Tab 1: Visi & Misi

- **Misi**: Two textareas side by side (ID | EN)
- **Visi Points**: Dynamic list
  - Each item: two text inputs side by side (ID | EN)
  - Buttons: Add point, Remove point, Drag to reorder
  - Numbering auto-generated (01, 02, 03, ...)

### Tab 2: Paket Franchise

- Card-based list of packages
- Each card has:
  - Slug (auto-generated from name or editable)
  - Name: two inputs (ID | EN)
  - Description: two textareas (ID | EN)
  - Highlights: two textareas (ID | EN) — comma-separated
  - Price Range: two inputs (ID | EN)
  - Toggle: Featured (badge)
  - Toggle: Active (show/hide on public page)
  - Sort order: drag handle or number input
  - Delete button (with confirmation)
- "Add Package" button at bottom

### Tab 3: Investasi

- Title: two inputs (ID | EN)
- Subtitle: two inputs (ID | EN)
- ROI Estimate: two inputs (ID | EN)
- Benefits: Dynamic list
  - Each item: two text inputs (ID | EN) + icon dropdown (shield, award, truck, megaphone, trending-up, headphones)
  - Add/Remove buttons
  - Drag to reorder

### Admin API Calls

Each tab independently saves via `PUT /api/franchise/content/:section`.
Uses TanStack `useMutation` with optimistic updates.

### Files to Create

- `frontend/src/routes/admin/franchise-content.tsx` — admin page route
- `frontend/src/components/admin/franchise-content/VisionMissionTab.tsx`
- `frontend/src/components/admin/franchise-content/PackagesTab.tsx`
- `frontend/src/components/admin/franchise-content/InvestmentTab.tsx`
- `frontend/src/components/admin/franchise-content/BilingualInput.tsx` — reusable ID/EN input pair
- `frontend/src/hooks/useFranchiseContent.ts` — shared data fetching hook

### Files to Modify

- `frontend/src/routes/admin/index.tsx` — add sidebar link "Franchise Content"
- `frontend/src/components/franchise/VisionMission.tsx` — use API data
- `frontend/src/components/franchise/FranchiseMenuSection.tsx` — use API data
- `frontend/src/components/franchise/InvestmentInfo.tsx` — use API data

## Implementation Order

1. Database migration (`012_create_franchise_content.sql`)
2. Drizzle schema update (`schema.ts`)
3. Backend handler (`franchise-content.ts`)
4. Backend routes registration
5. Frontend shared hook (`useFranchiseContent.ts`)
6. Frontend admin components (tabs)
7. Frontend admin route + sidebar
8. Frontend public components update (3 files)
9. Seed data verification
