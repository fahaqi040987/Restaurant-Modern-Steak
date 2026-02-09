# Fix "undefined" in Footer Opening Hours Display

## Problem Analysis

The footer's "JAM BUKA" (opening hours) section displays:
- **Expected**: "Senin - Jumat 9:00 AM - 10:00 PM WIB"
- **Actual**: "undefined - Sabtu 9:00 AM - 10:00 PM WIB"

### Root Cause

**Day-of-week indexing mismatch** in `frontend/src/components/public/Footer.tsx`:

1. **Database convention** (Go/PostgreSQL):
   - `day_of_week: 0` = Sunday
   - `day_of_week: 1` = Monday
   - `day_of_week: 2` = Tuesday
   - `day_of_week: 3` = Wednesday
   - `day_of_week: 4` = Thursday
   - `day_of_week: 5` = Friday
   - `day_of_week: 6` = Saturday

2. **Frontend dayNames array** (currently):
   ```typescript
   const dayNames = [
     t('public.monday'),    // index 0
     t('public.tuesday'),   // index 1
     t('public.wednesday'), // index 2
     t('public.thursday'),  // index 3
     t('public.friday'),    // index 4
     t('public.saturday'),  // index 5
     t('public.sunday')     // index 6
   ]
   ```

3. **The bug**:
   ```typescript
   currentGroup = [dayNames[hour.day_of_week - 1]]
   ```
   - When `day_of_week = 0` (Sunday): `dayNames[-1]` → **undefined** ❌
   - When `day_of_week = 1` (Monday): `dayNames[0]` → Monday ✅
   - When `day_of_week = 6` (Saturday): `dayNames[5]` → Saturday ✅

## Solution

### Option A: Reorder dayNames array (Recommended)
Reorder the `dayNames` array to match the database convention (Sunday first):

```typescript
const dayNames = [
  t('public.sunday'),    // index 0 (day_of_week 0)
  t('public.monday'),    // index 1 (day_of_week 1)
  t('public.tuesday'),   // index 2 (day_of_week 2)
  t('public.wednesday'), // index 3 (day_of_week 3)
  t('public.thursday'),  // index 4 (day_of_week 4)
  t('public.friday'),    // index 5 (day_of_week 5)
  t('public.saturday')   // index 6 (day_of_week 6)
]
```

Then change the access pattern to:
```typescript
currentGroup = [dayNames[hour.day_of_week]]
```

### Option B: Create mapping function
Create a helper function to map day_of_week to correct index:

```typescript
const getDayName = (dayOfWeek: number): string => {
  const days = [
    t('public.sunday'),
    t('public.monday'),
    t('public.tuesday'),
    t('public.wednesday'),
    t('public.thursday'),
    t('public.friday'),
    t('public.saturday')
  ]
  return days[dayOfWeek] || ''
}
```

## Implementation Plan

**I recommend Option A** because:
1. Simpler and more direct
2. Matches the database convention consistently
3. Easier to maintain
4. No need for mapping logic

### Steps:

1. **Update Footer.tsx**:
   - Reorder `dayNames` array to start with Sunday
   - Change `dayNames[hour.day_of_week - 1]` to `dayNames[hour.day_of_week]`

2. **Test all scenarios**:
   - Sunday (day_of_week 0) → should display "Minggu" not "undefined"
   - Monday-Saturday (day_of_week 1-6) → should display correct day names
   - Grouped hours should display correctly (e.g., "Senin - Jumat")

3. **Verify with production data**:
   - Check that all 7 days display correctly
   - Verify time formatting works
   - Confirm timezone abbreviation displays

## Expected Results

After the fix:
- **Sunday (0)**: "Minggu 10:00 AM - 8:00 PM WIB" (if open)
- **Monday-Friday (1-5)**: "Senin - Jumat 9:00 AM - 10:00 PM WIB"
- **Saturday (6)**: "Sabtu 10:00 AM - 11:00 PM WIB"
- **No more "undefined"** in the display

Would you like me to proceed with implementing Option A (reordering the dayNames array)?