import { useAuth } from '../features/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { QuoteList } from '../features/quotes/QuoteList';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
              <h1 className="text-2xl font-bold text-gray-900">
                Embark Quoting System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user?.email} ({user?.role})
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Online/Offline Indicator */}
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {navigator.onLine ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-secondary"
              >
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
