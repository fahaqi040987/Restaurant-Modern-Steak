# Fix Sticky Search Bar on Menu Page

## Problem Analysis

The search bar and category filter section on the menu page follows the user when scrolling down, but the user wants it to stay static at its original position under the heading text.

**Current Behavior:**
- Search/filter section has `sticky top-16` positioning
- It sticks to the top of viewport when scrolling past the header
- Creates a persistent search/filter bar while browsing menu items

**Desired Behavior:**
- Search bar should remain static (non-sticky)
- It should stay positioned under the "Jelajahi pilihan potongan premium, hidangan signature, dan kreasi kuliner kami" heading
- User scrolls past it naturally when browsing menu items

## Root Cause

In `frontend/src/routes/site/menu.tsx` at line 106:

```typescript
<section className="py-6 border-b border-[var(--public-border)] sticky top-16 z-40 bg-[var(--public-bg-primary)]/95 backdrop-blur-md">
```

The problematic classes:
- `sticky top-16` - Makes the section stick to viewport top (below header)
- `z-40` - Ensures it stays above other content
- `backdrop-blur-md` - Adds blur effect behind sticky element

## Solution

### Option A: Remove Sticky Behavior (Recommended)

Simply remove the sticky positioning classes to make the search bar static:

```typescript
<section className="py-6 border-b border-[var(--public-border)]">
```

**Pros:**
- Simple change
- Search bar stays in natural document flow
- User can scroll past it normally
- No visual artifacts from sticky behavior

**Cons:**
- Users lose quick access to search/filter while scrolling
- Must scroll back up to change filters

### Option B: Keep Sticky but Improve UX

Keep sticky behavior but make it less obtrusive:

```typescript
<section className="py-6 border-b border-[var(--public-border)] md:sticky md:top-16 md:z-40 bg-[var(--public-bg-primary)]">
```

**Pros:**
- Sticky only on medium+ screens
- Mobile users get static search bar
- Desktop users keep convenient sticky search

**Cons:**
- Still has sticky behavior (which user doesn't want)

### Option C: Make Sticky Optional with Toggle

Add a user preference to enable/disable sticky search:

```typescript
const [stickySearch, setStickySearch] = useState(false);

<section className={cn(
  "py-6 border-b border-[var(--public-border)]",
  stickySearch && "sticky top-16 z-40 bg-[var(--public-bg-primary)]/95 backdrop-blur-md"
)}>
```

**Pros:**
- Gives users control
- Best of both worlds
- Future-proof for accessibility

**Cons:**
- More complex implementation
- Requires UI for toggle
- Not requested by user

## Recommended Solution

**I recommend Option A: Remove Sticky Behavior**

Based on the user's explicit request: "please not follow when I scroll down", the simplest and most correct solution is to remove the sticky positioning entirely.

### Implementation Steps

1. **Remove sticky classes** from the filter section
2. **Keep visual styling** (padding, border, background)
3. **Test in development environment** as requested
4. **Verify responsive behavior** on mobile and desktop
5. **Ensure accessibility** is maintained

### Code Changes

**File:** `frontend/src/routes/site/menu.tsx`
**Line:** ~106

**Before:**
```typescript
<section className="py-6 border-b border-[var(--public-border)] sticky top-16 z-40 bg-[var(--public-bg-primary)]/95 backdrop-blur-md">
```

**After:**
```typescript
<section className="py-6 border-b border-[var(--public-border)] bg-[var(--public-bg-primary)]">
```

### Classes Removed:
- `sticky top-16` - Removes sticky positioning
- `z-40` - No longer needed (not stacking)
- `backdrop-blur-md` - No blur needed without sticky
- `/95` from background opacity - Make background fully opaque

### Classes Kept:
- `py-6` - Vertical padding
- `border-b` - Bottom border
- `border-[var(--public-border)]` - Border color
- `bg-[var(--public-bg-primary)]` - Background color

## Testing Checklist

After implementing the fix:
- [ ] Search bar stays static when scrolling
- [ ] Search bar appears under heading text
- [ ] Category slider works normally
- [ ] Filter functionality unchanged
- [ ] Mobile responsive design intact
- [ ] No visual artifacts or layout shifts
- [ ] Accessibility maintained (keyboard navigation, screen readers)

## Development Environment Testing

Per user request, this will be developed and tested in the development environment first:
1. Start dev server: `make dev` or `npm run dev`
2. Navigate to: http://localhost:3000/site/menu
3. Test scrolling behavior
4. Verify search and filter functionality
5. Test on mobile viewport
6. Only merge to production after user approval

Would you like me to proceed with implementing Option A (remove sticky behavior)?