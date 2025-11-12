import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users } from '../src/shared/db/schema.js';
import { eq } from 'drizzle-orm';

const { Pool } = pg;

async function checkUser() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'embark_quoting_dev',
  });

  const db = drizzle(pool);

  try {
    // Check all users
    const allUsers = await db.select().from(users);
    console.log('All users in database:');
    allUsers.forEach(u => console.log(`  - ${u.id} | ${u.email} | ${u.name}`));

    // Check specific user
    const testUserId = '197ea428-5011-7073-7d0b-b48d03a748d2';
    const testUser = await db.select().from(users).where(eq(users.id, testUserId));
    console.log(`\nTest user (${testUserId}):`, testUser.length > 0 ? 'EXISTS' : 'NOT FOUND');
    if (testUser.length > 0) {
      console.log('  Details:', testUser[0]);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
