🏗️ Embark Estimator - Complete Architecture Plan
Executive Summary
Project: Offline-first PWA quoting application for Embark Landscaping & Earthworks
 Goal: Mobile-first, fast, secure, AI-ready estimator with automatic cloud sync
 Timeline Estimate: 8-12 weeks (depending on developer experience)
 Total Chunks: 12 manageable development phases

🎯 System Architecture Overview
High-Level Architecture
┌─────────────────────────────────────────────────────────┐
│                    USER DEVICES                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           React PWA Application                   │  │
│  │  ┌────────────┐  ┌──────────────┐               │  │
│  │  │   UI Layer │  │  State Mgmt  │               │  │
│  │  │  (React)   │  │   (Redux)    │               │  │
│  │  └─────┬──────┘  └──────┬───────┘               │  │
│  │        │                 │                        │  │
│  │  ┌─────▼─────────────────▼──────┐                │  │
│  │  │    Local Data Layer           │                │  │
│  │  │  ┌──────────┐  ┌───────────┐ │                │  │
│  │  │  │IndexedDB │  │Sync Queue │ │                │  │
│  │  │  │(Dexie.js)│  │  Manager  │ │                │  │
│  │  │  └──────────┘  └───────────┘ │                │  │
│  │  └───────────────┬────────────────┘               │  │
│  └────────────────┬─┴──────────────────────────────┘  │
└────────────────────┼────────────────────────────────────┘
                     │ HTTPS (TLS 1.3)
                     │ JWT Auth
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   AWS CLOUD LAYER                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │         API Gateway (REST + WebSocket)            │  │
│  └───────────────────┬──────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────▼──────────────────────────────┐  │
│  │          AWS Lambda Functions                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐           │  │
│  │  │  Auth   │ │  Sync   │ │   AI     │           │  │
│  │  │ Handler │ │ Engine  │ │ Gateway  │           │  │
│  │  └─────────┘ └─────────┘ └──────────┘           │  │
│  └───────────────────┬──────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────▼──────────────────────────────┐  │
│  │           Data & Auth Services                    │  │
│  │  ┌───────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │ DynamoDB  │  │ Cognito  │  │    S3    │      │  │
│  │  │ (NoSQL)   │  │  (Auth)  │  │ (Backup) │      │  │
│  │  └───────────┘  └──────────┘  └──────────┘      │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────▼──────────────────────────────┐  │
│  │              AI Integration Layer                 │  │
│  │    ┌──────────────┐  ┌───────────────┐           │  │
│  │    │  MCP Server  │  │  Analytics    │           │  │
│  │    │  Interface   │  │  Engine       │           │  │
│  │    └──────────────┘  └───────────────┘           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘


📊 Detailed Data Models
1. DynamoDB Table Structure
Table Design Philosophy: Single-table design for cost efficiency, partition by entity type
Main Table: embark-quotes-prod
Primary Key:
Partition Key: PK (String)
Sort Key: SK (String)
Global Secondary Indexes:
GSI1: GSI1PK / GSI1SK - For user queries
GSI2: GSI2PK / GSI2SK - For status/date queries
GSI3: GSI3PK / GSI3SK - For sync conflict detection
Entity Patterns:
QUOTE:
  PK: "QUOTE#<uuid>"
  SK: "METADATA"
  GSI1PK: "USER#<userId>"
  GSI1SK: "QUOTE#<timestamp>"
  GSI2PK: "STATUS#<status>"
  GSI2SK: "DATE#<updatedAt>"
  GSI3PK: "VERSION#<quoteId>"
  GSI3SK: "VER#<version>#<timestamp>"

QUOTE_VERSION (for conflict resolution):
  PK: "QUOTE#<uuid>"
  SK: "VERSION#<version>#<timestamp>"
  GSI3PK: "VERSION#<quoteId>"
  GSI3SK: "VER#<version>#<timestamp>"

PRICE_SHEET:
  PK: "PRICESHEET#CURRENT"
  SK: "VERSION#<version>"
  GSI1PK: "PRICESHEET#HISTORY"
  GSI1SK: "VERSION#<timestamp>"

USER:
  PK: "USER#<cognitoId>"
  SK: "PROFILE"
  GSI1PK: "ROLE#<admin|field>"
  GSI1SK: "USER#<email>"

SYNC_LOG:
  PK: "SYNCLOG#<deviceId>"
  SK: "TIMESTAMP#<timestamp>"
  TTL: <timestamp + 30 days>


2. IndexedDB Schema (Client-Side)
Database Name: embark-estimator-v1
Object Stores:

// Store 1: quotes
{
  keyPath: 'id',
  indexes: {
    'quoteNumber': { unique: true },
    'status': { unique: false },
    'updatedAt': { unique: false },
    'syncStatus': { unique: false }
  }
}

// Store 2: priceSheets
{
  keyPath: 'id',
  indexes: {
    'version': { unique: true },
    'lastUpdated': { unique: false }
  }
}

// Store 3: syncQueue
{
  keyPath: 'id',
  autoIncrement: true,
  indexes: {
    'timestamp': { unique: false },
    'status': { unique: false }, // pending|syncing|failed|complete
    'priority': { unique: false }
  }
}

