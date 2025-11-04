# Testing Strategy - Embark Quoting System

> **Philosophy**: Fast feedback loops with mocked tests, real-world validation with integration tests, and manual verification before releases.

---

## Testing Pyramid

```
           Manual QA (Highest confidence, slowest)
                    ▲
                   / \
                  /   \
                 /     \
                /       \
               / Integ.  \
              /  Tests    \
             /   (AWS)     \
            /               \
           /_________________\
          /                   \
         /   Mocked E2E Tests  \
        /    (Playwright)       \
       /_______________________\
      /                         \
     /     Unit Tests             \
    /    (Jest/Vitest)             \
   /_______________________________\
```

**Bottom → Top:** Speed decreases, confidence increases, cost increases

---

## 1. Unit Tests (Future)

**Status:** Not yet implemented
**Framework:** Vitest (recommended for Vite projects)
**Coverage Target:** 80%+ for business logic

### What to Test
- **Zustand stores** (useAuth, useQuotes, etc.)
- **Service functions** (authService, quoteService)
- **Utility functions** (date formatters, calculators)
- **Custom hooks** (isolated from React components)

### Example
```typescript
// src/features/auth/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

test('should sign in user and set authenticated state', async () => {
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn({
      email: 'test@example.com',
      password: 'Password123!'
    });
  });

  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user?.email).toBe('test@example.com');
});
```

### When to Run
- **Pre-commit hook** (via Husky)
- **CI/CD pipeline** (every push)
- **Local development** (`npm test -- --watch`)

---

## 2. Mocked E2E Tests (Current)

**Status:** Implemented in `e2e/auth-mocked.spec.ts`
**Framework:** Playwright
**Coverage Target:** All critical user flows

### What to Test
- ✅ **UI/UX behavior** (forms, validation, loading states)
- ✅ **Navigation** (routing, redirects, protected routes)
- ✅ **Error handling** (displays, user feedback)
- ✅ **Responsive design** (mobile, tablet, desktop)
- ✅ **Accessibility** (labels, ARIA attributes, keyboard nav)

### Why Mock?
| Benefit | Impact |
|---------|--------|
| **Speed** | ~30 seconds for full suite vs. 5+ minutes with real AWS |
| **Cost** | $0 vs. API call costs |
| **Reliability** | No network failures, rate limits, or AWS outages |
| **Isolation** | Test UI logic independently from backend |

### Test Structure
```typescript
// e2e/auth-mocked.spec.ts
test('should display login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /embark/i })).toBeVisible();
});

test('should redirect unauthenticated users', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});

test('should validate password requirements', async ({ page }) => {
  // Mock NEW_PASSWORD_REQUIRED challenge
  // Verify password validation messages
  // Test form submission behavior
});
```

### When to Run
- **CI/CD pipeline** (every push to main)
- **Pre-push hook** (optional, via Husky)
- **Local development** (`npm run test:e2e`)

### How to Run
```bash
# Run all mocked tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test auth-mocked

# Run in headed mode (see browser)
npx playwright test auth-mocked --headed

# Debug mode
npx playwright test auth-mocked --debug
```

---

## 3. Integration Tests with Real AWS (Selective)

**Status:** Implemented in `e2e/auth-integration.spec.ts` (skipped by default)
**Framework:** Playwright
**Frequency:** Before releases only

### What to Test
- ✅ **Real Cognito authentication flow**
- ✅ **Token persistence** (refresh page, reopen browser)
- ✅ **Error messages** (actual AWS error responses)
- ✅ **Edge cases** (rate limiting, network timeouts)

### Why Selective?
| Concern | Mitigation |
|---------|------------|
| **Slow** (10+ seconds per test) | Run manually, not in CI |
| **Costs money** (AWS API calls) | Limit to critical flows |
| **Rate limits** | Avoid in CI, run locally |
| **Requires cleanup** | Document user deletion steps |

