/**
 * Settings State Management - Design System v2.0
 *
 * Zustand store for managing user settings, preferences, and admin user CRUD.
 * Follows the vertical slice architecture pattern.
 */

import { create } from 'zustand';
import {
  settingsService,
  type ProfileData,
  type PreferencesData,
  type PasswordChangeData,
  type User,
  type CreateUserData,
  type UpdateUserData,
} from './settingsService';

interface SettingsState {
  // Profile state
  profile: ProfileData | null;
  isLoadingProfile: boolean;
  profileError: string | null;

  // Preferences state
  preferences: PreferencesData | null;
  isLoadingPreferences: boolean;
  preferencesError: string | null;

  // Password state
  isChangingPassword: boolean;
  passwordError: string | null;

  // Users state (admin)
  users: User[];
  isLoadingUsers: boolean;
  usersError: string | null;

  // Actions - Profile
  updateProfile: (data: ProfileData) => Promise<void>;

  // Actions - Preferences
  loadPreferences: () => Promise<void>;
  updatePreferences: (data: PreferencesData) => Promise<void>;

  // Actions - Password
  changePassword: (data: PasswordChangeData) => Promise<void>;

  // Actions - Users (admin)
  loadUsers: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<User>;
  updateUser: (data: UpdateUserData) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;

  // Actions - Error handling
  clearProfileError: () => void;
  clearPreferencesError: () => void;
  clearPasswordError: () => void;
  clearUsersError: () => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  // Initial state - Profile
  profile: null,
  isLoadingProfile: false,
  profileError: null,

  // Initial state - Preferences
  preferences: null,
  isLoadingPreferences: false,
  preferencesError: null,

  // Initial state - Password
  isChangingPassword: false,
  passwordError: null,

  // Initial state - Users
  users: [],
  isLoadingUsers: false,
  usersError: null,

  // Profile actions
  updateProfile: async (data: ProfileData) => {
    set({ isLoadingProfile: true, profileError: null });
    try {
      const updatedProfile = await settingsService.updateProfile(data);
      set({
        profile: updatedProfile,
        isLoadingProfile: false,
        profileError: null,
      });
    } catch (error) {
      set({
        profileError: error instanceof Error ? error.message : 'Failed to update profile',
        isLoadingProfile: false,
      });
      throw error;
    }
  },

  // Preferences actions
  loadPreferences: async () => {
    set({ isLoadingPreferences: true, preferencesError: null });
    try {
      const preferences = await settingsService.getPreferences();
      set({
        preferences,
        isLoadingPreferences: false,
        preferencesError: null,
      });
    } catch (error) {
      set({
        preferencesError: error instanceof Error ? error.message : 'Failed to load preferences',
        isLoadingPreferences: false,
      });
      throw error;
    }
  },

  updatePreferences: async (data: PreferencesData) => {
    set({ isLoadingPreferences: true, preferencesError: null });
    try {
      const updatedPreferences = await settingsService.updatePreferences(data);
      set({
        preferences: updatedPreferences,
        isLoadingPreferences: false,
        preferencesError: null,
      });
    } catch (error) {
      set({
        preferencesError: error instanceof Error ? error.message : 'Failed to update preferences',
        isLoadingPreferences: false,
      });
      throw error;
    }
  },

  // Password actions
  changePassword: async (data: PasswordChangeData) => {
    set({ isChangingPassword: true, passwordError: null });
    try {
      await settingsService.changePassword(data);
      set({
        isChangingPassword: false,
        passwordError: null,
      });
    } catch (error) {
      set({
        passwordError: error instanceof Error ? error.message : 'Failed to change password',
        isChangingPassword: false,
      });
      throw error;
    }
  },

  // Users actions (admin)
  loadUsers: async () => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      const users = await settingsService.getUsers();
      set({
        users,
        isLoadingUsers: false,
        usersError: null,
      });
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Failed to load users',
        isLoadingUsers: false,
      });
      throw error;
    }
  },

  createUser: async (data: CreateUserData) => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      const newUser = await settingsService.createUser(data);
      const currentUsers = get().users;
      set({
        users: [...currentUsers, newUser],
        isLoadingUsers: false,
        usersError: null,
      });
      return newUser;
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Failed to create user',
        isLoadingUsers: false,
      });
      throw error;
    }
  },

  updateUser: async (data: UpdateUserData) => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      const updatedUser = await settingsService.updateUser(data);
      const currentUsers = get().users;
      set({
        users: currentUsers.map((u) => (u.id === data.id ? updatedUser : u)),
        isLoadingUsers: false,
        usersError: null,
      });
      return updatedUser;
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Failed to update user',
        isLoadingUsers: false,
      });
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    set({ isLoadingUsers: true, usersError: null });
    try {
      await settingsService.deleteUser(userId);
      const currentUsers = get().users;
      set({
        users: currentUsers.filter((u) => u.id !== userId),
        isLoadingUsers: false,
        usersError: null,
      });
    } catch (error) {
      set({
        usersError: error instanceof Error ? error.message : 'Failed to delete user',
        isLoadingUsers: false,
      });
      throw error;
    }
  },

  // Error handling
  clearProfileError: () => set({ profileError: null }),
  clearPreferencesError: () => set({ preferencesError: null }),
  clearPasswordError: () => set({ passwordError: null }),
  clearUsersError: () => set({ usersError: null }),
}));
