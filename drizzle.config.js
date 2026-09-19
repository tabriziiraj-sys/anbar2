import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db.js',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: process.env.DB_FILE || './data/inventory.sqlite',
  },
});
