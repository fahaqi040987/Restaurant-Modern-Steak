# Testing Improvements Tracking

**Last Updated:** December 15, 2025  
**Document Purpose:** Track testing improvements from Future Testing Improvements priorities

---

## Overview

This document tracks the implementation status of testing improvements across High, Medium, and Low priorities as defined in the project testing strategy.

**Current Test Coverage:** 35% (24/68 tests passing)  
**Target Coverage:** 80% by end of Week 2  
**Framework Status:** ✅ All testing infrastructure configured

---

## 🔴 High Priority (Week 1)

### 1. Backend Unit Tests Reimplementation
**Status:** 🔴 NOT STARTED  
**Priority:** CRITICAL  
**Estimated Effort:** 2 days  
**Blocked By:** None

**Context:**
- Previous tests (875+ lines) removed due to architecture mismatch
- Mock repository patterns incompatible with actual handlers
- OrderFilters type undefined (handlers use query params)

**Implementation Plan:**
1. Use table-driven tests (Go best practice)
2. Test HTTP handlers with `httptest.NewRecorder()`
3. Mock database with `go-sqlmock`
4. Test JSON responses and status codes

**Files to Create:**
- `backend/internal/handlers/orders_test.go`
- `backend/internal/handlers/products_test.go`
- `backend/internal/handlers/auth_test.go`

**Acceptance Criteria:**
- [ ] 20+ test cases (happy path + errors)
- [ ] 80%+ code coverage for handlers
- [ ] `go test -v ./internal/handlers/...` passes
- [ ] Tests match actual handler implementation

**Example Test Pattern:**
```go
func TestGetOrders(t *testing.T) {
    tests := []struct {
        name           string
        queryParams    string
        mockResponse   []*models.Order
        expectedStatus int
    }{
        {"all orders", "", mockOrders, 200},
        {"filter by status", "status=pending", pendingOrders, 200},
        {"invalid status", "status=invalid", nil, 400},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test implementation
        })
    }
}
```

---

### 2. E2E Authentication Tests Fix
**Status:** 🔴 NOT STARTED  
**Priority:** HIGH  
**Estimated Effort:** 4 hours  
**Blocked By:** None

**Context:**
- 39 E2E tests failing (auth, admin, UI/UX suites)
- Tests look for login at `/` instead of `/login`
- Smoke tests confirm `/login` route works

**Files to Update:**
- `e2e/auth.spec.ts` (18 tests)
- `e2e/admin-dashboard.spec.ts` (11 tests)
- `e2e/ui-ux.spec.ts` (10 tests)

**Changes Required:**
```typescript
// OLD: page.goto('/')
// NEW: page.goto('/login')

// Update all auth flows to use correct route
await page.goto('http://localhost:3000/login');
await page.fill('input[name="username"]', 'admin');
await page.fill('input[name="password"]', 'password');
await page.click('button[type="submit"]');
```

**Acceptance Criteria:**
- [ ] All 39 E2E tests pass
- [ ] Login flow works end-to-end
- [ ] Role-based redirects tested
- [ ] Auth smoke tests remain passing

---

### 3. Backend Health Endpoint
**Status:** 🔴 NOT STARTED  
**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Blocked By:** None

**Context:**
- `/api/v1/health` returns 404
- Needed for monitoring and load balancers
- Backend smoke test expects this endpoint

**Implementation:**
```go
// File: backend/internal/handlers/health.go
package handlers

import (
    "github.com/gin-gonic/gin"
    "time"
)

func GetSystemHealth(c *gin.Context) {
    dbHealthy := checkDatabaseConnection()
    
    status := "healthy"
    statusCode := 200
    if !dbHealthy {
        status = "unhealthy"
        statusCode = 503
    }
    
    c.JSON(statusCode, gin.H{
        "status":    status,
        "database":  dbHealthy,
        "timestamp": time.Now(),
        "version":   "1.0.0",
    })
}

func checkDatabaseConnection() bool {
    // Ping database with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    return db.PingContext(ctx) == nil
}
```

**Route Registration:**
```go
// File: backend/internal/api/routes.go
public := router.Group("/api/v1")
{
    public.GET("/health", handlers.GetSystemHealth)
}
```

**Acceptance Criteria:**
- [ ] Endpoint returns 200 OK when healthy
- [ ] Returns 503 when database unreachable
- [ ] Includes database status, timestamp, version
- [ ] No authentication required
- [ ] E2E smoke test updated and passing

