# Image URL Update Procedure (T096)
**Last Updated**: 2025-12-26
**Status**: Pending Photography Completion

---

## Overview

This document outlines the procedure for updating image URLs in the database seed data after product photography is completed.

---

## Prerequisites

Before updating database seed data, ensure:
1. ✅ Product photography completed (per T094 guidance)
2. ✅ Restaurant photography completed (per T095 guidance)
3. ✅ Images processed and optimized for web
4. ✅ Images uploaded to `/uploads/products/` directory
5. ✅ File naming follows SKU convention

---

## Image Storage Structure

```
/uploads/
├── products/
│   ├── WGY-RNDG.jpg  (Rendang Wagyu)
│   ├── WGY-SATE.jpg  (Sate Wagyu)
│   ├── WGY-GULAI.jpg (Wagyu Gulai)
│   └── ... (other products)
└── restaurant/
    ├── exterior/
    ├── interior/
    └── ambiance/
```

---

## Database Update Procedure

### Step 1: Update Product Images in Seed Data

Edit: `database/init/02_seed_data.sql`

**Current Structure** (example):
```sql
INSERT INTO products (category_id, name, description, price, sku, preparation_time, sort_order) VALUES
((SELECT id FROM categories WHERE name = 'Appetizers'), 'Buffalo Wings', 'Crispy chicken wings', 12.99, 'APP001', 15, 1);
```

**Updated Structure** (add image_url column):
```sql
INSERT INTO products (category_id, name, description, description_id, price, sku, image_url, preparation_time, sort_order) VALUES
((SELECT id FROM categories WHERE name = 'Signature Wagyu'), 'Rendang Wagyu', 'Premium wagyu sirloin with Padang rendang spices', 'Wagyu sirloin premium dengan bumbu rendang khas Padang', 275000, 'WGY-RNDG', '/uploads/products/WGY-RNDG.jpg', 25, 1);
```

### Step 2: Verify Image URLs

After updating seed data:

```bash
# Reset database to test new seed data
make db-reset

# Verify images are accessible
curl http://localhost:8080/uploads/products/WGY-RNDG.jpg

# Check via frontend
open http://localhost:3000/menu
```

### Step 3: Add Image Alt Text

For accessibility, add alt text in frontend components:

```typescript
// frontend/src/components/admin/AdminMenuManagement.tsx
<img
  src={product.image_url}
  alt={`${product.name} - ${product.description_id}`}
  className="w-full h-48 object-cover"
/>
```

---

## Image URL Format

**Format**: `/uploads/{category}/{SKU}.jpg`

**Examples**:
- Product Images: `/uploads/products/WGY-RNDG.jpg`
- Restaurant Images: `/uploads/restaurant/exterior/facade.jpg`
- Category Icons: `/uploads/icons/category-wagyu.svg`

---

## Placeholder Images

Until actual photos are ready, use placeholder URLs:

**Option 1**: Local placeholders
```
/uploads/placeholder/product-placeholder.jpg
```

**Option 2**: External service (development only)
```
https://via.placeholder.com/400x400/d97706/ffffff?text=Rendang+Wagyu
```

**Option 3**: Default image
```
/uploads/default-product.jpg
```

---

## Image Optimization Checklist

Before deploying to production:

- [ ] All images compressed (use ImageOptim or TinyPNG)
- [ ] WebP format support (with JPEG fallback)
- [ ] Responsive images (multiple sizes for different devices)
- [ ] Lazy loading implemented
- [ ] CDN integration (optional)
- [ ] Cache headers configured

---

## Database Migration Script

When images are ready, create a migration:

```bash
# Create migration file
touch database/migrations/003_add_product_images.sql
```

```sql
-- database/migrations/003_add_product_images.sql
-- Add image_url column to products table

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_id TEXT;

-- Update existing products with image URLs
UPDATE products SET image_url = '/uploads/products/WGY-RNDG.jpg' WHERE sku = 'WGY-RNDG';
UPDATE products SET image_url = '/uploads/products/WGY-SATE.jpg' WHERE sku = 'WGY-SATE';
-- ... (continue for all products)

-- Add index for faster image lookups
CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url);
```

---

## Implementation Timeline

**Phase 1**: Use Placeholder Images (Current)
- Deploy with placeholder URLs
- System functional without actual photos

**Phase 2**: Photography Session (Week 1-2)
- Complete product photography per T094
- Complete restaurant photography per T095

**Phase 3**: Image Processing (Week 2)
- Optimize and resize images
- Upload to server /uploads/ directory

**Phase 4**: Database Update (Week 3)
- Run migration to add image URLs
- Update seed data
- Test on staging environment

**Phase 5**: Production Deployment (Week 3)
- Deploy updated database
- Verify all images loading correctly
- Monitor performance

---

## Testing Checklist

After updating image URLs:

- [ ] All menu items show correct images
- [ ] Images load on slow connections (< 3 seconds)
- [ ] Images display correctly on mobile devices
- [ ] Broken image handling works (fallback to placeholder)
- [ ] Image lazy loading works
- [ ] SEO: Alt text is present and descriptive
- [ ] Accessibility: Images have proper ARIA labels

---

## Rollback Plan

If images cause issues:

```sql
-- Remove image URLs
UPDATE products SET image_url = NULL;

-- Revert to placeholder
UPDATE products SET image_url = '/uploads/placeholder/product-placeholder.jpg';
```

---

## Contact for Image Updates

**Database Team**: tech@steakkenangan.com
**Marketing Team** (image approval): marketing@steakkenangan.com
**DevOps** (server upload): devops@steakkenangan.com

---

**Status**: 📋 Documentation Complete
**Next Action**: Await photography completion, then implement updates
**Dependency**: T094 (Product Images) and T095 (Restaurant Photos) must be completed first
