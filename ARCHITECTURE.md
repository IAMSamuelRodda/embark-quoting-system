# Architecture Documentation

> **Purpose**: Technical reference for system architecture, database schema, tech stack, and ADRs
> **Lifecycle**: Living (update as implementation diverges from original plan)

**Version:** 1.0
**Last Updated:** 2025-11-17

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Technology Stack](#technology-stack)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
7. [Infrastructure](#infrastructure)
8. [Security](#security)
9. [Offline-First Strategy](#offline-first-strategy)
10. [Deployment Architecture](#deployment-architecture)
11. [Design System](#design-system)
12. [Architecture Decision Records](#architecture-decision-records)

---

## System Overview

The Embark Quoting System is an offline-first Progressive Web Application (PWA) designed for field use by earthmoving contractors. The system enables quote creation, job management, financial calculations, and cloud synchronization with full offline capability.

**Key Characteristics:**
- **Offline-First:** 100% functionality without internet connection
- **Mobile-First:** Optimized for phones/tablets in field conditions
- **Vertical Slice Architecture:** Feature-based organization
- **Progressive Web App:** Installable, works like native app
- **Cloud-Synced:** Background synchronization when online

**Primary Use Case:**
Field workers create quotes on-site (often without connectivity), quotes sync to cloud when connection available, office staff can review and manage quotes from any device.

---

## Architecture Pattern

### Vertical Slice Architecture

The system uses **Vertical Slice Architecture** rather than traditional layered architecture. Each feature contains all layers (UI, business logic, data access) in a single directory.

**Benefits:**
- Feature autonomy (change one feature without affecting others)
- Easier to understand (all related code in one place)
- Reduced coupling between features
- Supports offline-first design (each feature manages its own sync)

**Structure Pattern:**
```
features/
└── featureName/
    ├── ComponentName.tsx      # UI layer
    ├── useFeature.ts          # State hook (Zustand)
    ├── featureService.ts      # Business logic
    └── featureDb.ts           # IndexedDB operations
```

**Example:** The `quotes` feature:
```
features/quotes/
├── QuoteEditor.tsx            # Quote creation/editing UI
├── QuoteViewer.tsx            # Quote display UI
├── useQuoteStore.ts           # Zustand state management
├── quoteService.ts            # Business logic (calculations, validation)
└── quoteDb.ts                 # IndexedDB CRUD operations
```

### Offline-First Architecture

**Data Flow:**
1. User action → Local IndexedDB (instant)
2. Background sync → Cloud PostgreSQL (when online)
3. Conflict resolution → User intervention (critical fields only)

**Not:** Cloud-first with offline cache (degraded experience)
**Instead:** Local-first with cloud backup (full experience always)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI framework |
| **TypeScript** | ~5.9.3 | Type safety |
| **Vite** | 7.1.7 | Build tool & dev server |
| **React Router** | 7.9.5 | Client-side routing |
| **Tailwind CSS** | 4.1.16 | Utility-first styling |
| **Zustand** | 5.0.8 | Global state management |
| **Dexie.js** | 4.2.1 | IndexedDB wrapper (offline storage) |
| **jsPDF** | Latest | PDF generation |
| **Workbox** | 7.3.0 | PWA service worker (planned) |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest LTS | Runtime |
| **Express** | 4.18.2 | Web framework |
| **TypeScript** | ~5.9.3 | Type safety |
| **PostgreSQL** | Latest | Relational database |
| **Drizzle ORM** | 0.44.7 | Type-safe database access |
| **AWS SDK** | Latest | Cognito auth, SES email |
| **PDFKit** | Latest | Server-side PDF generation |
| **Zod** | Latest | Runtime validation |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Playwright** | 1.56.1 | E2E testing |
| **axe-core** | Latest | Accessibility testing |
| **Vitest** | Latest | Frontend unit tests |
| **Jest** | Latest | Backend unit tests |
| **Storybook** | 10.0.5 | Component development |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Digital Ocean Droplet** | VPS hosting (s-2vcpu-4gb, Sydney region) |
| **Docker Compose** | Container orchestration |
| **Caddy** | Reverse proxy with auto-HTTPS |
| **PostgreSQL** | Database (Docker container) |
| **Authentication** | 🔴 NEEDS IMPLEMENTATION (Cognito deleted) |

**Infrastructure URLs:**
- Frontend: https://embark.rodda.xyz
- Backend API: https://api.embark.rodda.xyz
- Droplet IP: 170.64.169.203

**Migration Note (Nov 2025):**
Migrated from AWS (ECS/EC2, RDS, CloudFront) to Digital Ocean VPS.
- Previous AWS infrastructure: **FULLY DELETED** (including Cognito)
- Terraform configs: Archived (not currently in use)
- Authentication: Needs new solution (local JWT, Authentik, or similar)
- Cost: Part of shared DO infrastructure (~$24/month total droplet)

---

## Frontend Architecture

### Directory Structure
```
frontend/src/
├── features/               # Vertical slices (feature modules)
│   ├── auth/              # Authentication flows
│   ├── quotes/            # Quote management
│   ├── jobs/              # Job type forms (5 types)
│   ├── financials/        # Financial calculations
│   ├── prices/            # Price sheet management
│   ├── settings/          # User settings
│   └── sync/              # Sync engine & conflict resolution
├── shared/                # Shared utilities
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Reusable React hooks
│   ├── utils/             # Helper functions
│   └── types/             # TypeScript type definitions
├── styles/                # Design system
│   ├── tokens/            # Design tokens (colors, spacing, typography)
│   ├── base/              # Base styles (reset, global, a11y)
│   └── index.css          # Main stylesheet
├── pages/                 # Route pages (thin wrappers)
├── assets/                # Static assets (images, icons, logos)
├── stories/               # Storybook component stories
└── App.tsx                # Root component & routing
```

### State Management Strategy

**Local Component State:** `useState` for UI-only state (form inputs, modals)

**Feature State:** Zustand stores for feature-specific state
```typescript
// Example: useQuoteStore.ts
import { create } from 'zustand';

interface QuoteState {
  quotes: Quote[];
  currentQuote: Quote | null;
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
  quotes: [],
  currentQuote: null,
  addQuote: (quote) => set((state) => ({ quotes: [...state.quotes, quote] })),
  updateQuote: (id, updates) => set((state) => ({
    quotes: state.quotes.map(q => q.id === id ? { ...q, ...updates } : q)
  })),
}));
```

**Persistent State:** Dexie.js (IndexedDB) for offline data persistence

**Server State:** React Query or Zustand + IndexedDB sync (current: Zustand + manual sync)

### Routing Architecture

**Client-Side Routing** (React Router 7.9.5):
```
/                          → Dashboard (quote list)
/quotes/new                → Create new quote
/quotes/:id                → View quote details
/quotes/:id/edit           → Edit quote
/settings                  → User settings
/prices                    → Price sheet management
/login                     → Authentication
```

**Route Protection:** Private routes require Cognito authentication

### Component Architecture

**Shared Components** (Design System):
- `Button` - Primary, secondary, ghost variants
- `Input` - Text, number, email, password
- `Select` - Dropdown with custom styling
- `Checkbox` - Custom-styled checkboxes
- `Radio` - Custom-styled radio buttons
- `Modal` - Dialog/modal windows
- `Card` - Content containers
- `Toast` - Notification system
- `Logo` - Brand logo variants

**Feature Components** (Domain-Specific):
- `QuoteEditor` - Quote creation/editing form
- `JobTypeForm` - 5 specialized job type forms (retaining wall, driveway, trenching, stormwater, site prep)
- `FinancialSummary` - Profit-First calculations display
- `ConflictResolver` - Sync conflict resolution UI

---

## Backend Architecture

### Directory Structure
```
backend/src/
├── features/              # Vertical slices (API endpoints)
│   ├── quotes/           # Quote CRUD & business logic
│   ├── jobs/             # Job type handling
│   ├── financials/       # Financial calculations
│   ├── prices/           # Price sheet management
│   ├── users/            # User management
│   └── sync/             # Sync conflict resolution
├── shared/               # Shared utilities
│   ├── middleware/       # Express middleware (auth, error handling)
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript type definitions
│   └── db/               # Database connection & migrations
├── routes/               # Route definitions (aggregates feature routes)
└── server.ts             # Express app entry point
```

### API Architecture

**RESTful API Design:**
```
POST   /api/quotes              Create new quote
GET    /api/quotes              List all quotes
GET    /api/quotes/:id          Get quote by ID
PUT    /api/quotes/:id          Update quote
DELETE /api/quotes/:id          Delete quote
POST   /api/quotes/:id/pdf      Generate PDF
```

**Authentication:** JWT tokens from AWS Cognito (verified via `aws-jwt-verify`)

**Authorization:** Role-based access control (RBAC)
- `admin` - Full access (create/read/update/delete)
- `user` - Standard access (create/read/update own quotes)

**Validation:** Zod schemas for request/response validation

**Error Handling:** Centralized error middleware with standard error codes

---

## Database Schema

**Primary Database:** PostgreSQL (via AWS RDS)

**ORM:** Drizzle ORM 0.44.7 (type-safe, lightweight)

### Core Tables

**1. quotes**
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  quote_number VARCHAR(20) UNIQUE NOT NULL,  -- Format: EE-YYYY-NNNN
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  job_type VARCHAR(50) NOT NULL,             -- retaining_wall, driveway, etc.
  status VARCHAR(50) DEFAULT 'draft',        -- draft, sent, approved, rejected
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  version INTEGER DEFAULT 1,                 -- For conflict resolution
  last_synced_at TIMESTAMP
);
```

**2. jobs**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL,
  parameters JSONB NOT NULL,                 -- Job-specific parameters
  created_at TIMESTAMP DEFAULT NOW()
);
```

**3. financials**
```sql
CREATE TABLE financials (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  raw_materials DECIMAL(10,2) NOT NULL,
  quote_price DECIMAL(10,2) NOT NULL,        -- raw_materials / 0.30
  profit_margin DECIMAL(5,2) DEFAULT 70.00,  -- 70% profit margin
  created_at TIMESTAMP DEFAULT NOW()
);
```

**4. price_sheets**
```sql
CREATE TABLE price_sheets (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  effective_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**5. price_items**
```sql
CREATE TABLE price_items (
  id UUID PRIMARY KEY,
  price_sheet_id UUID REFERENCES price_sheets(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,                 -- m³, tonne, m², etc.
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**6. quote_versions**
```sql
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,                   -- Full quote data at this version
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(quote_id, version)
);
```

**7. sync_logs**
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,          -- quote, price_sheet, etc.
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,               -- create, update, delete
  conflict BOOLEAN DEFAULT FALSE,
  resolution VARCHAR(50),                    -- auto, manual_local, manual_remote
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);
```

**8. users** (managed by Cognito, local cache)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',           -- admin, user
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### Indexing Strategy
```sql
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_by ON quotes(created_by);
CREATE INDEX idx_jobs_quote_id ON jobs(quote_id);
CREATE INDEX idx_financials_quote_id ON financials(quote_id);
CREATE INDEX idx_sync_logs_entity_id ON sync_logs(entity_id);
```

---

## Infrastructure

### Digital Ocean Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                          │
│         embark.rodda.xyz / api.embark.rodda.xyz             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ (Cloudflare DNS → DO Droplet)
                  ▼
┌──────────────────────────────────────────────────────────────┐
│          Digital Ocean Droplet: production-syd1              │
│                  IP: 170.64.169.203                          │
│              Plan: s-2vcpu-4gb (4GB RAM)                     │
│                  Region: Sydney (syd1)                       │
│  ┌───────────────────────────────────────────────────┐      │
│  │  Caddy (Reverse Proxy)                             │      │
│  │  - Auto-HTTPS via Let's Encrypt                    │      │
│  │  - embark.rodda.xyz → frontend static              │      │
│  │  - api.embark.rodda.xyz → backend:3000             │      │
│  └─────────────────┬─────────────────────────────────┘      │
│  ┌─────────────────▼─────────────────────────────────┐      │
│  │  Docker Container: Node.js Backend                 │      │
│  │  - Port 3000 (internal)                           │      │
│  │  - Health check: GET /health                       │      │
│  │  - Connects to PostgreSQL container               │      │
│  └─────────────────┬─────────────────────────────────┘      │
│  ┌─────────────────▼─────────────────────────────────┐      │
│  │  Docker Container: PostgreSQL                      │      │
│  │  - Port 5432 (internal only)                       │      │
│  │  - Database: embark_quoting                        │      │
│  └────────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────────┐      │
│  │  Docker Container: Frontend Static Files           │      │
│  │  - Served via Caddy                                │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘

                  ┌──────────────────────────────┐
                  │  🔴 Authentication NEEDED     │
                  │  (Cognito DELETED)            │
                  │  Options: Local JWT, Authentik│
                  └──────────────────────────────┘

**Infrastructure Notes:**
- Droplet managed via: ~/repos/do-vps-prod
- Shared with other services (Nextcloud, Joplin, etc.)
- Docker Compose for service orchestration
- Caddy handles SSL/TLS automatically
- Cost: ~$24/month (shared droplet)
- ⚠️ Authentication: DEV_AUTH_BYPASS mode available for testing
```

### Previous AWS Infrastructure (ARCHIVED - Nov 2025)

The AWS infrastructure has been **FULLY DELETED**. Terraform configurations remain in `terraform/` folder for historical reference only.

**Deleted AWS Resources:**
- CloudFront distributions
- ECS Fargate/EC2 instances
- RDS PostgreSQL
- ALB/NAT Gateway
- VPC Endpoints
- ECR repositories
- **Cognito User Pool (authentication)**
- S3 buckets
- Secrets Manager

---

## Security

### Authentication & Authorization

**Authentication:** 🔴 NEEDS IMPLEMENTATION

**Previous (Deleted):** AWS Cognito
- User pool for identity management
- JWT tokens for API authentication

**Current Options:**
1. **DEV_AUTH_BYPASS** - Enabled via environment variable for development/testing
2. **Local JWT Auth** - Implement custom JWT authentication with bcrypt passwords
3. **Authentik** - Self-hosted identity provider (could run on same droplet)
4. **Other** - Auth.js, Keycloak, etc.

**Authorization:** Role-Based Access Control (RBAC)
- Roles: `admin`, `user`
- Middleware: `requireAuth`, `requireRole`
- Quote ownership: Users can only modify their own quotes (unless admin)

### Data Security

**In Transit:**
- HTTPS/TLS for all API requests (CloudFront → backend)
- CloudFront HTTPS for frontend delivery
- Database connections encrypted (PostgreSQL SSL)

**At Rest:**
- RDS encryption enabled (AES-256)
- S3 bucket encryption enabled
- IndexedDB (local) - browser-managed encryption

**Secrets Management:**
- AWS Secrets Manager for sensitive credentials
- Environment variables injected into Docker containers
- No secrets in code or version control

### API Security

**Rate Limiting:** (Planned) Express rate limiter middleware
**CORS:** Configured for specific origins only
**Input Validation:** Zod schemas on all endpoints
**SQL Injection Prevention:** Drizzle ORM parameterized queries
**XSS Prevention:** React auto-escaping + Content Security Policy

### Access Control

**Network Security:**
- VPC with public subnet for EC2 (staging)
- Security groups restrict inbound traffic to necessary ports
- Backend accessed via public IP (staging) or ALB (production)
- Database runs internally in Docker container (no external access)

**IAM Policies:**
- Least privilege principle
- EC2 instance roles for AWS service access only (Secrets Manager, ECR)
- Separate roles for deployment (GitHub Actions OIDC)

---

## Offline-First Strategy

### Local-First Data Flow

**Write Path:**
```
User Action
    ↓
1. Validate input (client-side)
    ↓
2. Write to IndexedDB (instant, local)
    ↓
3. Update UI (optimistic update)
    ↓
4. Queue for sync (background)
    ↓
5. Sync to cloud when online (background)
    ↓
6. Handle conflicts if any
```

**Read Path:**
```
User Request
    ↓
1. Read from IndexedDB (instant, offline-capable)
    ↓
2. Display to user
    ↓
3. Fetch updates from cloud (background, when online)
    ↓
4. Merge updates into IndexedDB
    ↓
5. Re-render UI if data changed
```

### Sync Engine (Epic 5)

**Sync Strategy:**
- **Trigger:** Periodic interval (5 min) + app focus + manual sync
- **Direction:** Bidirectional (local ↔ cloud)
- **Conflict Resolution:**
  - **Critical fields:** Manual resolution (customer contact, status, financials, job parameters)
  - **Non-critical fields:** Auto-merge (notes, metadata, timestamps)

**Conflict Detection:**
- Version numbers in database
- Last-modified timestamps
- Cryptographic hashes (optional, for performance)

**Implementation:**
```typescript
// Simplified sync flow
async function syncQuotes() {
  const localQuotes = await quoteDb.getAll();
  const cloudQuotes = await api.getQuotes({ since: lastSyncTime });

  for (const local of localQuotes) {
    const cloud = cloudQuotes.find(q => q.id === local.id);

    if (!cloud) {
      // New local quote → push to cloud
      await api.createQuote(local);
    } else if (local.version > cloud.version) {
      // Local is newer → push to cloud
      await api.updateQuote(local.id, local);
    } else if (cloud.version > local.version) {
      // Cloud is newer → pull to local
      await quoteDb.update(cloud.id, cloud);
    } else if (local.updatedAt !== cloud.updatedAt) {
      // Same version but different data → CONFLICT
      await resolveConflict(local, cloud);
    }
  }
}
```

### IndexedDB Schema (Dexie.js)

```typescript
// frontend/src/shared/db/schema.ts
import Dexie from 'dexie';

export class EmbarkDatabase extends Dexie {
  quotes!: Dexie.Table<Quote, string>;
  jobs!: Dexie.Table<Job, string>;
  financials!: Dexie.Table<Financial, string>;
  prices!: Dexie.Table<PriceItem, string>;
  syncQueue!: Dexie.Table<SyncQueueItem, string>;

  constructor() {
    super('EmbarkQuotingDB');

    this.version(1).stores({
      quotes: 'id, quoteNumber, status, createdAt, lastSyncedAt',
      jobs: 'id, quoteId, jobType',
      financials: 'id, quoteId',
      prices: 'id, name, effectiveDate',
      syncQueue: '++id, entityType, entityId, action, status'
    });
  }
}

export const db = new EmbarkDatabase();
```

---

## Deployment Architecture

### CI/CD Pipeline (GitHub Actions)

**Current Workflows:**
1. **validate.yml** - Lint, format, typecheck
2. **build.yml** - Build frontend & backend Docker images
3. **test.yml** - Run unit tests
4. **e2e-tests.yml** - Run E2E tests (manual or called from other workflows)
5. **enforce-main-pr-source.yml** - Branch protection (ensures main only gets PRs from dev)

**⚠️ Workflows Need Update:**
- Current workflows reference AWS infrastructure (ECR, ECS, etc.)
- Need to update for Digital Ocean deployment
- See GitHub Issues for migration tasks

**Branch Strategy:**
- `feature/*` → `dev` (PR with CI validation)
- `fix/*` → `dev` (PR with CI validation)
- `hotfix/*` → `dev` (PR with CI validation)
- `dev` → `main` (PR only - enforced by workflow)

**Deployment Strategy:**
- **Production**: Manual deployment to Digital Ocean droplet
- **Rationale**: Simpler infrastructure, direct SSH/rsync deployment

**Environment Variables:**
- Stored in GitHub Secrets (need update for DO)
- Backend: `.env` file on droplet
- Frontend: Build-time environment variables

### Manual Deployment Process (Digital Ocean)

**Frontend (Static Site):**
1. Build React app with Vite (`npm run build`)
2. Copy `dist/` to droplet via rsync/scp
3. Caddy serves static files automatically
4. Manual verification at https://embark.rodda.xyz

**Backend (Docker Container):**
1. Build Docker image from `backend/Dockerfile`
2. Push to Docker Hub or build on droplet
3. SSH into droplet: `ssh root@170.64.169.203`
4. Pull/build latest image
5. Update docker-compose.yml
6. Restart services: `docker-compose up -d`
7. Manual health check: `curl https://api.embark.rodda.xyz/health`

### Environment Configuration

**Production (Digital Ocean):**
- Frontend: https://embark.rodda.xyz
- Backend API: https://api.embark.rodda.xyz
- Database: PostgreSQL (Docker container on droplet)
- Droplet IP: 170.64.169.203
- Branch: `main` (or `dev` for testing)

**Local Development:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Database: PostgreSQL via Docker (`embark-dev-db`)

---

## Design System

### Design Philosophy: "Industrial Clarity"

**Principles:**
- **Brutalist Honesty:** Function over decoration
- **Swiss Precision:** Systematic spacing, clear hierarchy
- **Material Integrity:** Limited palette, purposeful color use
- **Monumental Simplicity:** Bold typography, generous whitespace

### Design Tokens

**Colors:**
- Primary Accent: `#FFB400` (CAT Gold - earthmoving industry recognition)
- Background: `#FFFFFF` (pure white canvas)
- Text: `#1A1A1A` (near-black for readability)
- Semantic: Success (#10B981), Warning (#F59E0B), Error (#DC2626), Info (#3B82F6)

**Typography:**
- Font Stack: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- Type Scale: 1.25 ratio (48px, 40px, 32px, 24px, 20px, 16px, 14px, 12px)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Spacing:**
- Base Grid: 8px system
- Scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px
- Gutters: Responsive (6vw mobile, 5vw tablet, 4vw desktop)

**Shadows:**
- Subtle depth without decoration
- Scale: sm (1px), md (2px), lg (4px), xl (8px)

**Motion:**
- Durations: instant (100ms), fast (200ms), base (300ms), slow (500ms)
- Easing: Standard (cubic-bezier), decelerate (entrances), accelerate (exits)

### Component Library

**Design System Location:** `/frontend/src/shared/components/`
**Documentation:** Storybook (55+ story variants)
**Accessibility:** WCAG AA compliant (33 axe-core tests passing)

**Core Components:**
- Button (primary, secondary, ghost, sizes)
- Input (text, number, email, password)
- Select (custom-styled dropdown)
- Checkbox, Radio (custom-styled)
- Modal (dialog windows)
- Card (content containers)
- Toast (notifications)
- Logo (brand variants)

---

## Architecture Decision Records

### ADR-001: Offline-First Over Cloud-First
**Date:** 2024 (during planning)
**Status:** Accepted

**Context:** Field workers often lack reliable internet connectivity.

**Decision:** Implement offline-first architecture with IndexedDB as primary data store, cloud as backup/sync target.

**Consequences:**
- ✅ Full functionality without internet
- ✅ Instant user interactions (no network latency)
- ❌ Increased complexity (sync conflicts, data consistency)
- ❌ Browser storage limitations (IndexedDB quota)

**Alternatives Considered:**
- Cloud-first with offline cache (rejected - degraded offline experience)
- Native mobile app (rejected - cross-platform maintenance burden)

---

### ADR-002: Vertical Slice Architecture Over Layered Architecture
**Date:** 2024 (during planning)
**Status:** Accepted

**Context:** Need clear feature boundaries, support independent development, reduce coupling.

**Decision:** Organize code by feature (vertical slices) rather than by layer (controllers, services, models).

**Consequences:**
- ✅ Feature autonomy and independence
- ✅ Easier to understand and modify features
- ✅ Reduced coupling between features
- ❌ Some code duplication (each feature has own DB access)
- ❌ Shared logic requires careful extraction

**Alternatives Considered:**
- Traditional layered architecture (rejected - tight coupling)
- Microservices (rejected - overkill for MVP, operational complexity)

---

### ADR-003: React Over Vue/Angular
**Date:** 2024 (during planning)
**Status:** Accepted

**Context:** Need modern, well-supported frontend framework with strong ecosystem.

**Decision:** Use React 19 with TypeScript.

**Consequences:**
- ✅ Large ecosystem, extensive libraries
- ✅ Strong TypeScript support
- ✅ Team familiarity
- ❌ Verbose compared to Vue
- ❌ Requires state management library (Zustand)

**Alternatives Considered:**
- Vue.js (rejected - smaller ecosystem)
- Svelte (rejected - less mature, smaller community)
- Angular (rejected - too heavyweight for use case)

---

### ADR-004: Zustand Over Redux/MobX
**Date:** 2024 (during planning)
**Status:** Accepted

**Context:** Need lightweight state management for offline-first app.

**Decision:** Use Zustand for global state management.

**Consequences:**
- ✅ Minimal boilerplate (compared to Redux)
- ✅ TypeScript-first design
- ✅ Small bundle size (<1KB)
- ❌ Smaller ecosystem than Redux
- ❌ Less prescriptive (team must establish patterns)

**Alternatives Considered:**
- Redux Toolkit (rejected - too much boilerplate)
- MobX (rejected - reactive paradigm less familiar)
- React Context (rejected - insufficient for complex state)

---

### ADR-005: PostgreSQL Over DynamoDB
**Date:** 2024 (during planning)
**Status:** Accepted

**Context:** Need relational data (quotes, jobs, financials), complex queries, ACID transactions.

**Decision:** Use PostgreSQL (AWS RDS) for cloud database.

**Consequences:**
- ✅ Relational data model fits domain perfectly
- ✅ ACID transactions for financial data
- ✅ Mature ecosystem, SQL familiarity
- ❌ Higher cost than DynamoDB (no free tier after 12 months)
- ❌ Scaling requires more planning than DynamoDB

**Alternatives Considered:**
- DynamoDB (rejected - awkward for relational data)
- MongoDB (rejected - no need for document flexibility)
- MySQL (rejected - PostgreSQL has better JSON support)

---

### ADR-006: Tailwind CSS Over Styled Components
**Date:** 2024 (during planning)
**Status:** Accepted (⚠️ Implementation incomplete - color scheme mismatch)

**Context:** Need efficient, maintainable styling system aligned with design tokens.

**Decision:** Use Tailwind CSS configured with design system tokens.

**Consequences:**
- ✅ Utility-first approach (faster development)
- ✅ Small bundle size (purges unused styles)
- ✅ Consistent design system adherence
- ❌ Verbose className strings
- ⚠️ **Current Issue:** Blue theme in index.css, should be CAT Gold

**Alternatives Considered:**
- Styled Components (rejected - runtime overhead)
- CSS Modules (rejected - less systematic)
- Emotion (rejected - similar to Styled Components)

---

### ADR-007: Cognito Over Auth0
**Date:** 2024 (during planning)
**Status:** Accepted

**Context:** Need user authentication and management.

**Decision:** Use AWS Cognito for authentication.

**Consequences:**
- ✅ Native AWS integration (no third-party service)
- ✅ Free tier (50,000 MAU)
- ✅ JWT tokens for stateless auth
- ❌ Less flexible than Auth0
- ❌ UI customization limited

**Alternatives Considered:**
- Auth0 (rejected - additional cost, third-party dependency)
- Roll-your-own auth (rejected - security risk, maintenance burden)
- Firebase Auth (rejected - requires Firebase ecosystem)

---

### ADR-008: Migration from AWS to Digital Ocean
**Date:** 2025-11-27
**Status:** Accepted

**Context:** AWS infrastructure costs were ~$100-200/month for staging/production. Team already operates a Digital Ocean droplet for personal services. Simpler deployment model desired.

**Decision:** Migrate from AWS (ECS/EC2, RDS, CloudFront) to Digital Ocean VPS with Docker Compose.

**Consequences:**
- ✅ Significant cost reduction (~$24/month shared droplet vs ~$100+/month AWS)
- ✅ Simpler deployment model (SSH + Docker Compose)
- ✅ Unified infrastructure management
- ✅ No complex IaC (Terraform) needed
- ❌ Less scalability than AWS auto-scaling
- ❌ Single point of failure (one droplet)
- 🔴 **Authentication needs new solution** (Cognito deleted - see options in Security section)

**Implementation:**
- Frontend: https://embark.rodda.xyz (Caddy static files)
- Backend: https://api.embark.rodda.xyz (Docker container)
- Database: PostgreSQL (Docker container)
- Reverse Proxy: Caddy (auto-HTTPS)
- Authentication: 🔴 Needs implementation (DEV_AUTH_BYPASS available for testing)

**Alternatives Considered:**
- Keep AWS infrastructure (rejected - too expensive for current usage)
- Vercel/Netlify for frontend + separate backend (rejected - split infrastructure)
- Render/Railway (rejected - existing DO droplet available)

---

## Update History

| Date | Updated By | Changes |
|------|------------|---------|
| 2025-11-09 | Claude Code | Initial ARCHITECTURE.md creation |
| 2025-11-27 | Claude Code | AWS → Digital Ocean migration: Updated infrastructure diagrams, deployment processes, added ADR-008 |

---

**Note:** Update this document when making significant architectural changes. Add new ADRs when making impactful technical decisions. Review quarterly for accuracy.