// Store 4: changeLog
{
  keyPath: 'id',
  autoIncrement: true,
  indexes: {
    'quoteId': { unique: false },
    'timestamp': { unique: false },
    'synced': { unique: false }
  }
}

// Store 5: userPreferences
{
  keyPath: 'key'
}

// Store 6: offlineCache
{
  keyPath: 'key',
  indexes: {
    'expiresAt': { unique: false }
  }
}


3. Complete Data Models (TypeScript Interfaces)
// Core Quote Model
interface Quote {
  id: string; // UUID v4
  quoteNumber: string; // Auto-generated, format: "EE-YYYY-NNNN"
  version: number;
  status: QuoteStatus;
  createdAt: string; // ISO8601
  updatedAt: string;
  createdBy: string; // userId
  lastModifiedBy: string;
  deviceId: string;
  
  customer: Customer;
  jobs: Job[];
  financials: Financials;
  metadata: QuoteMetadata;
  changeLog: ChangeLogEntry[];
  syncStatus: SyncStatus;
}

enum QuoteStatus {
  DRAFT = 'draft',
  QUOTED = 'quoted',
  BOOKED = 'booked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface Customer {
  name: string;
  email?: string;
  phone: string;
  address: string;
  location?: {
    suburb: string;
    postcode: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface Job {
  id: string; // UUID
  type: JobType;
  order: number; // For multi-job quotes
  parameters: JobParameters;
  materials: Material[];
  labour: Labour;
  calculations: Calculations;
  subtotal: number;
}

enum JobType {
  RETAINING_WALL = 'retaining_wall',
  DRIVEWAY = 'driveway',
  TRENCHING = 'trenching',
  STORMWATER = 'stormwater',
  SITE_PREP = 'site_prep'
}

// Job-specific parameter interfaces
interface RetainingWallParameters {
  bays: number;
  heightMm: number; // 200-1000mm in 200mm increments
  length: number; // meters
  includeAgPipe: boolean;
  includeOrangePlastic: boolean;
}

interface DrivewayParameters {
  length: number;
  width: number;
  baseThicknessMm: number; // default 200mm
  includeTopping: boolean;
  toppingThicknessMm?: number; // default 100mm if included
  toppingType?: 'gravel_20mm';
}

interface TrenchingParameters {
  length: number;
  widthMm: number; // 300|600|900
  depthMm: number;
  includeStormwater: boolean;
  pipeLength?: number;
  tJoints?: number;
  elbows?: number;
  downpipeAdaptors?: number;
}

interface StormwaterParameters {
  pipeLength: number;
  pipeType: 'pvc_90mm';
  tJoints: number;
  elbows: number;
  downpipeAdaptors: number;
  includeTrenching: boolean;
  trenchLength?: number;
  trenchWidthMm?: number;
}

interface SitePrepParameters {
  area: number; // square meters
  depthMm: number;
  includeBackfill: boolean;
  backfillType?: 'road_base' | 'paving_sand';
  requiresDumping: boolean;
  dumpDistance?: number; // km
  supplyDistance?: number; // km
}

type JobParameters = 
  | RetainingWallParameters 
  | DrivewayParameters 
  | TrenchingParameters 
  | StormwaterParameters 
  | SitePrepParameters;

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string; // m³, m, ea, day
  unitPrice: number;
  totalPrice: number;
  priceSheetId: string; // Reference to price sheet version
}

interface Labour {
  description: string;
  hours?: number;
  rate?: number;
  fixedPrice?: number;
  totalCost: number;
}

interface Calculations {
  volume?: number; // For earthworks
  loads?: number; // For trucking
  travelCost?: number;
  dumpingCost?: number;
  accessModifier?: number; // 1.0 normal, 1.1 tight access
}

interface Financials {
  directCost: number;
  overheadMultiplier: number; // default 1.15
  requiredExGST: number; // directCost × overhead ÷ opex
  gstRate: number; // default 0.10
  gstAmount: number;
  totalIncGST: number;
  roundedTotal: number; // Rounded to nearest $10
  
  deposit: {
    percentage: number; // 20|25|30
    amount: number;
    warningIfLessThanMaterials: boolean;
  };
  
  profitFirst: {
    profit: number; // 10%
    owner: number; // 30%
    tax: number; // 15%
    opex: number; // 45%
  };
}

interface QuoteMetadata {
  validityDays: number; // default 14
  rockClauseIncluded: boolean;
  tightAccess: boolean;
  notes: string;
  internalNotes: string; // Not visible in customer output
  tags: string[];
}

interface ChangeLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  deviceId: string;
  field: string; // JSONPath to changed field
  oldValue: any;
  newValue: any;
  operation: 'create' | 'update' | 'delete';
}

interface SyncStatus {
  locallyModified: boolean;
  lastSyncedAt?: string;
  lastSyncAttempt?: string;
  syncError?: string;
  pendingChanges: number;
  conflictDetected: boolean;
  conflictResolution?: ConflictResolution;
}

interface ConflictResolution {
  detectedAt: string;
  localVersion: number;
  remoteVersion: number;
  strategy: 'auto_merged' | 'local_wins' | 'remote_wins' | 'manual_required';
  mergedFields: string[];
  conflictingFields: string[];
}

