import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { authService } from './authService';
import type { CognitoUser } from 'amazon-cognito-identity-js';

export function LoginPage() {
  const navigate = useNavigate();
  const { isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [newPasswordChallenge, setNewPasswordChallenge] = useState<{
    cognitoUser: CognitoUser;
    email: string;
  } | null>(null);
  const [newPasswordData, setNewPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const result = await authService.signIn(formData);

      // Check if we got a new password challenge
      if (result && 'challengeName' in result && result.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setNewPasswordChallenge({
          cognitoUser: result.cognitoUser,
          email: result.email,
        });
        return;
      }

      // Normal login success - result is AuthUser (not challenge)
      if (result && 'email' in result && !('challengeName' in result)) {
        // Update auth state manually
        useAuth.getState().setUser(result);
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Error handling
      clearError();
      console.error('Login failed:', error);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    // Validate passwords match
    if (newPasswordData.newPassword !== newPasswordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPasswordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPasswordData.newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPasswordData.newPassword)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPasswordData.newPassword)) {
      setPasswordError('Password must contain at least one number');
      return;
    }

    try {
      const user = await authService.completeNewPasswordChallenge(
        newPasswordChallenge!.cognitoUser,
        newPasswordData.newPassword
      );

      // Update auth state
      useAuth.getState().setUser(user);
      navigate('/dashboard');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to set new password');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (passwordError) setPasswordError(null);
  };

  // If we're in new password challenge mode, show that form instead
  if (newPasswordChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Set New Password
              </h1>
              <p className="text-gray-600 mt-2">
                Please set a permanent password for <strong>{newPasswordChallenge.email}</strong>
              </p>
            </div>

            {/* Error Alert */}
            {passwordError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{passwordError}</p>
              </div>
            )}

            {/* New Password Form */}
            <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={newPasswordData.newPassword}
                  onChange={handleNewPasswordChange}
                  required
                  className="input-field"
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={newPasswordData.confirmPassword}
                  onChange={handleNewPasswordChange}
                  required
                  className="input-field"
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting password...' : 'Set Password'}
              </button>
            </form>

            {/* Security note */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                🔒 Your password will be encrypted and securely stored. You'll be
                automatically logged in after setting your password.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Embark Quoting
            </h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="your.email@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Help text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need access? Contact your administrator.
            </p>
          </div>

          {/* Offline indicator */}
          {!navigator.onLine && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm text-center">
                ⚠️ You're offline. Sign in requires internet connection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
