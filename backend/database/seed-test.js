/**
 * Seed Test Database
 *
 * Seeds the test database with default settings required by integration tests
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { priceSheets } from '../src/shared/db/schema.js';
import { DEFAULT_SETTINGS } from '../src/features/financials/settings.repository.js';

const { Pool } = pg;

async function seedTestDatabase() {
  // Support DATABASE_URL (CI) or individual env vars (local)
  const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'embark_quoting_test',
      };

  const pool = new Pool(connectionConfig);
  const db = drizzle(pool);

  console.log('🌱 Seeding test database with default settings...');

  try {
    // Insert default price sheet with a test user ID
    await db.insert(priceSheets).values({
      version: 1,
      created_by: '00000000-0000-0000-0000-000000000000', // Test user UUID
      defaults: DEFAULT_SETTINGS,
    });

    console.log('✅ Test database seeded successfully');
  } catch (error) {
    // If price sheet already exists, that's OK
    if (error.code === '23505') {
      console.log('ℹ️  Default settings already exist');
    } else {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

seedTestDatabase();
