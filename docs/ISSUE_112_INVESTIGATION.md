# Issue #112: Sync Error After Creating Quote - Investigation

**Issue**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues/112
**Status**: Under Investigation
**Priority**: High
**Date**: 2025-11-12

## Problem Statement

Sync status shows 'error' after creating new quote with jobs. This prevents data synchronization to the backend, violating the offline-first architecture principle.

## Reproduction Steps

1. Create new quote (customer info, etc.)
2. Add one or more jobs to the quote
3. Save the quote
4. Observe sync status indicator → shows 'error' instead of 'synced'

## Environment

- **Frontend**: localhost:3000 (or staging)
- **Backend**: localhost:4000 (or staging API)
- **Browser**: All browsers affected
- **Auth**: Auto-login via Playwright / Manual login

## Code Analysis

### Quote Creation Flow

1. **Frontend**: `quotesDb.ts:createQuote()`
   - Creates quote with `sync_status: SyncStatus.PENDING`
   - Adds to sync queue with `operation: SyncOperation.CREATE`
   - Quote data includes: id, quote_number, customer info, metadata

2. **Sync Engine**: `syncService.ts:pushChanges()`
   - Retrieves pending items from sync queue
   - Sends CREATE request to backend API `/api/quotes`
   - On success: marks as synced
   - On error: marks as failed → `markQuoteAsSyncError()`

3. **Error Handling** (line 104-123 in syncService.ts):
   ```typescript
   catch (error) {
     console.error(`Sync error for quote ${item.quote_id}:`, error);

     // Handle errors
     let errorMessage = 'Unknown error';
     if (error instanceof ApiError) {
       errorMessage = error.message;
     } else if (error instanceof Error) {
       errorMessage = error.message;
     }

     errors.push(`Quote ${item.quote_id}: ${errorMessage}`);

     // Mark as failed with exponential backoff
     await syncQueue.markFailed(item.id, errorMessage);
     await markQuoteAsSyncError(item.quote_id, errorMessage);
   }
   ```

## Potential Root Causes

### 1. Jobs Not Synced Before Quote (Most Likely)

**Hypothesis**: Jobs are created locally but not synced to backend before the quote attempts to sync.

**Evidence**:
- Quote creation includes jobs in the sync queue
- If jobs sync fails first, quote sync might fail validation
- Backend might expect jobs to exist before accepting quote reference

**Fix**: Ensure jobs are synced successfully before marking quote as ready to sync, OR include jobs data in quote sync payload.

### 2. Missing Financial Data

**Hypothesis**: Quote is synced without required financial calculations.

**Evidence**:
- Jobs have subtotals calculated locally
- Quote financials might not be aggregated properly
- Backend might validate that quote total matches sum of job subtotals

**Fix**: Ensure `financials` object is properly calculated and included in quote data before sync.

### 3. Backend Validation Errors

**Hypothesis**: Backend rejects quote due to schema validation failures.

**Evidence**:
- Frontend might send fields backend doesn't expect
- Required backend fields might be missing
- Data type mismatches (e.g., dates as strings vs Date objects)

**Fix**:
- Check backend validation schema
- Ensure all required fields are present
- Serialize dates/objects correctly before sending

### 4. Authentication Token Issues

**Hypothesis**: Auth token expires or is invalid during sync attempt.

**Evidence**:
- Manual testing uses auto-login which might generate short-lived tokens
- Token refresh might not be working correctly

**Fix**: Implement token refresh logic before sync attempts.

### 5. Race Condition in Job/Quote Creation

**Hypothesis**: Quote and jobs are created/synced concurrently, causing conflicts.

**Evidence**:
- Creating quote with jobs involves multiple async operations
- Sync queue might process items out of order
- Jobs might reference quote that doesn't exist yet on backend

**Fix**: Implement proper ordering in sync queue (parent entities before children).

## Diagnostic Logging Enhancement

To identify the exact error, we need better logging:

```typescript
// In syncService.ts:pushChanges()
catch (error) {
  // Enhanced error logging
  console.error(`=== SYNC ERROR DETAILS ===`);
  console.error(`Quote ID: ${item.quote_id}`);
  console.error(`Operation: ${item.operation}`);
  console.error(`Error Type: ${error.constructor.name}`);

  if (error instanceof ApiError) {
    console.error(`API Error:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });
  }

  console.error(`Error Message: ${error.message}`);
  console.error(`Error Stack:`, error.stack);
  console.error(`Quote Data:`, JSON.stringify(item.data, null, 2));
  console.error(`===========================`);

  // ... rest of error handling
}
```

## Testing Protocol

### Local Development Testing

1. **Enable Enhanced Logging**:
   - Add diagnostic logs to syncService.ts
   - Open browser console before testing

2. **Test Scenario 1: Simple Quote (No Jobs)**:
   ```
   - Create quote with only customer info
   - Check sync status → should succeed
   - Verify backend received quote
   ```

3. **Test Scenario 2: Quote with Single Job**:
   ```
   - Create quote
   - Add one job (e.g., driveway)
   - Check sync status
   - Examine console logs for exact error
   ```

4. **Test Scenario 3: Quote with Multiple Jobs**:
   ```
   - Create quote
   - Add 2-3 jobs of different types
   - Check sync status
   - Compare error patterns
   ```

5. **Test Scenario 4: Network Inspector**:
   ```
   - Open browser DevTools → Network tab
   - Create quote with jobs
   - Find failing API request
   - Examine request payload and response
   ```

### Backend Testing

1. **Direct API Testing** (if backend available):
   ```bash
   # Test quote creation with jobs
   curl -X POST http://localhost:4000/api/quotes \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d @test-quote.json
   ```

2. **Backend Logs**:
   - Check backend console for validation errors
   - Look for database constraint violations
   - Verify jobs table foreign key relationships

## Recommended Fix Priority

1. **Immediate**: Add enhanced diagnostic logging (30 minutes)
2. **Short-term**: Run local testing protocol to identify exact error (1-2 hours)
3. **Medium-term**: Implement fix based on findings (2-4 hours)
4. **Long-term**: Add E2E test to prevent regression (2 hours)

## Related Issues

- ✅ Issue #1: Sync queue not clearing (RESOLVED) - Different issue, auto-sync timing
- ✅ Issue #2: Job financial calculations (RESOLVED) - May be related if calculations fail silently
- ❓ Issue #119: Admin dashboard - Not directly related but sync is critical for admin features

## Next Steps

1. ✅ Create investigation document (this file)
2. ⏳ Add diagnostic logging to syncService.ts
3. ⏳ Run test protocol locally
4. ⏳ Identify exact error from logs
5. ⏳ Implement targeted fix
6. ⏳ Verify fix resolves issue
7. ⏳ Add E2E test coverage
8. ⏳ Document resolution in STATUS.md

---

**Investigation Status**: Diagnostic logging added, awaiting local testing results

