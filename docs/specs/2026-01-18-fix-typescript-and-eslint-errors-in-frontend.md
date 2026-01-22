## Fix TypeScript and ESLint Errors in Frontend

### Issues Identified

#### 1. **ESLint Configuration Error**
**Error**: `Configuration for rule "@typescript-eslint/no-explicit-any" is invalid. Expected severity of "off", 0, "warn", 1, "error", or 2". You passed '"on"'.`

**Location**: `frontend/eslint.config.js` line 44

**Cause**: The rule severity is set to `"on"` but should be `"error"` or `"warn"`

**Fix**: Change `"@typescript-eslint/no-explicit-any": "on"` to `"@typescript-eslint/no-explicit-any": "error"`

#### 2. **Missing TypeScript Environment Variables**
**Error**: `Property 'env' does not exist on type 'ImportMeta'. (ts 2307)`

**Location**: Multiple files using `import.meta.env`

**Cause**: The `vite-env.d.ts` file defines `ImportMeta` interface but TypeScript might not be recognizing it properly

**Fix**: Ensure proper TypeScript configuration and add Vite types to tsconfig

#### 3. **TypeScript Path Resolution**
**Error**: Module resolution issues with `@/` imports

**Cause**: TypeScript and Vite path resolution need to be properly aligned

**Fix**: Update tsconfig.json to ensure proper path mapping

### Changes Required

#### File 1: `frontend/eslint.config.js`
**Line 44**: Change rule severity
```javascript
// Before (WRONG):
"@typescript-eslint/no-explicit-any": "on",

// After (CORRECT):
"@typescript-eslint/no-explicit-any": "error",
```

#### File 2: `frontend/tsconfig.json`
**Add/Update**:
```json
{
  "compilerOptions": {
    // ... existing options ...
    "types": ["vite/client", "node"],
  }
}
```

#### File 3: `frontend/vite-env.d.ts`
**Ensure proper exports**:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Files Affected by `import.meta.env` Usage

These files use `import.meta.env` and will benefit from the fixes:
- `src/main.tsx`
- `src/api/client.ts`
- `src/routes/index.tsx`
- `src/components/public/ContactInfo.tsx`
- `src/components/public/MenuItemCard.tsx`
- `src/components/ui/ImageUploader.tsx`
- `src/components/admin/AdminMenuTable.tsx`
- `src/components/admin/AdminMenuManagement.tsx`

### Additional Improvements

1. **Add TypeScript globals for Vite environment**:
   - Update `tsconfig.json` to include Vite client types
   - Ensure proper type inference for `import.meta.env`

2. **Fix ESLint configuration**:
   - Correct all rule severities to use valid values
   - Add proper type declarations for environment variables

3. **Verify path resolution**:
   - Ensure `@/` imports work correctly in both TypeScript and ESLint
   - Check that `baseUrl` and `paths` are properly configured

### Expected Outcome

After fixes:
- ✅ ESLint runs without configuration errors
- ✅ TypeScript recognizes `import.meta.env`
- ✅ All `@/` imports resolve correctly
- ✅ No type errors for environment variables
- ✅ `npm run lint` works
- ✅ `npm run type-check` works