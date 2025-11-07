/**
 * Settings Service - Design System v2.0
 *
 * Business logic for user settings, preferences, and admin user management.
 * In a real application, this would make API calls to the backend.
 * For now, it provides mock implementations.
 */

export interface ProfileData {
  name: string;
  email: string;
}

export interface PreferencesData {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  defaultDeposit: '10' | '20' | '30' | '50';
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface UpdateUserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

class SettingsService {
  /**
   * Update user profile
   */
  async updateProfile(data: ProfileData): Promise<ProfileData> {
    // Mock API call
    await this.delay(500);

    // Validation
    if (!data.name.trim()) {
      throw new Error('Name is required');
    }
    if (!data.email.trim() || !data.email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    // Mock success
    return data;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(data: PreferencesData): Promise<PreferencesData> {
    // Mock API call
    await this.delay(500);

    // Store in localStorage for persistence
    localStorage.setItem('userPreferences', JSON.stringify(data));

    return data;
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<PreferencesData> {
    // Mock API call
    await this.delay(300);

    // Load from localStorage
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      return JSON.parse(stored);
    }

    // Default preferences
    return {
      theme: 'system',
      emailNotifications: true,
      defaultDeposit: '20',
    };
  }

  /**
   * Change password
   */
  async changePassword(data: PasswordChangeData): Promise<void> {
    // Mock API call
    await this.delay(800);

    // Validation
    if (!data.currentPassword) {
      throw new Error('Current password is required');
    }
    if (!data.newPassword || data.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Mock verification of current password
    // In real app, backend would verify this
    const isCurrentPasswordValid = true; // Mock
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Mock success
    return;
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(): Promise<User[]> {
    // Mock API call
    await this.delay(500);

    // Load from localStorage or return mock data
    const stored = localStorage.getItem('users');
    if (stored) {
      return JSON.parse(stored);
    }

    // Default users
    const defaultUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user',
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
    ];

    localStorage.setItem('users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(data: CreateUserData): Promise<User> {
    // Mock API call
    await this.delay(600);

    // Validation
    if (!data.name.trim() || !data.email.trim() || !data.password.trim()) {
      throw new Error('All fields are required');
    }
    if (!data.email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check for duplicate email
    const users = await this.getUsers();
    const existingUser = users.find((u) => u.email === data.email);
    if (existingUser) {
      throw new Error('A user with this email address already exists');
    }

    // Create new user
    const newUser: User = {
      id: String(Date.now()),
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const updatedUsers = [...users, newUser];
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    return newUser;
  }

  /**
   * Update an existing user (admin only)
   */
  async updateUser(data: UpdateUserData): Promise<User> {
    // Mock API call
    await this.delay(600);

    // Validation
    if (!data.name.trim() || !data.email.trim()) {
      throw new Error('Name and email are required');
    }
    if (!data.email.includes('@')) {
      throw new Error('Valid email address is required');
    }

    // Get users
    const users = await this.getUsers();
    const userIndex = users.findIndex((u) => u.id === data.id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Check for duplicate email (excluding current user)
    const duplicateUser = users.find((u) => u.email === data.email && u.id !== data.id);
    if (duplicateUser) {
      throw new Error('A user with this email address already exists');
    }

    // Update user
    const updatedUser: User = {
      ...users[userIndex],
      name: data.name,
      email: data.email,
      role: data.role,
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;
    localStorage.setItem('users', JSON.stringify(users));

    return updatedUser;
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    // Mock API call
    await this.delay(500);

    // Get users
    const users = await this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Remove user
    const updatedUsers = users.filter((u) => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  }

  /**
   * Mock delay for API simulation
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const settingsService = new SettingsService();
