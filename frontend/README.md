# Embark Quoting System - Frontend

React Progressive Web App (PWA) for offline-first quoting.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Routing**: React Router v7
- **Authentication**: AWS Cognito (amazon-cognito-identity-js)
- **Offline Storage**: Dexie (IndexedDB wrapper)
- **PWA**: vite-plugin-pwa + Workbox

## Project Structure

```
src/
├── features/           # Vertical slices (feature-based organization)
│   └── auth/          # Authentication feature
│       ├── LoginPage.tsx
│       ├── SignupPage.tsx
│       ├── useAuth.ts      # Zustand store
│       └── authService.ts  # Cognito integration
├── pages/             # Top-level pages
│   └── DashboardPage.tsx
├── App.tsx            # Root component with routing
├── main.tsx           # Entry point
└── index.css          # Global styles + Tailwind

```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Authentication

Uses AWS Cognito User Pool:
- **Pool ID**: `ap-southeast-2_WCrUlLwIE`
- **Client ID**: `61p5378jhhm40ud2m92m3kv7jv`
- **Region**: ap-southeast-2

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one number

## PWA Features

- **Offline-first**: App works fully offline after initial load
- **Install prompt**: Users can install on home screen (iOS/Android)
- **Service Worker**: Automatic caching of app shell and assets
- **Cognito caching**: Network-first strategy for auth requests

## Development Notes

### Vertical Slice Architecture

Each feature is self-contained with:
- **UI components** (LoginPage.tsx)
- **State management** (useAuth.ts)
- **Business logic** (authService.ts)
- **Database operations** (featureDb.ts - future)

This keeps related code together instead of separating by technical layer.

### Offline Strategy

1. **Initial load**: Requires network (Cognito auth)
2. **After login**: App shell cached, works offline
3. **Future features**: IndexedDB for local data storage

## Current Status

✅ **Feature 1.4 Complete**: Frontend Auth Slice
- React PWA scaffold
- Login/Signup pages
- Cognito integration
- Service worker setup
- Mobile-optimized UI

🚧 **Next**: Epic 2 - Quote Management (offline CRUD)
