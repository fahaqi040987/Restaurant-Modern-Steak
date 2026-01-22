## Fix TypeScript Type Issues in Frontend API Client

### Issues Identified

#### 1. **Incorrect Return Types in API Client**
**Location**: `frontend/src/api/client.ts`

**Problem**: 
- `getAdminProducts()` returns `APIResponse<Product[]>` but should return `PaginatedResponse<Product[]>`
- `getAdminCategories()` returns `APIResponse<Category[]>` but should return `PaginatedResponse<Category[]>`
- This forces components to use `(response as any)?.meta` to access pagination metadata

**Impact**:
- Components like `AdminMenuManagement.tsx` use `as any` type assertions
- ESLint warns about "Unexpected any"
- Type safety is compromised

#### 2. **Missing Type Properties**
**Problem**: Components are trying to access `.meta` property which doesn't exist on `APIResponse<T>`

**Current Code** (AdminMenuManagement.tsx):
```typescript
const products = (productsResponse as any)?.data || []
const productsPaginationInfo = (productsResponse as any)?.meta || { total: 0, ... }
```

**Should be**:
```typescript
const products = productsResponse?.data || []
const productsPaginationInfo = productsResponse?.meta || { total: 0, ... }
```

### Changes Required

#### File 1: `frontend/src/api/client.ts`

**Line ~540-570**: Fix `getAdminProducts()` return type
```typescript
// Before:
async getAdminProducts(params?: {...}): Promise<APIResponse<Product[]>> {

// After:
async getAdminProducts(params?: {...}): Promise<PaginatedResponse<Product[]>> {
```

**Line ~560-590**: Fix `getAdminCategories()` return type
```typescript
// Before:
async getAdminCategories(params?: {...}): Promise<APIResponse<Category[]>> {

// After:
async getAdminCategories(params?: {...}): Promise<PaginatedResponse<Category[]>> {
```

#### File 2: `frontend/src/components/admin/AdminMenuManagement.tsx`

**Lines 134-138**: Remove `as any` type assertions
```typescript
// Before:
const products = (productsResponse as any)?.data || []
const productsPaginationInfo = (productsResponse as any)?.meta || {...}

// After:
const products = productsResponse?.data || []
const productsPaginationInfo = productsResponse?.meta || {...}
```

### Files That Need Similar Fixes

Check these API methods and fix their return types:
1. `getOrders()` - Should return `PaginatedResponse<Order[]>`
2. `getDiningTables()` - Should return `PaginatedResponse<Table[]>`
3. `getUsers()` - Should return `PaginatedResponse<User[]>`
4. `getContactSubmissions()` - Should return `PaginatedResponse<ContactSubmission[]>`
5. `getIngredients()` - Should return `PaginatedResponse<Ingredient[]>`
6. `getInventory()` - Should return `PaginatedResponse<InventoryItem[]>`

### Components That Need Type Assertion Removals

1. `AdminMenuManagement.tsx` - Remove `as any` for products/categories
2. `AdminOrderHistory.tsx` - Remove `as any` for orders
3. `AdminStaffManagement.tsx` - Remove `as any` for users
4. `AdminTableManagement.tsx` - Remove `as any` for tables
5. `ContactSubmissions.tsx` - Remove `as any` for contacts
6. `IngredientsManagement.tsx` - Remove `as any` for ingredients
7. `InventoryManagement.tsx` - Remove `as any` for inventory

### Expected Outcome

After fixes:
- ✅ No `as any` type assertions needed
- ✅ Proper type safety with `PaginatedResponse<>`
- ✅ ESLint "Unexpected any" warnings resolved
- ✅ TypeScript compilation succeeds without errors
- ✅ Build succeeds (as it already does, but with better type safety)

### Verification Steps

1. Fix API client return types
2. Remove `as any` assertions from components
3. Run `npm run type-check` - should pass
4. Run `npm run lint` - fewer warnings
5. Run `npm run build` - should succeed