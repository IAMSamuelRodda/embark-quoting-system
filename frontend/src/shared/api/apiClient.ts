/**
 * API Client for Backend Communication
 *
 * Handles HTTP requests with authentication, error handling, and retry logic
 * Uses Cognito JWT tokens for authentication
 */

import { CognitoUserPool } from 'amazon-cognito-identity-js';
import type { Quote, Job, Financial } from '../types/models';

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
    cognitoUser.getSession((err: Error | null, session: unknown) => {
      if (err || !session || typeof session !== 'object') {
        resolve(null);
        return;
      }
      // Type assertion after null check
      const validSession = session as { isValid: () => boolean; getIdToken: () => { getJwtToken: () => string } };
      if (!validSession.isValid()) {
        resolve(null);
        return;
      }
      const token = validSession.getIdToken().getJwtToken();
      resolve(token);
    });
  });
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public response?: unknown;

  constructor(status: number, statusText: string, response?: unknown) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  requiresAuth?: boolean;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = unknown>(
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
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return apiRequest<Quote[]>(`/api/quotes${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => {
      return apiRequest<Quote>(`/api/quotes/${id}`);
    },

    create: (data: Partial<Quote>) => {
      return apiRequest<Quote>(`/api/quotes`, {
        method: 'POST',
        body: data,
      });
    },

    update: (id: string, data: Partial<Quote>) => {
      return apiRequest<Quote>(`/api/quotes/${id}`, {
        method: 'PUT',
        body: data,
      });
    },

    delete: (id: string) => {
      return apiRequest<{ success: boolean }>(`/api/quotes/${id}`, {
        method: 'DELETE',
      });
    },

    search: (query: string) => {
      return apiRequest<Quote[]>(`/api/quotes/search?q=${encodeURIComponent(query)}`);
    },
  },

  // Jobs
  jobs: {
    create: (quoteId: string, data: Partial<Job>) => {
      return apiRequest<Job>(`/api/quotes/${quoteId}/jobs`, {
        method: 'POST',
        body: data,
      });
    },
  },

  // Financials
  financials: {
    upsert: (quoteId: string, data: Partial<Financial>) => {
      return apiRequest<Financial>(`/api/quotes/${quoteId}/financials`, {
        method: 'PUT',
        body: data,
      });
    },
  },
};
