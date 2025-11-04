import { create } from 'zustand';
import { authService, type SignInData, type SignUpData, type AuthUser } from './authService';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Start with true to prevent flash of wrong route
  error: null,
  isAuthenticated: false,

  signIn: async (data: SignInData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signIn(data);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign in',
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
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign out',
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
    } catch (error: any) {
      set({
        error: error.message || 'Failed to confirm sign up',
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
    } catch (error: any) {
      set({
        error: error.message || 'Failed to resend code',
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
    } catch (error: any) {
      set({
        error: error.message || 'Failed to send reset code',
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
    } catch (error: any) {
      set({
        error: error.message || 'Failed to reset password',
        isLoading: false,
      });
      throw error;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error: any) {
      // No user authenticated is not an error - just set state to unauthenticated
      set({
        user: null,
        isAuthenticated: false,
        error: null, // Don't show error for missing auth
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: AuthUser) => set({ user, isAuthenticated: true, isLoading: false }),
}));
