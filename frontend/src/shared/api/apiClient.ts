/**
 * API Client for Backend Communication
 *
 * Handles HTTP requests with authentication, error handling, and retry logic
 * Uses Cognito JWT tokens for authentication
 */

import { CognitoUserPool } from 'amazon-cognito-identity-js';
import type { Quote, Job, Financial } from '../types/models';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Dev auth bypass mode - skip Cognito when VITE_DEV_AUTH_BYPASS is true
const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

// Cognito configuration (must match authService.ts - use environment variables)
const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};
// Lazy initialization to allow tests to mock before instantiation
let userPool: CognitoUserPool | null = null;
function getUserPool(): CognitoUserPool {
  if (!userPool) {
    userPool = new CognitoUserPool(poolData);
  }
  return userPool;
}

/**
 * Get current JWT token from Cognito (or bypass in dev mode)
 */
async function getAuthToken(): Promise<string | null> {
  // Dev mode bypass - return a dummy token that backend will accept
  if (DEV_AUTH_BYPASS) {
    console.log('⚠️  DEV_AUTH_BYPASS enabled - using dev token');
    return 'dev-bypass-token';
  }

  const cognitoUser = getUserPool().getCurrentUser();
  if (!cognitoUser) return null;

  return new Promise((resolve) => {
    cognitoUser.getSession((err: Error | null, session: unknown) => {
      if (err || !session || typeof session !== 'object') {
        resolve(null);
        return;
      }
      // Type assertion after null check
      const validSession = session as {
        isValid: () => boolean;
        getAccessToken: () => { getJwtToken: () => string };
      };
      if (!validSession.isValid()) {
        resolve(null);
        return;
      }
      const token = validSession.getAccessToken().getJwtToken();
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
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
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
 * Generic HTTP methods for legacy compatibility
 * These return ApiResponse<T> to match the signature expected by useJobs
 */
const httpMethods = {
  get: <T = unknown>(url: string): Promise<ApiResponse<T>> => apiRequest<T>(url),
  post: <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    apiRequest<T>(url, { method: 'POST', body: data }),
  put: <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    apiRequest<T>(url, { method: 'PUT', body: data }),
  delete: <T = unknown>(url: string): Promise<ApiResponse<T>> =>
    apiRequest<T>(url, { method: 'DELETE' }),
  patch: <T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> =>
    apiRequest<T>(url, { method: 'PATCH', body: data }),
};

/**
 * API Client with typed endpoints
 */
export const api = {
  ...httpMethods,
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
    getByQuoteId: (quoteId: string) => {
      return apiRequest<Job[]>(`/api/quotes/${quoteId}/jobs`);
    },

    create: (quoteId: string, data: Partial<Job>) => {
      return apiRequest<Job>(`/api/quotes/${quoteId}/jobs`, {
        method: 'POST',
        body: data,
      });
    },

    update: (jobId: string, data: Partial<Job>) => {
      return apiRequest<Job>(`/api/jobs/${jobId}`, {
        method: 'PUT',
        body: data,
      });
    },

    delete: (jobId: string) => {
      return apiRequest<{ success: boolean }>(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
    },

    reorder: (quoteId: string, jobOrders: { id: string; order_index: number }[]) => {
      return apiRequest<Job[]>(`/api/quotes/${quoteId}/jobs/reorder`, {
        method: 'POST',
        body: jobOrders,
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

// Export as default for compatibility with existing imports
export default api;
