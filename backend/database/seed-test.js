/**
 * Seed Test Database
 *
 * Seeds the test database with default settings required by integration tests
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users, priceSheets } from '../src/shared/db/schema.js';
import { DEFAULT_SETTINGS } from '../src/features/financials/settings.repository.js';

const { Pool } = pg;

const TEST_USER_ID = '00000000-0000-0000-0000-000000000000';

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

  console.log('🌱 Seeding test database...');

  try {
    // Insert test user (required for foreign key constraints)
    await db.insert(users).values({
      id: TEST_USER_ID,
      cognito_id: 'test_cognito_id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      preferences: {},
    });
    console.log('  ✓ Test user created');

    // Insert default price sheet
    await db.insert(priceSheets).values({
      version: 1,
      created_by: TEST_USER_ID,
      defaults: DEFAULT_SETTINGS,
    });
    console.log('  ✓ Default settings created');

    console.log('✅ Test database seeded successfully');
  } catch (error) {
    // If already exists, that's OK (idempotent)
    if (error.code === '23505') {
      console.log('ℹ️  Seed data already exists');
    } else {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

seedTestDatabase();
