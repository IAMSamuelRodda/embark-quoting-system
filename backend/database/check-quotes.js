import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { quotes } from '../src/shared/db/schema.js';

const { Pool } = pg;

async function checkQuotes() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'embark_quoting_dev',
  });

  const db = drizzle(pool);

  try {
    const allQuotes = await db.select().from(quotes);
    console.log(`Total quotes in database: ${allQuotes.length}`);
    if (allQuotes.length > 0) {
      console.log('\nRecent quotes:');
      allQuotes.slice(-5).forEach(q => {
        console.log(`  - ${q.id} | ${q.customer_name} | ${q.status} | ${q.created_at}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkQuotes();
