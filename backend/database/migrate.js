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

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // SSL configuration for RDS (same as postgres.js)
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST?.includes('rds.amazonaws.com')
      ? { rejectUnauthorized: false }
      : false,
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
