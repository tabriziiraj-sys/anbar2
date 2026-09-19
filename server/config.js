import dotenv from 'dotenv';
dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  dbFile: process.env.DB_FILE || './data/inventory.sqlite',
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  admin: {
    name: process.env.ADMIN_NAME || 'System Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  },
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export const DOCUMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
};

export const DOCUMENT_TYPE_LABELS = {
  IN: 'ورود',
  OUT: 'خروج',
  ADJUSTMENT: 'اصلاح موجودی',
};

export default config;
