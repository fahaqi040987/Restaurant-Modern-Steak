# Logistics System Design Spec
**Date:** 2025-05-31  
**Project:** Restaurant Modern Steak - Logistics/Inventory System  
**Status:** Draft

---

## 📋 Executive Summary

Transformasi sistem inventory yang ada (fokus pada stok produk menu) menjadi **Logistics System untuk raw materials (bahan baku)** dengan kemampuan tracking pergerakan stok, stock adjustment, dan auto-deduct via recipe.

**Scope:**
- Raw Material Management (tanpa PO/Supplier resmi)
- Single location
- Direct adjust tanpa approval
- Master data lengkap (kategori, lokasi, supplier info, lead time, barcode)
- Hybrid: Auto-deduct via recipe + Manual adjust

---

## 🎯 Goals

1. **Accurate Raw Material Tracking** - Stok bahan baku selalu up-to-date
2. **Flexible Stock Management** - Manual adjust untuk berbagai kebutuhan
3. **Automated Deduction** - Auto-reduce stok saat order menu yang punya recipe
4. **Complete Audit Trail** - History pergerakan stok dengan alasan lengkap
5. **Easy Reporting** - Low stock alerts, valuation, movement reports

---

## 📦 Database Schema

### Tables

#### 1. `raw_materials` (Master Data Bahan Baku)

```sql
CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),                    -- Barcode/kode internal
    category VARCHAR(50) NOT NULL,      -- Daging, Sayur, Bumbu, dll
    unit VARCHAR(20) NOT NULL,          -- kg, gram, liter, pcs
    storage_location VARCHAR(50),       -- Chiller, Freezer, Dry Storage
    unit_price DECIMAL(15,2),           -- Harga per unit
    default_supplier VARCHAR(255),      -- Nama supplier (tanpa PO)
    lead_time_days INTEGER,             -- Lead time dalam hari
    min_stock DECIMAL(15,2) DEFAULT 0,
    max_stock DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_raw_materials_category` ON `category`
- `idx_raw_materials_active` ON `is_active`
- `idx_raw_materials_code` ON `code` (unique)

---

#### 2. `raw_material_stock` (Stok Saat Ini)

```sql
CREATE TABLE raw_material_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    current_stock DECIMAL(15,2) DEFAULT 0,
    last_restocked_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(raw_material_id)
);
```

**Indexes:**
- `idx_stock_raw_material` ON `raw_material_id`

---

#### 3. `raw_material_movements` (History Pergerakan)

```sql
CREATE TABLE raw_material_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL,     -- 'add', 'remove', 'auto_deduct'
    quantity DECIMAL(15,2) NOT NULL,
    previous_stock DECIMAL(15,2) NOT NULL,
    new_stock DECIMAL(15,2) NOT NULL,
    reason VARCHAR(50) NOT NULL,        -- purchase, spoilage, damage, expired, theft, 
                                       -- manual_adjustment, stock_opname, recipe_usage
    notes TEXT,
    reference_id UUID,                  -- Untuk recipe: order_id / product_id
    adjusted_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_movements_raw_material` ON `raw_material_id`
- `idx_movements_created_at` ON `created_at DESC`
- `idx_movements_operation` ON `operation`

---

#### 4. `recipes` (Recipe Produk Menu)

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_recipes_product` ON `product_id`
- `idx_recipes_active` ON `is_active`

---

#### 5. `recipe_items` (Detail Bahan Baku per Recipe)

```sql
CREATE TABLE recipe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    quantity DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(recipe_id, raw_material_id)
);
```

**Indexes:**
- `idx_recipe_items_recipe` ON `recipe_id`
- `idx_recipe_items_raw_material` ON `raw_material_id`

---

### Enum Values

**Categories:** `Daging`, `Seafood`, `Sayur`, `Buah`, `Bumbu`, `Bahan Kering`, `Minuman`, `Dairy`, `Minyak`, `Lainnya`

**Storage Locations:** `Chiller`, `Freezer`, `Dry Storage`, `Rack`, `Bar`, `Lainnya`

**Units:** `kg`, `gram`, `liter`, `ml`, `pcs`, `pack`, `buah`, `ikat`, `ons`, `pon`

**Movement Reasons:** `purchase`, `spoilage`, `damage`, `expired`, `theft`, `stock_opname`, `manual_adjustment`, `recipe_usage`

---

## 🔌 API Endpoints

Base Path: `/admin/logistics`

### Raw Materials CRUD

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/raw-materials` | GET | List all raw materials with current stock |
| `/raw-materials/:id` | GET | Get single raw material detail |
| `/raw-materials` | POST | Create new raw material |
| `/raw-materials/:id` | PUT | Update raw material |
| `/raw-materials/:id` | DELETE | Soft delete (set is_active=false) |