---

### 4. Kitchen Component API Mocking
**Status:** 🔴 NOT STARTED  
**Priority:** MEDIUM-HIGH  
**Estimated Effort:** 4 hours  
**Blocked By:** None

**Context:**
- 5 tests fail in `KitchenEnhancementIntegration.test.tsx`
- Undefined settings object
- API module resolution issues

**File to Update:**
- `frontend/src/components/kitchen/__tests__/KitchenEnhancementIntegration.test.tsx`

**Implementation:**
```typescript
import { vi } from 'vitest';
import * as apiClient from '@/api/client';

// Mock API client
vi.mock('@/api/client', () => ({
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
    getSettings: vi.fn(),
}));

// Mock settings
const mockSettings = {
    sound_enabled: true,
    sound_volume: 80,
    auto_refresh: true,
    refresh_interval: 30,
};

// Mock orders
const mockOrders = [
    { id: '1', table_number: 5, status: 'pending', items: [...] },
    { id: '2', table_number: 3, status: 'preparing', items: [...] },
];

beforeEach(() => {
    vi.mocked(apiClient.getSettings).mockResolvedValue(mockSettings);
    vi.mocked(apiClient.getOrders).mockResolvedValue(mockOrders);
});
```

**Acceptance Criteria:**
- [ ] All 5 kitchen tests pass
- [ ] API methods properly mocked
- [ ] Settings object provided
- [ ] Component renders without errors
- [ ] Status updates tested

---

## 🟡 Medium Priority (Week 2)

### 5. Complete Order Flow E2E Test
**Status:** ⚪ PLANNED  
**Estimated Effort:** 1 day  

**Test Scenarios:**
1. Server creates order at table
2. Order appears in kitchen display
3. Kitchen updates status: preparing → ready → completed
4. Counter processes payment
5. Receipt prints with Indonesian formatting

**File:** `e2e/order-flow.spec.ts`

---

### 6. Kitchen Display E2E Test
**Status:** ⚪ PLANNED  
**Estimated Effort:** 4 hours  

**Test Scenarios:**
1. New orders appear automatically
2. Sound notifications play
3. Order timer updates
4. Multiple orders handled
5. Status changes reflect immediately

**File:** `e2e/kitchen-display.spec.ts`

---

### 7. Payment Processing E2E Test
**Status:** ⚪ PLANNED  
**Estimated Effort:** 4 hours  

**Test Scenarios:**
1. Cash payment with change calculation
2. Card payment processing
3. Split payment (cash + card)
4. Receipt generation
5. Payment history recording

**File:** `e2e/payment-processing.spec.ts`

---

### 8. Staff Management E2E Test
**Status:** ⚪ PLANNED  
**Estimated Effort:** 4 hours  

**Test Scenarios:**
1. Create new user with role
2. Edit user details
3. Role assignment validation
4. Deactivate user
5. Role-based access control

**File:** `e2e/staff-management.spec.ts`

---

### 9. Inventory Management E2E Test
**Status:** ⚪ PLANNED  
**Estimated Effort:** 4 hours  

**Test Scenarios:**
1. View current stock levels
2. Restock items
3. Low stock warnings
4. Stock history tracking
5. Ingredient-product relationships

**File:** `e2e/inventory-management.spec.ts`

---

## 🟢 Low Priority (Week 3-4)

### 10. Visual Regression Testing
**Status:** ⚪ PLANNED  
**Estimated Effort:** 1 day  

**Implementation:**
- Use Playwright's built-in screenshot comparison
- Baseline screenshots for all pages
- Desktop: 1920x1080, 1366x768
- Mobile: 375x667, 414x896
- Dark mode vs Light mode

**Setup:**
```typescript
// playwright.config.ts
use: {
    screenshot: 'only-on-failure',
}

// Test
await expect(page).toHaveScreenshot('homepage-desktop.png');
```

---

### 11. Accessibility Testing (axe-core)
**Status:** ⚪ PLANNED  
**Estimated Effort:** 1 day  

**Installation:**
```bash
npm install --save-dev @axe-core/playwright
```

**Implementation:**
```typescript
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('homepage accessibility', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    await checkA11y(page);
});
```

**Tests:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios

---

