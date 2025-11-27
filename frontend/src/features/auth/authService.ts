import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  type ISignUpResult,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';

// Dev auth bypass mode - skip Cognito when VITE_DEV_AUTH_BYPASS is true
const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

// Dev user for bypass mode - matches backend seed-dev.js admin user
const DEV_USER: AuthUser = {
  email: 'admin@embarklandscaping.com.au',
  role: 'admin',
  groups: ['admins'],
};

// Cognito configuration from environment variables (injected at build time)
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'dev-pool',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'dev-client',
};

// Only create user pool if not in dev bypass mode
const userPool = DEV_AUTH_BYPASS ? null : new CognitoUserPool(poolData);

export interface SignUpData {
  email: string;
  password: string;
  role: 'admin' | 'field_worker';
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  role: string;
  groups: string[];
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<ISignUpResult> {
    // Dev bypass mode - sign up is disabled
    if (DEV_AUTH_BYPASS) {
      console.log('⚠️  DEV_AUTH_BYPASS enabled - sign up disabled in dev mode');
      throw new Error('Sign up disabled in dev mode');
    }

    if (!userPool) {
      throw new Error('Cognito not configured');
    }

    const { email, password, role } = data;

    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
      new CognitoUserAttribute({
        Name: 'custom:role',
        Value: role,
      }),
    ];

    return new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result) {
          reject(new Error('Sign up failed'));
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * Confirm user email with verification code
   */
  async confirmSignUp(email: string, code: string): Promise<string> {
    if (DEV_AUTH_BYPASS || !userPool) {
      throw new Error('Not available in dev mode');
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * Sign in with email and password
   */
  async signIn(
    data: SignInData,
  ): Promise<
    AuthUser | { challengeName: 'NEW_PASSWORD_REQUIRED'; cognitoUser: CognitoUser; email: string }
  > {
    // Dev bypass mode - return dev user immediately
    if (DEV_AUTH_BYPASS) {
      console.log('⚠️  DEV_AUTH_BYPASS enabled - auto-signing in as dev user');
      return DEV_USER;
    }

    if (!userPool) {
      throw new Error('Cognito not configured');
    }

    const { email, password } = data;

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken();
          const payload = idToken.payload;

          const user: AuthUser = {
            email: payload.email || email,
            role: payload['custom:role'] || 'field_worker',
            groups: payload['cognito:groups'] || [],
          };

          resolve(user);
        },
        onFailure: (err) => {
          reject(err);
        },
        newPasswordRequired: () => {
          // Return challenge information so UI can prompt for new password
          resolve({
            challengeName: 'NEW_PASSWORD_REQUIRED',
            cognitoUser,
            email,
          });
        },
      });
    });
  }

  /**
   * Complete new password challenge
   */
  async completeNewPasswordChallenge(
    cognitoUser: CognitoUser,
    newPassword: string,
  ): Promise<AuthUser> {
    if (DEV_AUTH_BYPASS) {
      return DEV_USER;
    }

    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(
        newPassword,
        {},
        {
          onSuccess: (result) => {
            const idToken = result.getIdToken();
            const payload = idToken.payload;

            const user: AuthUser = {
              email: payload.email || '',
              role: payload['custom:role'] || 'field_worker',
              groups: payload['cognito:groups'] || [],
            };

            resolve(user);
          },
          onFailure: (err) => {
            reject(err);
          },
        },
      );
    });
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    // Dev bypass mode - nothing to sign out
    if (DEV_AUTH_BYPASS) {
      console.log('⚠️  DEV_AUTH_BYPASS enabled - sign out is a no-op');
      return;
    }

    if (!userPool) return;
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    // Dev bypass mode - always return dev user
    if (DEV_AUTH_BYPASS) {
      return DEV_USER;
    }

    if (!userPool) return null;
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      return null;
    }

    return new Promise((resolve) => {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session || !session.isValid()) {
          // No valid session - return null instead of rejecting
          resolve(null);
          return;
        }

        cognitoUser.getUserAttributes((err) => {
          if (err) {
            // Error getting attributes - return null instead of rejecting
            resolve(null);
            return;
          }

          const idToken = session.getIdToken();
          const payload = idToken.payload;

          const user: AuthUser = {
            email: payload.email || '',
            role: payload['custom:role'] || 'field_worker',
            groups: payload['cognito:groups'] || [],
          };

          resolve(user);
        });
      });
    });
  }

  /**
   * Resend verification code
   */
  async resendConfirmationCode(email: string): Promise<string> {
    if (DEV_AUTH_BYPASS || !userPool) {
      throw new Error('Not available in dev mode');
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * Forgot password - send reset code
   */
  async forgotPassword(email: string): Promise<void> {
    if (DEV_AUTH_BYPASS || !userPool) {
      throw new Error('Not available in dev mode');
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.forgotPassword({
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  /**
   * Reset password with code
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<string> {
    if (DEV_AUTH_BYPASS || !userPool) {
      throw new Error('Not available in dev mode');
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    return new Promise((resolve, reject) => {
      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve('Password reset successful');
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }
}

export const authService = new AuthService();