### Test Structure
```typescript
// e2e/auth-integration.spec.ts
test.describe.skip('Real Cognito', () => {
  test('should complete new password flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('[name="password"]', process.env.TEST_TEMP_PASSWORD);
    await page.click('button[type="submit"]');

    // Real Cognito challenge
    await expect(page.getByText(/set new password/i)).toBeVisible({ timeout: 10000 });

    // Complete challenge with real AWS call
    await page.fill('[name="newPassword"]', process.env.TEST_NEW_PASSWORD);
    await page.fill('[name="confirmPassword"]', process.env.TEST_NEW_PASSWORD);
    await page.click('button[type="submit"]');

    // Real authentication and redirect
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });
});
```

### When to Run
- **Before releases** (manual QA)
- **After infrastructure changes** (Cognito config updates)
- **Debugging real AWS issues** (local development)

### How to Run
```bash
# Set environment variables
export TEST_USER_EMAIL="test.playwright@embarkearth.com.au"
export TEST_TEMP_PASSWORD="TestTemp123!"
export TEST_NEW_PASSWORD="YourStrongPassword123!"

# Run integration tests (they're skipped by default)
npx playwright test auth-integration --headed

# Or use .env.test file
export $(cat .env.test | xargs) && npx playwright test auth-integration --headed
```

### Setup & Teardown
```bash
# 1. Create test user (run once)
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username test.playwright@embarkearth.com.au \
  --user-attributes Name=email,Value=test.playwright@embarkearth.com.au \
                     Name=email_verified,Value=true \
                     Name=custom:role,Value=field_worker \
  --temporary-password "TestTemp123!" \
  --message-action SUPPRESS \
  --region ap-southeast-2

# 2. Add to group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username test.playwright@embarkearth.com.au \
  --group-name field_workers \
  --region ap-southeast-2

# 3. Run tests
npx playwright test auth-integration --headed

# 4. Cleanup (after tests complete)
aws cognito-idp admin-delete-user \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username test.playwright@embarkearth.com.au \
  --region ap-southeast-2
```

---

## 4. Manual QA (Pre-Release)

**Status:** Always required before production deployments
**Frequency:** Before every release

### Critical Paths to Test

#### Authentication Flow
1. ✅ Login with temporary password → Set new password → Dashboard
2. ✅ Login with permanent password → Dashboard
3. ✅ Invalid credentials → Error message
4. ✅ Logout → Redirect to login
5. ✅ Refresh page while logged in → Stay logged in
6. ✅ Close browser → Reopen → Stay logged in (30-day token)

#### Offline Functionality (Epic 5)
1. 🔜 Create quote offline → Save to IndexedDB
2. 🔜 View quotes offline → Load from IndexedDB
3. 🔜 Go online → Sync to cloud
4. 🔜 Conflict resolution → Manual merge UI

#### Quote Management (Epic 2)
1. 🔜 Create new quote → Save successfully
2. 🔜 Edit existing quote → Updates persist
3. 🔜 Delete quote → Confirmation modal
4. 🔜 Search quotes → Results display
5. 🔜 Export to PDF → Download works

#### Administration (Epic 6)
1. 🔜 Admin creates new user → User receives email
2. 🔜 Admin assigns role → Permissions apply
3. 🔜 Admin views audit log → All actions logged

### Testing Matrix

| Feature | Desktop | Mobile | Tablet | Offline |
|---------|---------|--------|--------|---------|
| Login | ✅ | ✅ | ✅ | ❌ |
| New Password | ✅ | ✅ | ✅ | ❌ |
| Dashboard | ✅ | 🔜 | 🔜 | 🔜 |
| Create Quote | 🔜 | 🔜 | 🔜 | 🔜 |
| Sync | 🔜 | 🔜 | 🔜 | 🔜 |

**Legend:**
- ✅ Tested and working
- 🔜 Not yet implemented
- ❌ Not applicable

---

## 5. Performance Testing

**Status:** Not yet implemented
**Tools:** Lighthouse, Playwright performance traces

