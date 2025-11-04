import { useAuth } from '../features/auth/useAuth';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Embark Quoting System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="btn-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Dashboard
          </h2>

          <div className="space-y-4">
            {/* User Info Card */}
            <div className="bg-primary-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                User Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p>
                  <span className="font-medium">Role:</span> {user?.role}
                </p>
                <p>
                  <span className="font-medium">Groups:</span>{' '}
                  {user?.groups.length ? user.groups.join(', ') : 'None'}
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {navigator.onLine ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Coming Soon Message */}
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <p className="text-gray-600">
                🚧 Dashboard features coming soon in Epic 2!
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Quote management, job creation, and offline sync will be added next.
              </p>
            </div>
          </div>
        </div>

        {/* PWA Status */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            PWA Status
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Installation:</span>{' '}
              {(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                ? '✅ Installed as PWA'
                : '⚠️ Running in browser'}
            </p>
            <p>
              <span className="font-medium">Service Worker:</span>{' '}
              {'serviceWorker' in navigator
                ? '✅ Supported'
                : '❌ Not supported'}
            </p>
            <p className="text-gray-500 mt-2">
              Install this app on your device for offline access and faster performance.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