// Price Sheet Model
interface PriceSheet {
  id: string;
  version: number;
  lastUpdated: string;
  updatedBy: string;
  updatedByName: string;
  items: Record<string, PriceItem>;
  defaults: Defaults;
}

interface PriceItem {
  name: string;
  price: number;
  unit: string;
  lastChecked: string;
  notes?: string;
}

interface Defaults {
  gst: number;
  profitModel: {
    profit: number;
    owner: number;
    tax: number;
    opex: number;
  };
  overheadMultiplier: number;
  opexCap: number;
  hourlyRate: number;
  depositOptions: number[];
  defaultDeposit: number;
  quoteValidityDays: number;
  roundingIncrement: number;
  travelCostPerKm: number;
  dumpingPerLoad: number;
  truckingTonnesPerLoad: number;
}

// User Model
interface User {
  id: string; // Cognito sub
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
  preferences: UserPreferences;
  deviceIds: string[];
}

enum UserRole {
  ADMIN = 'admin',
  FIELD_WORKER = 'field_worker'
}

interface UserPreferences {
  defaultDepositPercentage: number;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    priceChanges: boolean;
    conflictAlerts: boolean;
    syncErrors: boolean;
  };
  defaultEmailRecipient: string;
}

// Sync Queue Model
interface SyncQueueItem {
  id: number; // Auto-increment
  timestamp: string;
  quoteId: string;
  operation: 'create' | 'update' | 'delete';
  data: Partial<Quote>;
  priority: number; // 1 = highest
  status: 'pending' | 'syncing' | 'failed' | 'complete';
  attempts: number;
  lastAttempt?: string;
  error?: string;
}


🔐 Authentication & Authorization
AWS Cognito Configuration
User Pool Settings:
UserPool:
  Name: embark-estimator-users
  MfaConfiguration: OPTIONAL
  PasswordPolicy:
    MinimumLength: 8
    RequireUppercase: true
    RequireNumbers: true
    RequireSymbols: false
  Attributes:
    - email (required, mutable)
    - name (required, mutable)
    - custom:role (admin|field_worker)
    - custom:company (embark)
  EmailVerification: true
  AccountRecovery: EMAIL_ONLY

User Groups:
admins - Full access
field_workers - Limited access
Permission Matrix:
Action
Admin
Field Worker
Create Quote
✅
✅
Edit Own Quote
✅
✅
Edit Any Quote
✅
❌
Delete Quote
✅
❌
View All Quotes
✅
Own only
Update Prices
✅
❌
Manage Users
✅
❌
View Analytics
✅
❌
Export Data
✅
❌


🔄 Sync Engine Architecture
Conflict Resolution Algorithm
FUNCTION syncQuote(localQuote, remoteQuote):
  
  IF remoteQuote NOT EXISTS:
    RETURN uploadNew(localQuote)
  
  IF localQuote.version == remoteQuote.version:
    RETURN uploadChanges(localQuote)
  
  // Conflict detected
  conflict = detectConflicts(localQuote, remoteQuote)
  
  IF conflict.canAutoMerge:
    merged = autoMerge(localQuote, remoteQuote)
    merged.version = remoteQuote.version + 1
    RETURN uploadMerged(merged)
  
  ELSE:
    // Manual resolution required
    RETURN flagForManualResolution(conflict)

FUNCTION detectConflicts(local, remote):
  conflicts = []
  
  FOR EACH field IN local.changeLog:
    remoteChange = findChangeInRemote(field.path, remote.changeLog)
    
    IF remoteChange EXISTS AND field.timestamp > remote.lastSyncedAt:
      IF field.path IN criticalFields:
        conflicts.add({
          field: field.path,
          localValue: field.newValue,
          remoteValue: remoteChange.newValue,
          canAutoMerge: false
        })
      ELSE:
        conflicts.add({
          field: field.path,
          localValue: field.newValue,
          remoteValue: remoteChange.newValue,
          canAutoMerge: true,
          resolution: applyResolutionRule(field.path)
        })
  
  RETURN conflicts

FUNCTION autoMerge(local, remote):
  merged = cloneDeep(remote)
  
  FOR EACH change IN local.changeLog WHERE timestamp > local.lastSyncedAt:
    IF change.field NOT IN remote.conflictingFields:
      applyChange(merged, change)
      merged.changeLog.push(change)
  
  merged.version = remote.version + 1
  merged.lastModifiedBy = local.lastModifiedBy
  merged.syncStatus.conflictResolution = {
    strategy: 'auto_merged',
    mergedFields: extractFieldPaths(local.changeLog)
  }
  
  RETURN merged

Resolution Rules by Field Type:
Field Category
Rule
Rationale
Customer Contact Info
Last-Write-Wins (newest timestamp)
Contact info updates are typically corrections
Quote Status
Manual Review if divergent
Critical business state
Job Line Items
Merge by ID (add new, update existing)
Non-conflicting additions
Financial Calculations
Recalculate from merged inputs
Always derive from current state
Price References
Last-Write-Wins + notify all users
Admin updates override
Notes/Metadata
Concatenate with separator
Preserve all information