### Metrics to Track
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Service Worker Activation:** < 2s

### How to Run
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Playwright trace
npx playwright test --trace on
npx playwright show-trace trace.zip
```

---

## CI/CD Pipeline Configuration

### Recommended GitHub Actions Workflow

```yaml
name: Frontend Tests

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run unit tests
        working-directory: ./frontend
        run: npm test -- --run

      - name: Install Playwright
        working-directory: ./frontend
        run: npx playwright install --with-deps

      - name: Run mocked E2E tests
        working-directory: ./frontend
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/

      # Integration tests skipped in CI (run manually)
```

---

## Testing Checklist

### Before Committing
- [ ] Code compiles without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Unit tests pass (`npm test`)

### Before Pushing
- [ ] Mocked E2E tests pass (`npm run test:e2e`)
- [ ] No console errors in browser DevTools
- [ ] Tested manually in browser (critical path)

### Before Releasing
- [ ] All CI/CD checks pass
- [ ] Integration tests pass (`npx playwright test auth-integration`)
- [ ] Manual QA completed for all critical paths
- [ ] Lighthouse performance score > 90
- [ ] Tested on real devices (phone, tablet)
- [ ] Tested offline functionality
- [ ] Reviewed error logs (no unexpected errors)

---

## Test Data Management

### Test Users

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `test.worker@embarkearth.com.au` | (Set during first login) | Field Worker | Manual testing |
| `test.playwright@embarkearth.com.au` | (Set via env var) | Field Worker | Integration tests |
| `admin.test@embarkearth.com.au` | (Set during first login) | Admin | Admin feature testing |

### Creating Test Users

```bash
# See docs/admin-user-provisioning.md for full instructions
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username test.user@embarkearth.com.au \
  --user-attributes Name=email,Value=test.user@embarkearth.com.au \
                     Name=email_verified,Value=true \
                     Name=custom:role,Value=field_worker \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS \
  --region ap-southeast-2
```

---

## Troubleshooting

### Mocked Tests Failing

**Problem:** Tests can't find elements
**Solution:** Check selectors match actual HTML

```bash
# Run in headed mode to see what's happening
npx playwright test --headed

# Use Playwright inspector
npx playwright test --debug
```

**Problem:** Tests are flaky
**Solution:** Add explicit waits

```typescript
// Bad (race condition)
await page.click('button');
await expect(page.getByText('Success')).toBeVisible();

// Good (explicit wait)
await page.click('button');
await page.waitForResponse(response => response.url().includes('/api/'));
await expect(page.getByText('Success')).toBeVisible();
```

### Integration Tests Failing

**Problem:** "User not found" error
**Solution:** Create test user via AWS CLI (see setup steps above)

**Problem:** "Invalid credentials" error
**Solution:** Check environment variables are set correctly

```bash
# Debug environment variables
echo $TEST_USER_EMAIL
echo $TEST_TEMP_PASSWORD
echo $TEST_NEW_PASSWORD
```

**Problem:** Timeout waiting for Cognito response
**Solution:** Increase timeout

```typescript
await expect(page.getByText(/set new password/i)).toBeVisible({ timeout: 15000 });
```

---

## Future Enhancements

### 1. Visual Regression Testing
**Tool:** Percy or Chromatic
**Purpose:** Detect unintended UI changes

### 2. Accessibility Testing
**Tool:** axe-core + Playwright
**Purpose:** Ensure WCAG 2.1 AA compliance

### 3. Load Testing
**Tool:** k6 or Artillery
**Purpose:** Verify system handles expected load (100 concurrent users)

### 4. Security Testing
**Tool:** OWASP ZAP
**Purpose:** Detect XSS, CSRF, and other vulnerabilities

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [AWS Cognito Testing Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/testing.html)
- [Web Performance Testing](https://web.dev/vitals/)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-04 | Initial testing strategy | Claude |
| 2025-11-04 | Added mocked and integration test patterns | Claude |
| 2025-11-04 | Documented manual QA checklist | Claude |