**Response Shape (List):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Daging Wagyu A5",
      "code": "DW-A5",
      "category": "Daging",
      "unit": "kg",
      "storage_location": "Chiller",
      "unit_price": 2500000,
      "default_supplier": "Meat Supplier Indo",
      "lead_time_days": 3,
      "current_stock": 15.5,
      "min_stock": 10,
      "max_stock": 50,
      "status": "ok",
      "last_restocked": "2025-06-15T10:00:00Z"
    }
  ]
}
```

---

### Stock Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/raw-materials/:id/adjust` | POST | Manual adjust stock (add/remove) |
| `/raw-materials/:id/movements` | GET | Get movement history |
| `/low-stock` | GET | Get items below min_stock |

**POST /raw-materials/:id/adjust Request:**
```json
{
  "operation": "add",
  "quantity": 5.5,
  "reason": "purchase",
  "notes": "Penerimaan dari supplier"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "previous_stock": 10,
    "new_stock": 15.5
  }
}
```

---

### Recipes Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recipes` | GET | List all recipes |
| `/recipes/:product-id` | GET | Get recipe for specific product |
| `/recipes` | POST | Create new recipe |
| `/recipes/:id` | PUT | Update recipe |
| `/recipes/:id` | DELETE | Delete recipe |

**GET /recipes/:product-id Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "product_id": "uuid",
    "product_name": "Steak Wagyu Premium",
    "items": [
      {
        "raw_material_id": "uuid",
        "raw_material_name": "Daging Wagyu A5",
        "quantity": 0.2,
        "unit": "kg"
      }
    ]
  }
}
```

---

### Auto-Deduct (Internal)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auto-deduct` | POST | Auto deduct stock based on recipes (called by order system) |

**POST /auto-deduct Request:**
```json
{
  "order_items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ]
}
```

---

## 🎨 UI Components

### Page Structure

```
/admin/logistics
├── LogisticsPage (Main)
│   ├── StatsCards
│   ├── FilterBar
│   ├── RawMaterialsTable
│   ├── AdjustStockDialog
│   ├── MovementHistoryDialog
│   └── CreateEditRawMaterialDialog
└── RecipesPage (Separate or tab)
    ├── RecipesTable
    └── RecipeDetailDialog
```

---

### Key Screens

**1. Main Logistics Page**
- Header with title + Export button
- Stats cards: Total items, Low stock, Out of stock, Total value
- Filter: Search, Category, Location, Status
- Table: Name, Category, Unit, Stock, Min/Max, Location, Status, Actions
- Actions per row: Adjust, History, Edit

**2. Adjust Stock Dialog**
- Operation toggle: Add / Remove
- Quantity input
- Reason dropdown (enum values)
- Notes textarea (optional)
- Preview: "New stock will be: X kg"

**3. Movement History Dialog**
- List of movements with:
  - Operation icon (➕/➖)
  - Quantity with reason badge
  - Stock change (prev → new)
  - Notes if any
  - Timestamp
  - User who adjusted

**4. Recipes Page**
- Table: Product, Items count, Status, Actions
- Edit dialog: Product info, Recipe items list (with remove button), Add item form

---

### Navigation Update

```
Menu: "Inventory" → "Logistics"
├── Raw Materials
└── Recipes
```

---

## ⚠️ Error Handling

### Business Logic Errors

