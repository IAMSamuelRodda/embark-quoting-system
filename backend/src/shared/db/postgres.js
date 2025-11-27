import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;

// Support both DATABASE_URL (CI/prod) and individual env vars (local dev)
function getPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl:
        process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.includes('localhost')
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  // Check if SSL should be enabled:
  // - AWS RDS requires SSL
  // - Local Docker containers (localhost, container names) don't support SSL
  const dbHost = process.env.DB_HOST || 'localhost';
  const isLocalDb =
    dbHost === 'localhost' ||
    dbHost === '127.0.0.1' ||
    dbHost.includes('embark_db') ||
    !dbHost.includes('.');
  const shouldUseSSL = !isLocalDb && (process.env.NODE_ENV === 'production' || dbHost.includes('rds.amazonaws.com'));

  return {
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'embark_quoting_staging',
    user: process.env.DB_USER || 'embark_admin',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
  };
}

// Create PostgreSQL connection pool
export const pool = new Pool(getPoolConfig());

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Create Drizzle instance
export const db = drizzle(pool);

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
    console.log(`📅 Server time: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Graceful shutdown
export async function closePool() {
  try {
    await pool.end();
    console.log('✅ Database pool closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
}
