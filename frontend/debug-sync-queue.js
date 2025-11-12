/**
 * Sync Queue Diagnostic Script
 *
 * Run this in the browser console (F12) to inspect the sync queue state.
 *
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy/paste this entire script
 * 4. Press Enter
 * 5. Review the diagnostic output
 */

(async function diagnoseSyncQueue() {
  console.log('🔍 Starting Sync Queue Diagnostics...\n');

  try {
    // Import Dexie to access IndexedDB
    const { db } = await import('/src/shared/db/indexedDb.ts');

    console.log('✅ Connected to IndexedDB\n');

    // Get all items from sync_queue
    const queueItems = await db.sync_queue.toArray();

    console.log(`📊 Sync Queue Summary:`);
    console.log(`   Total items: ${queueItems.length}\n`);

    if (queueItems.length === 0) {
      console.log('✨ Sync queue is empty - no pending items');
      return;
    }

    // Group by status
    const byStatus = {};
    queueItems.forEach(item => {
      const status = item.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    console.log('📈 Items by status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');

    // Show detailed info for each item
    console.log('📋 Detailed Queue Items:\n');
    queueItems.forEach((item, index) => {
      console.log(`Item ${index + 1}/${queueItems.length}:`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Quote ID: ${item.quote_id}`);
      console.log(`   Operation: ${item.operation}`);
      console.log(`   Status: ${item.status || 'pending'}`);
      console.log(`   Priority: ${item.priority || 'normal'}`);
      console.log(`   Retry Count: ${item.retry_count || 0}`);
      console.log(`   Created: ${new Date(item.created_at).toLocaleString()}`);

      if (item.next_retry_at) {
        const nextRetry = new Date(item.next_retry_at);
        const now = new Date();
        const isPast = nextRetry < now;
        console.log(`   Next Retry: ${nextRetry.toLocaleString()} ${isPast ? '(PAST DUE)' : '(future)'}`);
      }

      if (item.error_message) {
        console.log(`   ❌ Error: ${item.error_message}`);
      }

      if (item.data) {
        console.log(`   Data:`, item.data);
      }

      console.log('');
    });

    // Check connection state
    const isOnline = navigator.onLine;
    console.log(`🌐 Connection Status:`);
    console.log(`   Browser reports: ${isOnline ? 'ONLINE ✅' : 'OFFLINE ❌'}`);
    console.log('');

    // Check for auth token
    const authToken = localStorage.getItem('authToken');
    console.log(`🔐 Authentication:`);
    console.log(`   Auth token exists: ${authToken ? 'YES ✅' : 'NO ❌'}`);
    if (authToken) {
      console.log(`   Token length: ${authToken.length} chars`);
    }
    console.log('');

    // Get sync state from useSync store
    console.log(`🔄 Sync State (from Zustand store):`);
    console.log(`   Check window.__ZUSTAND__ or look for useSync state in React DevTools`);
    console.log('');

    // Recommendations
    console.log(`💡 Recommendations:`);

    if (queueItems.some(item => item.retry_count > 3)) {
      console.log(`   ⚠️  Some items have high retry counts - sync may be failing repeatedly`);
    }

    if (queueItems.some(item => item.error_message)) {
      console.log(`   ❌ Some items have errors - check error messages above`);
    }

    if (queueItems.some(item => {
      const nextRetry = new Date(item.next_retry_at);
      return nextRetry < new Date();
    })) {
      console.log(`   ⏰ Some items are past their retry time - sync should attempt soon`);
    }

    if (!authToken && queueItems.length > 0) {
      console.log(`   🔐 No auth token found but queue has items - this may prevent syncing`);
    }

    if (!isOnline && queueItems.length > 0) {
      console.log(`   🌐 Browser reports offline - items will sync when connection restored`);
    }

    console.log('\n✅ Diagnostics complete');

    // Return for further inspection
    return {
      queueItems,
      summary: {
        total: queueItems.length,
        byStatus,
        isOnline,
        hasAuthToken: !!authToken,
      }
    };

  } catch (error) {
    console.error('❌ Error running diagnostics:', error);
    console.log('\n📝 Troubleshooting:');
    console.log('   1. Make sure you\'re on http://localhost:3000');
    console.log('   2. Make sure the app is running');
    console.log('   3. Try refreshing the page and running this again');
  }
})();
