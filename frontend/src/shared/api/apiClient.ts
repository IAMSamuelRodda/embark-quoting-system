/**
 * API Client for Backend Communication
 *
 * Handles HTTP requests with authentication, error handling, and retry logic
 * Uses Cognito JWT tokens for authentication
 */

import { CognitoUserPool } from 'amazon-cognito-identity-js';

// API Configuration
// TODO: Move to environment variable (VITE_API_URL)
// For now using ECS task public IP (changes on restart - production should use ALB)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.239.96.47:3000';

// Cognito configuration (matches authService.ts)
const poolData = {
  UserPoolId: 'ap-southeast-2_WCrUlLwIE',
  ClientId: '61p5378jhhm40ud2m92m3kv7jv',
};
const userPool = new CognitoUserPool(poolData);

/**
 * Get current JWT token from Cognito
 */
async function getAuthToken(): Promise<string | null> {
  const cognitoUser = userPool.getCurrentUser();
  if (!cognitoUser) return null;

  return new Promise((resolve) => {
    cognitoUser.getSession((err: Error | null, session: any) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }
      const token = session.getIdToken().getJwtToken();
      resolve(token);
    });
  });
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response?: any,
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body, requiresAuth = true } = options;

  // Build full URL
  const url = `${API_BASE_URL}${endpoint}`;

  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = await getAuthToken();
    if (!token) {
      throw new ApiError(401, 'Unauthorized', {
        error: 'No authentication token available',
      });
    }
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Make request
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Parse response
    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, data);
    }

    return data;
  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(0, 'Network Error', {
        error: 'Failed to connect to server',
        originalError: error.message,
      });
    }
    throw error;
  }
}

/**
 * API Client with typed endpoints
 */
export const api = {
  // Quotes
  quotes: {
    getAll: (params?: { status?: string; limit?: number; offset?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return apiRequest<any[]>(`/api/quotes${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => {
      return apiRequest<any>(`/api/quotes/${id}`);
    },

    create: (data: any) => {
      return apiRequest<any>(`/api/quotes`, {
        method: 'POST',
        body: data,
      });
    },

    update: (id: string, data: any) => {
      return apiRequest<any>(`/api/quotes/${id}`, {
        method: 'PUT',
        body: data,
      });
    },

    delete: (id: string) => {
      return apiRequest<any>(`/api/quotes/${id}`, {
        method: 'DELETE',
      });
    },

    search: (query: string) => {
      return apiRequest<any[]>(`/api/quotes/search?q=${encodeURIComponent(query)}`);
    },
  },

  // Jobs
  jobs: {
    create: (quoteId: string, data: any) => {
      return apiRequest<any>(`/api/quotes/${quoteId}/jobs`, {
        method: 'POST',
        body: data,
      });
    },
  },

  // Financials
  financials: {
    upsert: (quoteId: string, data: any) => {
      return apiRequest<any>(`/api/quotes/${quoteId}/financials`, {
        method: 'PUT',
        body: data,
      });
    },
  },
};
