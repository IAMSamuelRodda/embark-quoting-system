import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth';
import { enableAutoSync } from './features/sync/syncService';

// Eager load: LoginPage (needed immediately for unauthenticated users)
import { LoginPage } from './features/auth/LoginPage';

// Lazy load: Protected routes (only load when user navigates to them)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const QuoteDetailPage = lazy(() => import('./pages/QuoteDetailPage'));
const QuoteEditor = lazy(() => import('./features/quotes/QuoteEditor'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));

// Loading fallback component for lazy-loaded routes
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const { checkAuth, isLoading, isAuthenticated } = useAuth();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Enable automatic background sync ONLY when authenticated
  // This prevents 401 errors from sync firing before auth completes
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[App] Waiting for authentication before enabling auto-sync...');
      return;
    }

    console.log('[App] Authentication complete. Initializing auto-sync service...');
    const unsubscribe = enableAutoSync();

    return () => {
      console.log('[App] Cleaning up auto-sync service...');
      unsubscribe();
    };
  }, [isAuthenticated]); // Dependency on isAuthenticated - only enable after auth succeeds

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/quotes/new"
            element={isAuthenticated ? <QuoteEditor /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/quotes/:id"
            element={isAuthenticated ? <QuoteDetailPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" replace />}
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
