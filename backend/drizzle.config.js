import 'dotenv/config';

// Support both DATABASE_URL (CI) and individual env vars (local)
function getDbCredentials() {
  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'embark_admin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'embark_quoting_staging',
  };
}

export default {
  schema: './src/shared/db/schema.js',
  out: './database/migrations',
  dialect: 'postgresql',
  dbCredentials: getDbCredentials(),
};