Sync Queue Priority System
Priority Levels:
1 = Critical (status changes, customer updates)
2 = High (job modifications, financial changes)
3 = Normal (notes, metadata)
4 = Low (preferences, UI state)

Queue Processing:
- Process in priority order
- Batch operations by quoteId
- Max 3 concurrent syncs
- Exponential backoff on failure: 1s, 2s, 4s, 8s, 30s, 60s
- Move to dead-letter queue after 6 failures


🎨 UI/UX Architecture
Component Hierarchy
App
├── AuthProvider
├── SyncProvider
├── ThemeProvider
└── Router
    ├── LoginPage
    ├── DashboardPage
    │   ├── Header
    │   │   ├── Logo
    │   │   ├── SyncStatusIndicator
    │   │   └── UserMenu
    │   ├── QuoteList
    │   │   ├── QuoteCard (repeating)
    │   │   ├── FilterBar
    │   │   └── SearchBar
    │   └── QuickActions
    │       └── NewQuoteButton
    │
    ├── QuoteEditorPage
    │   ├── Header
    │   │   ├── BackButton
    │   │   ├── QuoteNumberDisplay
    │   │   ├── SyncStatusBadge
    │   │   └── MoreMenu
    │   ├── CustomerSection
    │   │   └── CustomerForm
    │   ├── JobsSection
    │   │   ├── JobTypeSelector
    │   │   └── JobCard (repeating)
    │   │       ├── JobParametersForm
    │   │       ├── MaterialsList
    │   │       └── SubtotalDisplay
    │   ├── FinancialsSummary
    │   │   ├── BreakdownToggle
    │   │   ├── TotalDisplay
    │   │   └── DepositCalculator
    │   └── ActionBar
    │       ├── SaveButton
    │       ├── RenderQuoteButton
    │       └── EmailButton
    │
    ├── QuoteViewPage
    │   ├── Header
    │   ├── CustomerDetails
    │   ├── QuoteSummary
    │   ├── JobBreakdowns
    │   ├── FinancialBreakdown
    │   ├── TermsAndConditions
    │   └── ActionBar
    │       ├── EditButton
    │       ├── ShareButton
    │       └── StatusDropdown
    │
    ├── PricesPage (Admin only)
    │   ├── Header
    │   ├── PriceGrid
    │   │   └── PriceItemCard (repeating)
    │   │       ├── ItemName
    │   │       ├── PriceInput
    │   │       ├── UnitDisplay
    │   │       └── LastCheckedDate
    │   ├── DefaultsSection
    │   └── SaveButton
    │
    ├── SettingsPage
    │   ├── ProfileSection
    │   ├── PreferencesSection
    │   ├── SecuritySection (change password)
    │   └── AboutSection
    │
    └── ConflictResolutionModal
        ├── ConflictExplanation
        ├── SideBySideComparison
        ├── FieldDiffViewer
        └── ResolutionActions
            ├── AcceptRemoteButton
            ├── AcceptLocalButton
            └── ManualMergeButton

