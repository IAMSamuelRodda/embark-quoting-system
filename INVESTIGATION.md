# Critical Issues Investigation Guide

**Date:** 2025-11-11
**Issues:** Sync queue not clearing + Job calculations not working

---

## Issue #1: Sync Queue Not Clearing ("2 pending" indicator)

### Current Status
- ✅ Backend API verified healthy (http://localhost:3001/health)
- ✅ Database connected
- 🔍 Investigating browser-side sync queue

### Investigation Steps

#### Step 1: Run Diagnostic Script in Browser Console

1. **Open your browser** (where you see the "2 pending" indicator)
2. **Open DevTools** - Press `F12` or `Ctrl+Shift+I`
3. **Go to Console tab**
4. **Copy and paste** the contents of `frontend/debug-sync-queue.js`
5. **Press Enter** to run the script

The script will output:
- Total items in sync queue
- Status of each item
- Retry counts and next retry times
- Error messages (if any)
- Auth token presence
- Connection status

**Expected Output Example:**
```
🔍 Starting Sync Queue Diagnostics...

✅ Connected to IndexedDB

📊 Sync Queue Summary:
   Total items: 2

📈 Items by status:
   pending: 2

📋 Detailed Queue Items:

Item 1/2:
   ID: abc-123
   Quote ID: uuid-of-quote
   Operation: CREATE
   Status: pending
   Priority: normal
   Retry Count: 5
   Created: 11/10/2025, 10:30:45 PM
   Next Retry: 11/10/2025, 10:35:00 PM (PAST DUE)
   ❌ Error: 401 Unauthorized

... more details ...
```

#### Step 2: Check for Common Issues

Based on diagnostic output, check:

**A. Authentication Error (401 Unauthorized)**
- **Symptom**: Error message contains "401" or "Unauthorized"
- **Cause**: Auth token expired or invalid
- **Fix**: Click manual sync button OR sign out and sign in again

**B. High Retry Count**
- **Symptom**: `retry_count` > 5
- **Cause**: Sync failing repeatedly, exponential backoff delaying retry
- **Fix**: Clear the stuck items or wait for next retry window

**C. Past Due Retry Time**
- **Symptom**: "Next Retry" shows "(PAST DUE)" but sync not attempting
- **Cause**: Auto-sync only triggers on connection change, not periodically
- **Root Issue**: Missing periodic retry mechanism while online
- **Fix**: Click manual sync button OR toggle airplane mode to trigger auto-sync

**D. No Auth Token**
- **Symptom**: "Auth token exists: NO ❌"
- **Cause**: Not logged in or token cleared
- **Fix**: Sign in to the application

#### Step 3: Check Browser Console for Sync Errors

In the same DevTools Console, look for:
- Red error messages containing "[Sync]" or "[SyncService]"
- 401 errors from API requests
- Network errors

Common patterns to search for (Ctrl+F in Console):
- `401`
- `Sync error`
- `Auto-sync`
- `Failed to sync`

#### Step 4: Inspect Network Tab for Failed Requests

1. **Go to Network tab** in DevTools
2. **Filter by XHR/Fetch**
3. **Look for failed requests** (red entries)
4. **Check status codes**:
   - 401: Authentication issue
   - 404: Endpoint not found
   - 500: Server error

#### Step 5: Manual Test - Click Sync Button

1. **Locate the sync button** (refresh icon in header)
2. **Click it**
3. **Observe**:
   - Does "2 pending" change to "Syncing..."?
   - Does it eventually show "Synced"?
   - Or does it show error?

---

## Issue #2: Job Financial Calculations Not Working

### Current Status
- 🔍 Not yet investigated
- Awaiting completion of sync queue investigation

### Investigation Steps (To Do)

#### Step 1: Check Job Data in IndexedDB

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Expand IndexedDB** → `embark_db` → `jobs`
4. **Inspect the job entry** for quote EE-2025-0001
5. **Verify**:
   - Job parameters stored (job_type, height, length, etc.)
   - JSONB data field populated
   - calculated_cost field (should have value)

#### Step 2: Check Job Data in Backend

```bash
# Get auth token from browser localStorage
# Then query backend API

curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/quotes/<quote-id>/jobs
```

Check if:
- Job exists in backend
- Job parameters match frontend
- calculated_cost is present

#### Step 3: Check Price Sheet Data

```bash
# Check if price sheets exist
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/price-sheets

# Check price items
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/price-sheets/<sheet-id>/items
```

Expected: Material costs for retaining wall components

#### Step 4: Test Calculation Service

Run backend integration test:
```bash
cd backend
npm run test:integration -- calculation.service.test.js
```

Expected: Tests pass, showing Profit-First formula works

---

## Quick Actions

### Force Sync Now
1. Open browser console
2. Run:
```javascript
// Import sync service
const { syncAll } = await import('/src/features/sync/syncService.ts');

// Trigger manual sync
syncAll().then(result => {
  console.log('Sync result:', result);
});
```

### Clear Stuck Sync Queue (Nuclear Option)
**⚠️ Warning**: This will lose pending changes that haven't synced!

```javascript
const { db } = await import('/src/shared/db/indexedDb.ts');
await db.sync_queue.clear();
console.log('Sync queue cleared');
// Refresh page
location.reload();
```

### Check Auto-Sync Status
```javascript
// Check if auto-sync is enabled
console.log('Connection monitor active:', window.__connectionMonitor);
console.log('Navigator online:', navigator.onLine);
```

---

## Root Cause Hypotheses

### Sync Queue Issue

**Hypothesis 1: Auth Token Expired**
- Sync attempts fail with 401
- Token not refreshed
- Items stuck in retry backoff
- **Test**: Sign out and sign in again

**Hypothesis 2: No Periodic Retry**
- Auto-sync only triggers on connection change (offline → online)
- No periodic polling while online
- Items with failed retries wait indefinitely
- **Test**: Toggle airplane mode to trigger sync

**Hypothesis 3: Exponential Backoff Too Aggressive**
- Retry delays: 1s, 2s, 4s, 8s, 30s, 60s
- After 5 retries, waiting 60+ seconds
- User sees "pending" for minutes
- **Test**: Wait 60+ seconds and observe

### Job Calculations Issue

**Hypothesis 1: Calculation Not Called**
- Job creation doesn't trigger calculation service
- calculated_cost remains null
- **Test**: Check job creation code in RetainingWallForm.tsx

**Hypothesis 2: Price Sheet Missing**
- No material costs in database
- Calculation service can't compute total
- **Test**: Query price_sheets table

**Hypothesis 3: Frontend-Backend Mismatch**
- Frontend expects one field name
- Backend uses different field name
- Data lost in translation
- **Test**: Compare job schema in both codebases

---

## Next Steps After Diagnostics

1. **Document findings** from diagnostic script output
2. **Identify root cause** from investigation steps
3. **Create GitHub issue** for confirmed bug
4. **Implement fix** based on root cause
5. **Test fix** with E2E tests
6. **Update STATUS.md** with resolution

---

**Created:** 2025-11-11
**Last Updated:** 2025-11-11
**Status:** Active Investigation