| Error | HTTP Code | Message |
|-------|-----------|---------|
| Invalid quantity (≤0) | 400 | Quantity must be greater than 0 |
| Insufficient stock | 400 | Insufficient stock for removal |
| Invalid category | 400 | Invalid category. Valid: Daging, Sayur, ... |
| Invalid unit | 400 | Invalid unit. Valid: kg, gram, ... |
| Not found | 404 | Raw material not found |
| Duplicate code | 409 | Raw material with this code already exists |
| Auto-deduct insufficient | 400 | Insufficient stock for raw material: {name} |

---

### Validation Rules

**Raw Material:**
- Name: Required, max 255 chars
- Code: Optional, max 50 chars, unique
- Category: Required, enum
- Unit: Required, enum
- Storage Location: Optional, enum
- Unit Price: Optional, ≥ 0
- Lead Time: Optional, ≥ 0
- Min/Max Stock: Optional, max ≥ min

**Stock Adjust:**
- Operation: Required, `add` or `remove`
- Quantity: Required, > 0
- Reason: Required, enum

**Recipe:**
- Product ID: Required, must exist
- Items: Optional array
  - Raw Material ID: Required, must exist
  - Quantity: Required, > 0

---

## 🧪 Testing Strategy

### Backend Unit Tests

```typescript
// Test coverage targets:
- Raw Materials CRUD: 90%+
- Stock Adjust: 95%+ (critical business logic)
- Recipes: 85%+
- Auto-deduct: 95%+ (critical integration)
```

**Test Files:**
- `raw-materials.test.ts`
- `stock-adjust.test.ts`
- `recipes.test.ts`
- `auto-deduct.test.ts`

### Frontend E2E Tests

```typescript
// Playwright E2E tests:
- Raw Materials: Create, Edit, Delete, Adjust, Filter, Search
- Movement History: View, Verify data
- Recipes: Create, Edit, Delete, Add/Remove items
- Low Stock: Verify alerts and stats
```

---

## 📝 Migration Plan

### Database

1. Create 5 new tables (raw_materials, raw_material_stock, raw_material_movements, recipes, recipe_items)
2. Rename old tables to `_legacy_inventory` and `_legacy_inventory_history`
3. Create indexes

### Backend

1. Add new handlers: `raw-materials.ts`, `recipes.ts`
2. Update admin router with new routes
3. Keep legacy handlers for reference (can be removed)

### Frontend

1. Rename route: `/admin/inventory` → `/admin/logistics`
2. Replace `InventoryManagement` component
3. Add new components for logistics
4. Update navigation menu
5. Update i18n translations

---

## 🔧 Implementation Phases

### Phase 1: Database & Backend Core (Day 1-2)
- Create tables and indexes
- Implement raw materials CRUD
- Implement stock adjust
- Implement movement history
- Write unit tests

### Phase 2: Recipes & Auto-Deduct (Day 3)
- Implement recipes CRUD
- Implement auto-deduct logic
- Integrate with order system
- Write unit tests

### Phase 3: Frontend Core (Day 4-5)
- Build LogisticsPage
- Build dialogs (Adjust, History, Create/Edit)
- Connect to API
- Write E2E tests

### Phase 4: Recipes UI & Polish (Day 6)
- Build RecipesPage
- Build recipe detail/edit dialog
- Polish and refinement
- Final testing

---

## 📚 Success Criteria

1. ✅ Raw materials can be created, edited, and deleted
2. ✅ Stock can be manually adjusted with valid reasons
3. ✅ Movement history is accurate and complete
4. ✅ Recipes can be created for products
5. ✅ Auto-deduct reduces stock correctly when orders are placed
6. ✅ Low stock alerts work correctly
7. ✅ All unit tests pass (90%+ coverage)
8. ✅ All E2E tests pass

---

## 🚀 Future Enhancements (Out of Scope)

- Purchase Order system ke supplier
- Supplier management dengan rating
- Multi-location transfer
- Forecasting dan demand planning
- Cost analysis dan food cost percentage
- Integration dengan accounting system
- Barcode scanner integration
- Mobile app untuk staf gudang

---

**Document Status:** ✅ Ready for implementation planning

**Next Steps:**
1. User reviews and approves this spec
2. Create detailed implementation plan with writing-plans skill
3. Execute implementation plan
