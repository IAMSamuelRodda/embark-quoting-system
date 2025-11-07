import { useEffect } from 'react';
import { useAuth } from '../features/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { QuoteList } from '../features/quotes/QuoteList';
import { SyncStatusIndicator } from '../features/sync/SyncStatusIndicator';
import { useSync } from '../features/sync/useSync';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { sync, isOnline } = useSync();

  // Trigger initial sync when dashboard loads (if online)
  useEffect(() => {
    if (isOnline) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Embark Quoting System</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user?.email} ({user?.role})
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Sync Status Indicator */}
              <SyncStatusIndicator />
              <button onClick={handleSignOut} className="btn-secondary">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - QuoteList */}
      <main>
        <QuoteList />
      </main>
    </div>
  );
}

export default DashboardPage;
