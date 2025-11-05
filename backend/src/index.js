import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection, closePool } from './shared/db/postgres.js';
import quotesRoutes from './features/quotes/quotes.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.status(200).json({
      status: dbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'embark-quoting-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'embark-quoting-backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'error',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/quotes', quotesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Embark Quoting System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      quotes: '/api/quotes',
      docs: 'See README.md for API documentation'
    }
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
    // Test database connection
    console.log('🔗 Testing database connection...');
    await testConnection();

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