Design System
Color Palette:
:root {
  /* Primary */
  --color-primary: #1F4E78; /* Navy blue */
  --color-primary-light: #2D6DA6;
  --color-primary-dark: #163A5A;
  
  /* Neutrals */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F5F7FA;
  --color-bg-tertiary: #E8ECF0;
  --color-text: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  
  /* Status Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Status-specific */
  --color-draft: #94A3B8;
  --color-quoted: #3B82F6;
  --color-booked: #8B5CF6;
  --color-in-progress: #F59E0B;
  --color-completed: #10B981;
  --color-cancelled: #EF4444;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* Spacing Scale */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  /* Typography */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}

Typography Scale:
.text-xs { font-size: 12px; line-height: 16px; }
.text-sm { font-size: 14px; line-height: 20px; }
.text-base { font-size: 16px; line-height: 24px; }
.text-lg { font-size: 18px; line-height: 28px; }
.text-xl { font-size: 24px; line-height: 32px; }
.text-2xl { font-size: 32px; line-height: 40px; }

Font Stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

Button Variants:
Primary: Navy background, white text, bold
Secondary: White background, navy border, navy text
Success: Green background, white text
Danger: Red background, white text
Ghost: Transparent, text only

Sizes:
- sm: 32px height, 12px padding
- md: 44px height, 16px padding (default, touch-friendly)
- lg: 52px height, 20px padding

Mobile-First Breakpoints:
/* Mobile: 0-639px */
/* Tablet: 640-1023px */
@media (min-width: 640px) { ... }
/* Desktop: 1024px+ */
@media (min-width: 1024px) { ... }


🔌 API Specification
REST API Endpoints
Base URL: https://api.embark-estimator.com/v1
Authentication
POST /auth/login
  Body: { email, password }
  Response: { accessToken, refreshToken, user }

POST /auth/refresh
  Body: { refreshToken }
  Response: { accessToken }

POST /auth/logout
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

Quotes
GET /quotes
  Headers: { Authorization: Bearer <token> }
  Query: ?status=quoted&limit=50&offset=0
  Response: { quotes: Quote[], total: number, hasMore: boolean }

GET /quotes/:id
  Headers: { Authorization: Bearer <token> }
  Response: { quote: Quote }

POST /quotes
  Headers: { Authorization: Bearer <token> }
  Body: { quote: Partial<Quote> }
  Response: { quote: Quote }

PUT /quotes/:id
  Headers: { Authorization: Bearer <token> }
  Body: { quote: Partial<Quote>, version: number }
  Response: { quote: Quote } | { conflict: ConflictDetails }

DELETE /quotes/:id
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

Sync
POST /sync/batch
  Headers: { Authorization: Bearer <token> }
  Body: { 
    operations: SyncOperation[],
    deviceId: string,
    lastSyncAt: string
  }
  Response: { 
    results: SyncResult[],
    conflicts: Conflict[],
    serverTime: string
  }

GET /sync/changes
  Headers: { Authorization: Bearer <token> }
  Query: ?since=<timestamp>&deviceId=<id>
  Response: { 
    changes: Change[],
    serverTime: string
  }

Prices (Admin only)
GET /prices/current
  Headers: { Authorization: Bearer <token> }
  Response: { priceSheet: PriceSheet }

PUT /prices
  Headers: { Authorization: Bearer <token> }
  Body: { priceSheet: Partial<PriceSheet> }
  Response: { priceSheet: PriceSheet }

GET /prices/history
  Headers: { Authorization: Bearer <token> }
  Query: ?limit=10
  Response: { versions: PriceSheet[] }

Users (Admin only)
GET /users
  Headers: { Authorization: Bearer <token> }
  Response: { users: User[] }

POST /users
  Headers: { Authorization: Bearer <token> }
  Body: { email, name, role, temporaryPassword }
  Response: { user: User }

PUT /users/:id
  Headers: { Authorization: Bearer <token> }
  Body: { user: Partial<User> }
  Response: { user: User }

DELETE /users/:id
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

AI Integration
POST /ai/analyze
  Headers: { Authorization: Bearer <token>, X-AI-Key: <mcp-key> }
  Body: { 
    query: string,
    context: 'pricing'|'forecasting'|'patterns',
    filters: object
  }
  Response: { 
    analysis: object,
    confidence: number,
    recommendations: string[]
  }

GET /ai/export
  Headers: { Authorization: Bearer <token>, X-AI-Key: <mcp-key> }
  Query: ?format=json&dateRange=30d
  Response: { 
    data: Quote[],
    aggregations: object,
    exportedAt: string
  }

WebSocket API
Connection: wss://api.embark-estimator.com/ws
Authentication: Send JWT in first message after connection
Message Types:
// Client → Server
{
  type: 'subscribe',
  channels: ['quotes', 'prices', 'sync']
}

{
  type: 'quote.update',
  quoteId: string,
  userId: string
}

// Server → Client
{
  type: 'quote.locked',
  quoteId: string,
  lockedBy: { userId, userName },
  timestamp: string
}

{
  type: 'quote.unlocked',
  quoteId: string,
  timestamp: string
}

{
  type: 'price.updated',
  priceSheet: PriceSheet,
  updatedBy: string,
  timestamp: string
}

{
  type: 'sync.required',
  quoteIds: string[],
  reason: 'conflict'|'update'
}


📦 Development Chunks
Chunk 1: Project Setup & Infrastructure (Week 1)
Objective: Set up development environment and AWS infrastructure
Tasks:
Initialize React PWA project


Create React App with TypeScript
Configure service worker
Set up PWA manifest
Configure build process
Set up AWS Infrastructure (Infrastructure as Code)


Create CloudFormation/CDK templates
Configure DynamoDB tables
Set up Cognito User Pool
Configure API Gateway
Set up Lambda function scaffolding
Configure S3 buckets (backups, exports)
Set up development tools


ESLint + Prettier configuration
Git hooks (Husky)
CI/CD pipeline (GitHub Actions)
Environment variable management
Deliverables:
React app running locally
AWS resources provisioned
Deployment pipeline working
Documentation: Setup guide
Testing: Deploy hello-world Lambda, verify Cognito, test PWA installation

Chunk 2: Authentication System (Week 1-2)
Objective: Implement user authentication and authorization
Frontend Tasks:
Create auth context/provider
Build login/signup UI
Implement token management
Handle token refresh
Create protected route wrapper
Backend Tasks:
Configure Cognito triggers (Lambda)
Create auth endpoints
Implement JWT validation middleware
Set up user groups and policies
Deliverables:
Working login/signup flow
Token refresh mechanism
Role-based access control
Auth error handling
Testing: Login/logout, token expiry, role permissions

Chunk 3: Local Data Layer (Week 2)
Objective: Build IndexedDB wrapper and local storage system
Tasks:
Set up Dexie.js
Create database schema
Build data access layer (DAL)
CRUD operations for quotes
Price sheet management
Sync queue operations
Implement data encryption for sensitive fields
Build migration system for schema updates
Deliverables:
Complete IndexedDB implementation
Data access API
Encryption/decryption utilities
Database migration system
Testing: CRUD operations, data persistence across sessions, encryption

Chunk 4: Quote Editor UI (Week 2-3)
Objective: Build the core quote creation and editing interface
Frontend Tasks:
Create quote editor page
Build customer information form
Create job type selector
Build job parameter forms (all 5 types)
Retaining wall
Driveway
Trenching
Stormwater
Site prep
Implement multi-job support
Create real-time calculation preview
Build financial summary display
Deliverables:
Fully functional quote editor
All job type forms
Real-time calculation engine
Responsive mobile layout
Testing: Form validation, calculations accuracy, mobile usability

Chunk 5: Quote Calculation Engine (Week 3)
Objective: Implement business logic for all quote calculations
Tasks:
Build calculation utilities
Material quantity calculations
Labour cost calculations
Travel/dumping costs
Overhead and markup
GST calculations
Profit-first breakdown
Implement calculation rules per job type
Create price lookup system
Build totaling and rounding logic
Implement tight access modifier
Deliverables:
Complete calculation engine
Unit tests for all calculations
Price lookup system
Calculation documentation
Testing: Test all job types with edge cases, verify profit-first model

Chunk 6: Quote List & Dashboard (Week 3-4)
Objective: Build quote management interface
Frontend Tasks:
Create dashboard page
Build quote list with filtering
Implement search functionality
Create quote card component
Build quick actions menu
Add status management
Implement sort options
Deliverables:
Dashboard UI
Quote list with filters
Search functionality
Quick actions
Testing: Filter/search performance, mobile layout

Chunk 7: Quote Output & Rendering (Week 4)
Objective: Create professional quote output view
Frontend Tasks:
Build quote view page (customer-facing)
Create print-friendly layout
Implement PDF generation
Build breakdown views (toggle)
Create terms and conditions section
Add rock clause and warnings
Deliverables:
Quote view page
PDF export functionality
Print stylesheet
Professional formatting
Testing: PDF generation, print layout, mobile viewing

Chunk 8: Sync Engine - Part 1 (Week 4-5)
Objective: Implement basic sync functionality
Frontend Tasks:
Create sync service
Build sync queue manager
Implement connection detection
Create sync status UI indicators
Build retry mechanism with exponential backoff
Backend Tasks:
Create sync Lambda functions
Implement batch sync endpoint
Build change detection logic
Create sync log system
Deliverables:
Basic sync functionality
Queue management
Connection detection
Sync status indicators
Testing: Online/offline transitions, queue processing, retry logic

Chunk 9: Sync Engine - Part 2 (Conflict Resolution) (Week 5-6)
Objective: Implement conflict detection and resolution
Frontend Tasks:
Build conflict detection logic
Create conflict resolution UI
Implement auto-merge algorithm
Build manual resolution interface
Create conflict notification system
Backend Tasks:
Implement version vector logic
Build conflict detection algorithm
Create merge utilities
Implement resolution strategies
Deliverables:
Conflict detection system
Auto-merge capability
Manual resolution UI
Conflict logging
Testing: Simulate conflicts, test merge strategies, verify data integrity

Chunk 10: Price Management (Week 6)
Objective: Build price sheet management system
Frontend Tasks (Admin only):
Create price management page
Build price editor interface
Implement version history view
Create defaults editor
Add price aging indicators
Backend Tasks:
Create price update endpoints
Implement versioning system
Build price change notification system
Create audit log
Deliverables:
Price management UI
Version control
Change tracking
Admin-only access
Testing: Price updates, version history, permission checks

Chunk 11: User Management & Settings (Week 6-7)
Objective: Build user and settings management
Frontend Tasks:
Create settings page
Build user profile editor
Create preferences UI
Build user management page (admin)
Implement password change flow
Backend Tasks:
Create user management endpoints
Implement user invite system
Build preference sync
Create audit logging
Deliverables:
Settings interface
User management (admin)
Preference system
Password management
Testing: User CRUD, preference persistence, role management

Chunk 12: AI Integration Layer (Week 7-8)
Objective: Build AI-ready data access and MCP server interface
Backend Tasks:
Create AI data export endpoints
Build aggregation queries for analytics
Implement MCP server protocol
Create structured data endpoints
Build rate limiting and authentication for AI access
Create data anonymization utilities
Frontend Tasks:
Build analytics dashboard (basic)
Create export functionality
Add AI integration status indicators
Deliverables:
MCP-compatible API endpoints
Data export system
Analytics queries
AI authentication
Testing: MCP protocol compliance, data export formats, API performance

Chunk 13: Email & Notifications (Week 8)
Objective: Implement email and notification system
Tasks:
Configure SES for email sending
Create email templates
Build email composition UI
Implement email sending from app
Create notification system
Build push notification setup (optional)
Deliverables:
Email sending capability
Email templates
Notification system
Email recipient management
Testing: Email delivery, template rendering, notification triggers

Chunk 14: Performance Optimization (Week 8-9)
Objective: Optimize app performance and reduce bundle size
Tasks:
Implement code splitting
Optimize bundle size
Add lazy loading for routes
Implement image optimization
Add caching strategies
Optimize IndexedDB queries
Implement virtual scrolling for lists
Add performance monitoring
Deliverables:
Reduced bundle size
Faster load times
Optimized runtime performance
Performance metrics
Testing: Lighthouse scores, real device testing, slow network simulation

Chunk 15: Security Hardening (Week 9)
Objective: Implement security best practices
Tasks:
Add Content Security Policy
Implement HTTPS enforcement
Add input sanitization
Implement rate limiting
Add security headers
Audit and fix XSS vulnerabilities
Implement CSRF protection
Add logging and monitoring
Deliverables:
Security audit report
Hardened application
Security documentation
Monitoring setup
Testing: Security audit, penetration testing, vulnerability scanning

Chunk 16: Testing & QA (Week 9-10)
Objective: Comprehensive testing across all features
Tasks:
Write unit tests (target 80% coverage)
Create integration tests
Build E2E test suite (Playwright/Cypress)
Perform user acceptance testing
Mobile device testing
Offline mode testing
Sync testing with multiple devices
Load testing
Deliverables:
Complete test suite
Test coverage report
QA documentation
Bug fixes
Testing: All features across devices and scenarios

Chunk 17: Documentation & Training (Week 10)
Objective: Create comprehensive documentation
Deliverables:
User manual (PDF + interactive)
Admin guide
API documentation
Developer documentation
Deployment guide
Troubleshooting guide
Video tutorials (optional)
FAQ document

Chunk 18: Deployment & Launch (Week 10-12)
Objective: Deploy to production and monitor
Tasks:
Set up production environment
Configure monitoring (CloudWatch, Sentry)
Set up alerting
Create backup/restore procedures
Deploy to production
Perform smoke tests
Monitor for 48 hours
Gradual rollout to users
Deliverables:
Production deployment
Monitoring dashboard
Runbook
Launch checklist completed

🧪 Testing Strategy
Unit Testing
Framework: Jest
Coverage Target: 80%+
Focus Areas:
Calculation engine
Sync logic
Data transformations
Utility functions
Integration Testing
Framework: React Testing Library
Focus Areas:
Component interactions
Form submissions
API calls
IndexedDB operations
E2E Testing
Framework: Playwright
Test Scenarios:
Complete quote creation flow
Sync across devices
Conflict resolution
Offline → online transition
User authentication
Performance Testing
Tools: Lighthouse, WebPageTest
Metrics:
First Contentful Paint < 1.5s
Time to Interactive < 3s
Bundle size < 500KB (gzipped)
Security Testing
Tools: OWASP ZAP, Snyk
Focus:
XSS prevention
SQL injection (N/A for DynamoDB)
Authentication bypass
Authorization checks
Data encryption

🚀 Deployment Strategy
Environments
Development


Auto-deploy from develop branch
Shared DynamoDB tables with DEV prefix
Relaxed CORS
Staging


Deploy from staging branch (manual)
Separate DynamoDB tables
Production-like configuration
Testing with production data snapshots
Production


Deploy from main branch (manual approval)
Separate infrastructure
Blue-green deployment
Canary releases for major changes
CI/CD Pipeline
on: push
jobs:
  test:
    - Run linter
    - Run unit tests
    - Run integration tests
    - Check code coverage
  
  build:
    - Build React app
    - Build Lambda functions
    - Run security scan
    - Create artifacts
  
  deploy-dev:
    if: branch == develop
    - Deploy to dev environment
    - Run smoke tests
  
  deploy-staging:
    if: branch == staging
    - Deploy to staging
    - Run full test suite
    - Performance tests
  
  deploy-prod:
    if: branch == main
    requires: manual-approval
    - Deploy to prod (blue-green)
    - Run smoke tests
    - Monitor metrics
    - Auto-rollback on errors

Rollback Strategy
Keep previous 5 deployments
One-click rollback in AWS Console
Automated rollback triggers:
Error rate > 5%
Response time > 3s (p95)
Any 500 errors in first 5 minutes

📊 Monitoring & Observability
Key Metrics
Application Metrics:
Active users (DAU, MAU)
Quotes created per day
Average quote value
Sync success rate
Conflict resolution rate
API response times
Error rates
Infrastructure Metrics:
Lambda invocations and errors
DynamoDB read/write capacity
API Gateway requests
Cognito authentication success rate
Business Metrics:
Quote → Booking conversion rate
Average time to create quote
Most used job types
Price change frequency
Alerting Rules
CRITICAL:
- API error rate > 5% for 5 minutes
- Sync failure rate > 10% for 10 minutes
- Database throttling
- Lambda timeout rate > 1%

WARNING:
- API response time p95 > 2s for 10 minutes
- Disk usage > 80%
- Unusual quote volume spike
- Price sheet not updated in 90 days

INFO:
- New user signup
- Price sheet updated
- Deployment completed

Logging Strategy
Frontend:
Error boundary catches
API errors
Sync operations
User actions (anonymized)
Backend:
All API requests/responses
Sync operations
Conflict resolutions
Price updates
User actions (with userId)
Log Retention:
ERROR: 90 days
WARN: 30 days
INFO: 7 days

🔮 Future Enhancements (Post-MVP)
Phase 2 Features
Advanced Analytics Dashboard


Revenue trends
Job type profitability
Customer lifetime value
Seasonal patterns
CRM Integration


Sync with external CRM
Customer history
Follow-up reminders
Photo Attachments


Site photos
Before/after comparisons
Automatic upload to S3
GPS/Mapping Integration


Site location on map
Travel distance calculation
Route optimization
Voice Input


Voice-to-text for notes
Voice commands for common actions
Template System


Save quote templates
Quick quote from template
Common job presets
Phase 3 Features
Native Mobile Apps


iOS and Android apps
Better offline experience
Push notifications
Machine Learning


Price prediction
Job duration estimation
Material quantity optimization
Multi-Company Support


White-label version
Company-specific branding
Separate data tenancy

💰 Cost Estimation (AWS)
Monthly Costs (20 users, ~500 quotes/month)
Service
Usage
Cost
Cognito
20 MAU
$0 (free tier)
DynamoDB
1M reads, 500K writes
$0 (free tier)
Lambda
1M requests, 400K GB-seconds
$0 (free tier)
API Gateway
1M requests
$3.50
S3
5GB storage, 10K requests
$0.15
CloudWatch
Logs + metrics
$5
SES
1000 emails
$0.10
Total


~$10/month

Note: Should remain under $15/month for first year under AWS Free Tier
Scaling Costs
Users
Quotes/Month
Est. Cost
20
500
$10
50
1,500
$25
100
3,000
$60
500
15,000
$300


🛠️ Technology Stack Summary
Frontend
Framework: React 18 with TypeScript
State Management: Redux Toolkit
Routing: React Router v6
UI Components: Custom component library
Styling: CSS Modules + CSS Variables
Forms: React Hook Form
Local DB: Dexie.js (IndexedDB wrapper)
HTTP Client: Axios
PWA: Workbox
Date Handling: date-fns
PDF Generation: jsPDF or react-pdf
Backend
Runtime: Node.js 20 (Lambda)
API: AWS API Gateway (REST + WebSocket)
Database: AWS DynamoDB
Authentication: AWS Cognito
Storage: AWS S3
Email: AWS SES
Functions: AWS Lambda
IaC: AWS CDK or CloudFormation
DevOps
Version Control: Git + GitHub
CI/CD: GitHub Actions
Monitoring: AWS CloudWatch + Sentry
Testing: Jest + React Testing Library + Playwright
Linting: ESLint + Prettier
Package Manager: npm or yarn

📋 Success Criteria
MVP Launch Criteria
Functional Requirements:
✅ User authentication working
✅ Create/edit/delete quotes
✅ All 5 job types functional
✅ Accurate calculations
✅ Offline mode working
✅ Sync functionality working
✅ Conflict resolution working
✅ Price management working
✅ PDF export working
✅ Email sending working
Performance Requirements:
✅ App loads in < 3 seconds
✅ Quote creation < 60 seconds
✅ Sync completes in < 5 seconds
✅ Works on 3G connection
✅ Lighthouse score > 90
Security Requirements:
✅ Data encrypted in transit
✅ Sensitive fields encrypted at rest
✅ Role-based access control working
✅ Security headers implemented
✅ No critical vulnerabilities
User Experience:
✅ Mobile-friendly interface
✅ Clear sync status indicators
✅ Intuitive navigation
✅ Helpful error messages
✅ Accessible (WCAG AA)

📞 Support & Maintenance Plan
Ongoing Maintenance
Daily:
Monitor error rates
Check sync failures
Review critical alerts
Weekly:
Review user feedback
Check performance metrics
Update price data if needed
Review security alerts
Monthly:
Dependency updates
Security patches
Performance optimization
Backup verification
Cost review
Quarterly:
Feature planning
User training sessions
Infrastructure review
Disaster recovery drill
Support Tiers
Tier 1 - User Issues:
Login problems
Basic functionality questions
How-to guides
Response time: 24 hours
Tier 2 - Technical Issues:
Sync problems
Data inconsistencies
Performance issues
Response time: 4 hours
Tier 3 - Critical Issues:
System outages
Data loss
Security incidents
Response time: 1 hour

🎓 Handoff Documentation Required
For each chunk, the implementing AI should produce:
Code:


Complete, working implementation
Properly commented
Following style guide
Type-safe (TypeScript)
Tests:


Unit tests
Integration tests
Test coverage report
Documentation:


README for the feature
API documentation (if applicable)
Configuration notes
Known limitations
Migration Guide:


Schema changes (if any)
Data migration scripts
Breaking changes
Deployment Notes:


Environment variables
AWS resource changes
Configuration updates

✅ Ready to Begin
This architecture plan provides a complete blueprint for building the Embark Estimator application. Each chunk is:
Self-contained: Can be built independently
Testable: Clear testing requirements
Documented: Includes specifications
Reviewable: Clear deliverables
Recommended Build Order: Follow chunks 1-18 sequentially for optimal dependency management.
Time Estimate: 10-12 weeks with one developer, 6-8 weeks with two developers working in parallel on independent chunks.
Next Steps:
Review and approve this architecture
Set up development environment (Chunk 1)
Begin iterative development
Regular check-ins after each chunk
Would you like me to elaborate on any specific chunk or create more detailed specifications for a particular component?

