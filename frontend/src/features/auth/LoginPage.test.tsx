/**
 * Sample Unit Tests for Login Page
 *
 * Demonstrates Vitest test framework with React Testing Library
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

// Mock the auth hooks and services
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock('./authService', () => ({
  authService: {
    signIn: vi.fn(),
  },
}));

describe('LoginPage Component', () => {
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );
  };

  it('should render login form', () => {
    renderLoginPage();

    // Check for form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
    expect(submitButton).toBeDefined();
  });

  it('should have email and password input fields', () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput.getAttribute('type')).toBe('email');
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('should render need access message', () => {
    renderLoginPage();

    const accessMessage = screen.getByText(/need access/i);
    expect(accessMessage).toBeDefined();
  });
});