### 12. Performance Testing (Lighthouse CI)
**Status:** ⚪ PLANNED  
**Estimated Effort:** 2 days  

**Installation:**
```bash
npm install --save-dev @lhci/cli
```

**Configuration:**
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}]
      }
    }
  }
}
```

**Metrics:**
- Performance score > 90
- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1

---

### 13. Load Testing (k6)
**Status:** ⚪ PLANNED  
**Estimated Effort:** 2 days  

**Installation:**
```bash
brew install k6  # macOS
```

**Test Script:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '2m', target: 100 }, // Ramp up
        { duration: '5m', target: 100 }, // Stay at 100
        { duration: '2m', target: 0 },   // Ramp down
    ],
};

export default function () {
    let res = http.post('http://localhost:8080/api/v1/orders', {
        table_number: 5,
        items: [{ product_id: '1', quantity: 2 }],
    });
    
    check(res, {
        'status is 201': (r) => r.status === 201,
        'response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    sleep(1);
}
```

**Metrics to Track:**
- Requests per second
- Response time (p95, p99)
- Error rate
- Database connections

---

### 14. Security Testing (OWASP ZAP)
**Status:** ⚪ PLANNED  
**Estimated Effort:** 2 days  

**Installation:**
```bash
docker pull ghcr.io/zaproxy/zaproxy:stable
```

**Scan Script:**
```bash
docker run -v $(pwd):/zap/wrk:rw \
    -t ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py \
    -t http://localhost:3000 \
    -r zap-report.html
```

**Tests:**
- SQL injection
- XSS vulnerabilities
- CSRF token validation
- Authentication bypass
- Sensitive data exposure

---

## Progress Tracking

### Weekly Goals

**Week 1 (High Priority):**
- [ ] Backend unit tests (20+ tests)
- [ ] E2E auth fix (39 tests)
- [ ] Health endpoint
- [ ] Kitchen component mocking (5 tests)
- **Target:** 88/68 tests passing (129% - new tests added)

**Week 2 (Medium Priority):**
- [ ] Order flow E2E (10 tests)
- [ ] Kitchen display E2E (8 tests)
- [ ] Payment E2E (8 tests)
- [ ] Staff management E2E (6 tests)
- [ ] Inventory E2E (6 tests)
- **Target:** 126/106 tests passing (119%)

**Week 3-4 (Low Priority):**
- [ ] Visual regression (20+ screenshots)
- [ ] Accessibility (30+ checks)
- [ ] Performance (10+ metrics)
- [ ] Load testing (stress tests)
- [ ] Security testing (OWASP scan)
- **Target:** Full test suite operational

### Current Metrics

| Week | High | Medium | Low | Total | Coverage |
|------|------|--------|-----|-------|----------|
| Current | 24 | 0 | 0 | 24/68 | 35% |
| Week 1 Target | 88 | 0 | 0 | 88/106 | 83% |
| Week 2 Target | 88 | 38 | 0 | 126/144 | 88% |
| Week 3-4 Target | 88 | 38 | ✅ | 126/144 | 90%+ |

---

## Testing Best Practices

### Backend (Go)
1. Use table-driven tests for multiple scenarios
2. Test HTTP handlers, not just business logic
3. Mock database with `go-sqlmock`
4. Test error paths, not just happy paths
5. Use `httptest.NewRecorder()` for HTTP testing

### Frontend (Vitest + React Testing Library)
1. Mock API calls with `vi.mock()`
2. Test user interactions, not implementation
3. Use `screen.getByRole()` for accessibility
4. Avoid testing internal state
5. Test loading and error states

### E2E (Playwright)
1. Use page object model for reusability
2. Test critical user journeys, not every feature
3. Avoid hard-coded waits, use `page.waitForSelector()`
4. Test on multiple viewports (desktop, mobile)
5. Keep tests independent and idempotent

---

## References

- **TESTING.md:** Comprehensive testing documentation
- **spec.md:** Project specification with testing section
- **Playwright Docs:** https://playwright.dev/
- **Vitest Docs:** https://vitest.dev/
- **Go Testing:** https://go.dev/doc/tutorial/add-a-test
- **OWASP Testing Guide:** https://owasp.org/www-project-web-security-testing-guide/

---

**Last Updated:** December 15, 2025  
**Next Review:** Week 1 completion (after High Priority items)
