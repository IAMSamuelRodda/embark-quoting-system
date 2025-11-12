/**
 * Add E2E Test User to Database
 * Run from backend directory: node /tmp/add-test-user.js
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import { users } from '../src/shared/db/schema.js';

const { Pool } = pg;

const TEST_USER_ID = '197ea428-5011-7073-7d0b-b48d03a748d2';

async function addTestUser() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'embark_quoting_dev',
  };

  const pool = new Pool(connectionConfig);
  const db = drizzle(pool);

  console.log('Adding E2E test user to database...');

  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.id, TEST_USER_ID));

    if (existingUser.length > 0) {
      console.log('✓ Test user already exists');
    } else {
      await db.insert(users).values({
        id: TEST_USER_ID,
        cognito_id: TEST_USER_ID,
        email: 'testuser@embarkquoting.local',
        name: 'E2E Test User',
        role: 'field_worker', // Valid roles: 'admin' or 'field_worker'
        preferences: {},
      });
      console.log('✓ Test user added successfully');
    }
  } catch (error) {
    console.error('❌ Failed to add test user:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addTestUser();
