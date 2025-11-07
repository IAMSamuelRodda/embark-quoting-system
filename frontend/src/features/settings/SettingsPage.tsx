/**
 * Settings Page - Design System v2.0
 *
 * User preferences, profile management, and admin user CRUD functionality
 * styled per Industrial Clarity design philosophy.
 *
 * Features:
 * - Tab navigation (Profile, Preferences, Password, Admin)
 * - Responsive layout with 8px spatial rhythm
 * - Uses design system components (Button, Input, Select, Modal, Toast)
 * - "Helpful, Not Punitive" error messages
 *
 * Tabs:
 * - Profile: Name, email editing
 * - Preferences: Theme, notifications, default deposit %
 * - Password: Change password with validation
 * - Admin: User CRUD (admin role only)
 */

import React, { useState } from 'react';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { Modal } from '../../shared/components/Modal';
import { Toast } from '../../shared/components/Toast';
import './SettingsPage.css';

type TabName = 'profile' | 'preferences' | 'password' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export const SettingsPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabName>('profile');

  // Profile state
  const [profileName, setProfileName] = useState('John Doe');
  const [profileEmail, setProfileEmail] = useState('john.doe@example.com');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Preferences state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [defaultDeposit, setDefaultDeposit] = useState<'10' | '20' | '30' | '50'>('20');
  const [prefsSuccess, setPrefsSuccess] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(
    null,
  );

  // Admin state
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'admin' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'user' },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Current user (mock - would come from auth context in real app)
  const currentUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
  };

  // Profile handlers
  const handleProfileSave = () => {
    // Validation
    if (!profileName.trim()) {
      setProfileError('Name is required');
      return;
    }
    if (!profileEmail.trim()) {
      setProfileError('Email is required');
      return;
    }
    if (!profileEmail.includes('@')) {
      setProfileError('Email address must include @ symbol');
      return;
    }

    // Save profile (mock - would call API in real app)
    setProfileError('');
    setProfileSuccess('Profile updated successfully');
    showToastMessage('Profile updated successfully', 'success');
    setTimeout(() => setProfileSuccess(''), 3000);
  };

  // Preferences handlers
  const handlePreferencesSave = () => {
    // Save preferences (mock - would call API in real app)
    setPrefsSuccess('Preferences saved successfully');
    showToastMessage('Preferences saved successfully', 'success');
    setTimeout(() => setPrefsSuccess(''), 3000);
  };

  // Password handlers
  const calculatePasswordStrength = (password: string) => {
    if (password.length === 0) return null;
    if (password.length < 8) return 'weak';
    if (password.length < 12) return 'medium';
    return 'strong';
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handlePasswordChange = () => {
    // Validation
    if (!currentPassword.trim()) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Change password (mock - would call API in real app)
    setPasswordError('');
    setPasswordSuccess('Password changed successfully');
    showToastMessage('Password changed successfully', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStrength(null);
    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  // Admin handlers
  const handleCreateUser = () => {
    // Validation
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      showToastMessage('All fields are required', 'error');
      return;
    }
    if (!newUserEmail.includes('@')) {
      showToastMessage('Email address must include @ symbol', 'error');
      return;
    }

    // Create user (mock - would call API in real app)
    const newUser: User = {
      id: String(users.length + 1),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
    };
    setUsers([...users, newUser]);
    setShowCreateModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
    showToastMessage(`User ${newUser.name} created successfully`, 'success');
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    // Update user (mock - would call API in real app)
    setUsers(users.map((u) => (u.id === selectedUser.id ? selectedUser : u)));
    setShowEditModal(false);
    setSelectedUser(null);
    showToastMessage('User updated successfully', 'success');
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    // Delete user (mock - would call API in real app)
    setUsers(users.filter((u) => u.id !== selectedUser.id));
    setShowDeleteModal(false);
    showToastMessage(`User ${selectedUser.name} deleted successfully`, 'success');
    setSelectedUser(null);
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        {/* Tab Navigation */}
        <div className="settings-tabs" role="tablist">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'settings-tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'preferences' ? 'settings-tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'preferences'}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`settings-tab ${activeTab === 'password' ? 'settings-tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'password'}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          {currentUser.role === 'admin' && (
            <button
              className={`settings-tab ${activeTab === 'admin' ? 'settings-tab--active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'admin'}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="settings-section" role="tabpanel">
              <h2 className="settings-section__title">Profile Information</h2>
              <p className="settings-section__description">
                Update your personal information and email address
              </p>

              <div className="settings-form">
                <Input
                  label="Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  fullWidth
                  error={profileError && !profileName.trim() ? 'Name is required' : ''}
                />

                <Input
                  label="Email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  required
                  fullWidth
                  error={
                    profileError && !profileEmail.includes('@')
                      ? 'Email address must include @ symbol'
                      : ''
                  }
                />

                {profileSuccess && (
                  <p className="settings-success" role="status">
                    ✓ {profileSuccess}
                  </p>
                )}

                <Button onClick={handleProfileSave} variant="primary">
                  Save Profile
                </Button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="settings-section" role="tabpanel">
              <h2 className="settings-section__title">Preferences</h2>
              <p className="settings-section__description">
                Customize your application experience and default settings
              </p>

              <div className="settings-form">
                <Select
                  label="Theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  fullWidth
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System (Auto)</option>
                </Select>

                <div className="settings-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <span>Enable email notifications</span>
                  </label>
                </div>

                <Select
                  label="Default Deposit Percentage"
                  value={defaultDeposit}
                  onChange={(e) => setDefaultDeposit(e.target.value as '10' | '20' | '30' | '50')}
                  fullWidth
                  helperText="Default deposit percentage for new quotes"
                >
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                  <option value="50">50%</option>
                </Select>

                {prefsSuccess && (
                  <p className="settings-success" role="status">
                    ✓ {prefsSuccess}
                  </p>
                )}

                <Button onClick={handlePreferencesSave} variant="primary">
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="settings-section" role="tabpanel">
              <h2 className="settings-section__title">Change Password</h2>
              <p className="settings-section__description">
                Update your password to keep your account secure
              </p>

              <div className="settings-form">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  fullWidth
                />

                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  required
                  fullWidth
                  helperText="Password must be at least 8 characters"
                />

                {passwordStrength && (
                  <div className={`password-strength password-strength--${passwordStrength}`}>
                    <div className="password-strength__bar" />
                    <span className="password-strength__label">
                      Password strength: {passwordStrength}
                    </span>
                  </div>
                )}

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                  error={
                    confirmPassword && newPassword !== confirmPassword
                      ? 'New passwords do not match'
                      : ''
                  }
                />

                {passwordError && (
                  <p className="settings-error" role="alert">
                    ⚠ {passwordError}
                  </p>
                )}

                {passwordSuccess && (
                  <p className="settings-success" role="status">
                    ✓ {passwordSuccess}
                  </p>
                )}

                <Button onClick={handlePasswordChange} variant="primary">
                  Change Password
                </Button>
              </div>
            </div>
          )}

          {/* Admin Tab */}
          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <div className="settings-section" role="tabpanel">
              <div className="settings-section__header">
                <div>
                  <h2 className="settings-section__title">User Management</h2>
                  <p className="settings-section__description">
                    Create, edit, and delete user accounts
                  </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} variant="primary">
                  Create User
                </Button>
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-badge--${user.role}`}>{user.role}</span>
                        </td>
                        <td className="users-table__actions">
                          <button
                            className="action-button"
                            onClick={() => {
                              setSelectedUser({ ...user });
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="action-button action-button--danger"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            disabled={user.id === currentUser.id}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="medium"
      >
        <div className="modal-form">
          <Input
            label="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            required
            fullWidth
          />

          <Input
            label="Email"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            required
            fullWidth
          />

          <Input
            label="Password"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            required
            fullWidth
            helperText="Password must be at least 8 characters"
          />

          <Select
            label="Role"
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
            fullWidth
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>

          <div className="modal-actions">
            <Button onClick={() => setShowCreateModal(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleCreateUser} variant="primary">
              Create User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="medium"
      >
        {selectedUser && (
          <div className="modal-form">
            <Input
              label="Name"
              value={selectedUser.name}
              onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
              required
              fullWidth
            />

            <Input
              label="Email"
              type="email"
              value={selectedUser.email}
              onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              required
              fullWidth
            />

            <Select
              label="Role"
              value={selectedUser.role}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  role: e.target.value as 'admin' | 'user',
                })
              }
              fullWidth
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>

            <div className="modal-actions">
              <Button onClick={() => setShowEditModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleEditUser} variant="primary">
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        size="small"
      >
        {selectedUser && (
          <div className="modal-content">
            <p className="warning-message">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action
              cannot be undone.
            </p>

            <div className="modal-actions">
              <Button onClick={() => setShowDeleteModal(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleDeleteUser} variant="primary">
                Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}
    </div>
  );
};

export default SettingsPage;
