/**
 * Integration Test: Database Connection
 *
 * Demonstrates integration testing with PostgreSQL
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import pkg from 'pg';
const { Pool } = pkg;

describe('Database Integration Tests', () => {
  let pool;

  beforeAll(async () => {
    // Create a test database connection
    // In real tests, you would use a separate test database
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'embark_quotes',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  });

  afterAll(async () => {
    // Clean up database connection
    if (pool) {
      await pool.end();
    }
  });

  it('should connect to the database', async () => {
    // Test basic connectivity
    const client = await pool.connect();
    expect(client).toBeDefined();
    client.release();
  });

  it('should execute a simple query', async () => {
    const result = await pool.query('SELECT 1 as test');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].test).toBe(1);
  });

  it('should check if quotes table exists', async () => {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'quotes'
      ) as table_exists
    `);

    expect(result.rows).toHaveLength(1);
    expect(typeof result.rows[0].table_exists).toBe('boolean');
  });

  it('should verify database connection info', async () => {
    const result = await pool.query('SELECT version(), current_database()');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].version).toContain('PostgreSQL');
    expect(result.rows[0].current_database).toBeDefined();
  });
});
