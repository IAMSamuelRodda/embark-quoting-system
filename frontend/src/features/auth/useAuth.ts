import { create } from 'zustand';
import { authService, type SignInData, type SignUpData, type AuthUser } from './authService';
import {
  storeCredentials,
  getStoredCredentials,
  clearStoredCredentials,
  hasStoredCredentials,
  getDaysUntilExpiry,
} from '../../shared/utils/secureStorage';
import { connectionMonitor } from '../../shared/utils/connection';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isOfflineMode: boolean; // True if authenticated offline
  offlineAuthExpiry: Date | null; // When offline auth expires

  // Actions
  signIn: (data: SignInData & { rememberMe?: boolean }) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
  hasOfflineAuth: () => boolean;
  forceOnlineAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Start with true to prevent flash of wrong route
  error: null,
  isAuthenticated: false,
  isOfflineMode: false,
  offlineAuthExpiry: null,

  signIn: async (data: SignInData & { rememberMe?: boolean }) => {
    set({ isLoading: true, error: null });

    // Check if online
    const isOnline = connectionMonitor.isOnline();

    if (!isOnline) {
      // Offline login - try cached credentials
      console.log('[Auth] Offline detected, attempting offline authentication');

      try {
        const stored = await getStoredCredentials();

        if (!stored) {
          throw new Error('No cached credentials available. Please connect to the internet to log in.');
        }

        // Verify credentials match
        if (stored.username !== data.email || stored.password !== data.password) {
          throw new Error('Invalid credentials');
        }

        // Offline authentication successful
        const expiryDays = getDaysUntilExpiry();
        console.log(`[Auth] Offline authentication successful (expires in ${expiryDays} days)`);

        // Create offline user object
        const offlineUser: AuthUser = {
          email: stored.username,
          role: 'user', // Can't determine role offline
          groups: [], // Can't determine groups offline
        };

        set({
          user: offlineUser,
          isAuthenticated: true,
          isOfflineMode: true,
          offlineAuthExpiry: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null,
          isLoading: false,
        });

        return;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Offline authentication failed',
          isLoading: false,
        });
        throw error;
      }
    }

    // Online login - normal Cognito flow
    try {
      const result = await authService.signIn(data);

      // Check if we got a challenge (new password required)
      if ('challengeName' in result) {
        // Challenge response - don't set user state, let UI handle it
        set({ isLoading: false });
        throw new Error('NEW_PASSWORD_REQUIRED');
      }

      // Normal login success - result is AuthUser
      set({
        user: result,
        isAuthenticated: true,
        isOfflineMode: false,
        offlineAuthExpiry: null,
        isLoading: false,
      });

      // Store credentials if rememberMe is enabled
      if (data.rememberMe) {
        console.log('[Auth] Storing credentials for offline use');
        await storeCredentials({
          username: data.email,
          password: data.password,
          rememberMe: true,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign in',
        isLoading: false,
      });
      throw error;
    }
  },

  signUp: async (data: SignUpData) => {
    set({ isLoading: true, error: null });
    try {
      await authService.signUp(data);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      // Clear stored credentials
      await clearStoredCredentials();
      console.log('[Auth] Cleared stored credentials on sign out');

      // Sign out from Cognito (will fail silently if offline)
      try {
        await authService.signOut();
      } catch {
        console.log('[Auth] Could not sign out from Cognito (offline or error), continuing with local signout');
      }

      set({
        user: null,
        isAuthenticated: false,
        isOfflineMode: false,
        offlineAuthExpiry: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to sign out',
        isLoading: false,
      });
      throw error;
    }
  },

  confirmSignUp: async (email: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.confirmSignUp(email, code);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to confirm sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  resendCode: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resendConfirmationCode(email);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to resend code',
        isLoading: false,
      });
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.forgotPassword(email);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send reset code',
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email, code, newPassword);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset password',
        isLoading: false,
      });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try online authentication first
      const user = await authService.getCurrentUser();
      if (user) {
        set({
          user,
          isAuthenticated: true,
          isOfflineMode: false,
          offlineAuthExpiry: null,
          isLoading: false,
        });
        return;
      }
    } catch {
      // Online auth failed - try offline auth if available
      console.log('[Auth] Online auth check failed, trying offline auth');

      try {
        const stored = await getStoredCredentials();
        if (stored) {
          const expiryDays = getDaysUntilExpiry();
          console.log(`[Auth] Offline credentials found (expires in ${expiryDays} days)`);

          // Create offline user object
          const offlineUser: AuthUser = {
            email: stored.username,
            role: 'user', // Can't determine role offline
            groups: [], // Can't determine groups offline
          };

          set({
            user: offlineUser,
            isAuthenticated: true,
            isOfflineMode: true,
            offlineAuthExpiry: expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null,
            isLoading: false,
          });
          return;
        }
      } catch {
        console.log('[Auth] Offline auth also failed');
      }
    }

    // No authentication available
    set({
      user: null,
      isAuthenticated: false,
      isOfflineMode: false,
      offlineAuthExpiry: null,
      error: null, // Don't show error for missing auth
      isLoading: false,
    });
  },

  clearError: () => set({ error: null }),

  setUser: (user: AuthUser) => set({
    user,
    isAuthenticated: true,
    isOfflineMode: false,
    offlineAuthExpiry: null,
    isLoading: false,
  }),

  hasOfflineAuth: () => hasStoredCredentials(),

  forceOnlineAuth: async () => {
    // Clear cached credentials and force online re-authentication
    await clearStoredCredentials();
    set({
      user: null,
      isAuthenticated: false,
      isOfflineMode: false,
      offlineAuthExpiry: null,
      error: 'Please log in again to verify your credentials',
    });
  },
}));
