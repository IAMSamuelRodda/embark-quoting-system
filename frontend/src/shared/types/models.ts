/**
 * Data Models for Embark Quoting System
 *
 * TypeScript interfaces matching the PostgreSQL schema from BLUEPRINT.yaml
 * Used for both local IndexedDB storage and API communication
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const QuoteStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SENT: 'sent',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
} as const;

export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const JobType = {
  RETAINING_WALL: 'retaining_wall',
  DRIVEWAY: 'driveway',
  TRENCHING: 'trenching',
  STORMWATER: 'stormwater',
  SITE_PREP: 'site_prep',
} as const;

export type JobType = (typeof JobType)[keyof typeof JobType];

export const UserRole = {
  ADMIN: 'admin',
  FIELD_WORKER: 'field_worker',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  ERROR: 'error',
  CONFLICT: 'conflict',
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

export const SyncOperation = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type SyncOperation = (typeof SyncOperation)[keyof typeof SyncOperation];

// ============================================================================
// BASE TYPES
// ============================================================================

export interface Location {
  suburb?: string;
  postcode?: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
}

export interface ProfitFirst {
  profit_percentage: number;
  owner_percentage: number;
  tax_percentage: number;
  opex_percentage: number;
}

export interface Deposit {
  percentage: number;
  amount: number;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface User {
  id: string; // UUID
  cognito_id: string;
  email: string;
  name: string;
  role: UserRole;
  preferences?: Record<string, unknown>;
  created_at: Date;
}

export interface Quote {
  id: string; // UUID
  quote_number: string; // e.g., "EE-2025-0001"
  version: number;
  versionVector?: Record<string, number>; // Epic 5: Version vector for conflict detection
  status: QuoteStatus;
  user_id: string; // UUID
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  location?: Location;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;

  // Offline-first fields (not in PostgreSQL)
  sync_status?: SyncStatus;
  last_synced_at?: Date;
  device_id?: string;
}

export interface Job {
  id: string; // UUID
  quote_id: string; // UUID
  job_type: JobType;
  order_index: number;
  parameters: Record<string, unknown>; // Job-specific parameters
  materials?: Material[];
  labour?: Labour;
  calculations?: Record<string, unknown>;
  subtotal: number;
}

export interface Material {
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total: number;
}

export interface Labour {
  hours: number;
  rate_per_hour: number;
  total: number;
}

export interface Financial {
  quote_id: string; // UUID (PK)
  direct_cost: number;
  overhead_multiplier: number;
  profit_first: ProfitFirst;
  gst_rate: number;
  gst_amount: number;
  total_inc_gst: number;
  rounded_total: number;
  deposit?: Deposit;
}

export interface PriceSheet {
  id: string; // UUID
  version: number;
  created_by: string; // UUID
  defaults: Record<string, unknown>;
  created_at: Date;
}

export interface PriceItem {
  id: string; // UUID
  price_sheet_id: string; // UUID
  name: string;
  price: number;
  unit: string;
  last_checked: Date;
  notes?: string;
}

export interface QuoteVersion {
  id: string; // UUID
  quote_id: string; // UUID
  version: number;
  versionVector: Record<string, number>; // Epic 5: Version vector for conflict detection
  data: Record<string, unknown>;
  user_id: string; // UUID
  device_id: string;
  created_at: Date;
}

export interface SyncLog {
  id: string; // UUID
  device_id: string;
  quote_id?: string; // UUID
  operation: SyncOperation;
  status: SyncStatus;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// ============================================================================
// COMPOSITE TYPES (with relations)
// ============================================================================

/**
 * Full quote with all related data (jobs, financials)
 * Used when displaying complete quote details
 */
export interface QuoteWithDetails extends Quote {
  jobs: Job[];
  financials?: Financial;
}

/**
 * Quote list item (lightweight for listings)
 */
export interface QuoteListItem {
  id: string;
  quote_number: string;
  customer_name: string;
  status: QuoteStatus;
  total_inc_gst?: number;
  created_at: Date;
  updated_at: Date;
  sync_status?: SyncStatus;
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Customer information form data
 */
export interface CustomerFormData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  suburb?: string;
  postcode?: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Job-specific parameter types
 */
export interface RetainingWallParams {
  bays: number;
  height: number; // 200-1000mm
  length: number; // meters
  ag_pipe: boolean;
  orange_plastic: boolean;
}

export interface DrivewayParams {
  length: number; // meters
  width: number; // meters
  base_thickness: number; // mm, default 200
  topping_enabled: boolean;
  topping_thickness?: number; // mm, default 100
  topping_type?: string; // default "20mm gravel"
}

export interface TrenchingParams {
  length: number; // meters
  width: number; // 300/600/900mm
  depth: number; // meters
  for_stormwater: boolean;
}

export interface StormwaterParams {
  pipe_length: number; // meters
  pipe_type: string;
  t_joints: number;
  elbows: number;
  downpipe_adaptors: number;
}

export interface SitePrepParams {
  area: number; // m²
  depth: number; // meters
  backfill_type: 'road_base' | 'paving_sand';
  dumping_required: boolean;
  dumping_distance?: number; // km
  supply_distance: number; // km
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Sync queue item (for offline changes)
 */
export interface SyncQueueItem {
  id: string;
  quote_id: string;
  operation: SyncOperation;
  data: Partial<Quote | Job | Financial>;
  timestamp: Date;
  retry_count: number;
}

/**
 * Change log item (for conflict detection)
 */
export interface ChangeLogItem {
  id: string;
  quote_id: string;
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  user_id: string;
  device_id: string;
  timestamp: Date;
}
