import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const { Pool } = pg;

async function runMigration() {
  // Debug: Log environment variables
  console.log('🔍 Environment check:');
  console.log('  DB_HOST:', process.env.DB_HOST || 'UNDEFINED');
  console.log('  COGNITO_USER_POOL_ID:', process.env.COGNITO_USER_POOL_ID || 'UNDEFINED');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'UNDEFINED');

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

  const pool = new Pool({
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
  });

  const db = drizzle(pool);

  console.log('🔄 Running database migrations...');

  try {
    await migrate(db, { migrationsFolder: './database/migrations' });
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
