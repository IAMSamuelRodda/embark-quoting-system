import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection, closePool } from './shared/db/postgres.js';

// Debug: Check environment variables before importing routes
console.log('🔍 Environment variables at startup:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'UNDEFINED');
console.log('  DB_HOST:', process.env.DB_HOST || 'UNDEFINED');
console.log('  COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID || 'UNDEFINED');
console.log('  COGNITO_CLIENT_ID:', process.env.COGNITO_CLIENT_ID || 'UNDEFINED');

import quotesRoutes from './features/quotes/quotes.routes.js';
import jobsRoutes from './features/jobs/jobs.routes.js';
import settingsRoutes from './features/financials/settings.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  }),
);
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Skip database check if SKIP_DB_CHECK is set (smoke tests)
    let dbStatus = 'skipped';
    let dbConnected = true; // Default to true for smoke tests

    if (process.env.SKIP_DB_CHECK !== 'true') {
      dbConnected = await testConnection();
      dbStatus = dbConnected ? 'connected' : 'disconnected';
    }

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'embark-quoting-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'embark-quoting-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'error',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/quotes', quotesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/settings', settingsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Embark Quoting System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      quotes: '/api/quotes',
      jobs: '/api/jobs',
      settings: '/api/settings',
      docs: 'See README.md for API documentation',
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  await closePool();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Test database connection (skip for smoke tests)
    if (process.env.SKIP_DB_CHECK !== 'true') {
      console.log('🔗 Testing database connection...');
      await testConnection();
    } else {
      console.log('⚠️  Skipping database connection check (SKIP_DB_CHECK=true)');
    }

    // Start HTTP server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Embark Quoting Backend running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
