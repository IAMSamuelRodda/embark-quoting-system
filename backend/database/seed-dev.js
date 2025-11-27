/**
 * Seed Development Database
 *
 * Seeds the development database with:
 * - Admin user
 * - Price sheet with common materials
 * - Sample quote (optional)
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users, priceSheets, priceItems } from '../src/shared/db/schema.js';
import { DEFAULT_SETTINGS } from '../src/features/financials/settings.repository.js';

const { Pool } = pg;

const ADMIN_USER_ID = 'b0000000-0000-0000-0000-000000000001';

async function seedDevDatabase() {
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

  const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: shouldUseSSL ? { rejectUnauthorized: false } : false }
    : {
        host: dbHost,
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'embark_quoting',
        ssl: shouldUseSSL ? { rejectUnauthorized: false } : false,
      };

  const pool = new Pool(connectionConfig);
  const db = drizzle(pool);

  console.log('🌱 Seeding development database...');

  try {
    // Insert admin user
    const existingUsers = await db.select().from(users).where(users.email === 'admin@embarklandscaping.com.au');

    let userId = ADMIN_USER_ID;

    if (existingUsers.length === 0) {
      const [user] = await db
        .insert(users)
        .values({
          id: ADMIN_USER_ID,
          cognito_id: 'dev_admin_cognito_id',
          email: 'admin@embarklandscaping.com.au',
          name: 'Admin User',
          role: 'admin',
          preferences: {},
        })
        .returning();
      console.log('  ✓ Admin user created');
      userId = user.id;
    } else {
      console.log('  ℹ️  Admin user already exists');
      userId = existingUsers[0].id;
    }

    // Insert price sheet
    const existingSheets = await db.select().from(priceSheets);

    let priceSheetId;

    if (existingSheets.length === 0) {
      const [sheet] = await db
        .insert(priceSheets)
        .values({
          version: 1,
          created_by: userId,
          defaults: DEFAULT_SETTINGS,
        })
        .returning();
      console.log('  ✓ Price sheet created');
      priceSheetId = sheet.id;
    } else {
      console.log('  ℹ️  Price sheet already exists, using existing');
      priceSheetId = existingSheets[0].id;
    }

    // Insert price items
    const existingItems = await db.select().from(priceItems).where(priceItems.price_sheet_id === priceSheetId);

    if (existingItems.length === 0) {
      const items = [
        // Retaining wall materials
        { name: 'block', price: '12.50', unit: 'per block', notes: 'Standard concrete retaining wall block' },
        { name: 'road base', price: '45.00', unit: 'm³', notes: 'Compacted road base' },
        { name: 'ag pipe', price: '8.50', unit: 'm', notes: '100mm AG pipe drainage' },
        { name: 'orange plastic', price: '3.20', unit: 'm', notes: 'Orange plastic membrane' },

        // Driveway materials
        { name: '20mm gravel', price: '55.00', unit: 'm³', notes: '20mm gravel topping' },

        // Stormwater materials
        { name: 'pvc 90mm pipe', price: '12.00', unit: 'm', notes: 'PVC 90mm stormwater pipe' },
        { name: 't-joint', price: '18.00', unit: 'unit', notes: 'PVC T-joint fitting' },
        { name: 'elbow', price: '15.00', unit: 'unit', notes: 'PVC 90-degree elbow' },
        { name: 'downpipe adaptor', price: '22.00', unit: 'unit', notes: 'Downpipe to stormwater adaptor' },

        // Site prep materials
        { name: 'paving sand', price: '65.00', unit: 'm³', notes: 'Fine paving sand' },

        // Labour
        { name: 'labour rate', price: '85.00', unit: 'per hour', notes: 'Standard labour rate' },
      ];

      for (const item of items) {
        await db.insert(priceItems).values({
          price_sheet_id: priceSheetId,
          ...item,
        });
      }

      console.log(`  ✓ ${items.length} price items created`);
    } else {
      console.log(`  ℹ️  ${existingItems.length} price items already exist`);
    }

    console.log('✅ Development database seeded successfully');
    console.log('\n📊 Summary:');
    console.log(`   Admin user: admin@embarklandscaping.com.au`);
    console.log(`   Price sheet ID: ${priceSheetId}`);
    console.log(`   Price items: ${existingItems.length > 0 ? existingItems.length : items.length}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDevDatabase();
