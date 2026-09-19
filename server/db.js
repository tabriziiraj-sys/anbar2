import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { eq, and, sql, desc, asc, like, gte, lte } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import config from './config.js';

// Ensure data directory exists
const dbDir = path.dirname(config.dbFile);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite connection with optimizations
const sqlite = new Database(config.dbFile);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

// ============ AUTH SCHEMA (Better Auth) ============
export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).default(false),
  image: text('image'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
  role: text('role').default('user'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('banReason'),
  banExpires: integer('banExpires'),
});

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: text('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonatedBy'),
});

export const accounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: text('accessTokenExpiresAt'),
  refreshTokenExpiresAt: text('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expiresAt').notNull(),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
});

// ============ BUSINESS SCHEMA ============
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const units = sqliteTable('units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const warehouses = sqliteTable('warehouses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  barcode: text('barcode'),
  categoryId: integer('categoryId').references(() => categories.id),
  unitId: integer('unitId').references(() => units.id),
  minStock: real('minStock').default(0),
  description: text('description'),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const inventoryDocuments = sqliteTable('inventory_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  documentNumber: text('documentNumber').notNull().unique(),
  type: text('type').notNull(), // IN, OUT, ADJUSTMENT
  date: text('date').notNull(),
  warehouseId: integer('warehouseId').notNull().references(() => warehouses.id),
  description: text('description'),
  createdBy: text('createdBy').notNull().references(() => users.id),
  createdAt: text('createdAt').notNull(),
});

export const inventoryDocumentItems = sqliteTable('inventory_document_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  documentId: integer('documentId').notNull().references(() => inventoryDocuments.id, { onDelete: 'cascade' }),
  productId: integer('productId').notNull().references(() => products.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unitPrice'),
});

// ============ RELATIONS ============
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  unit: one(units, { fields: [products.unitId], references: [units.id] }),
}));

export const inventoryDocumentsRelations = relations(inventoryDocuments, ({ one, many }) => ({
  warehouse: one(warehouses, { fields: [inventoryDocuments.warehouseId], references: [warehouses.id] }),
  creator: one(users, { fields: [inventoryDocuments.createdBy], references: [users.id] }),
  items: many(inventoryDocumentItems),
}));

export const inventoryDocumentItemsRelations = relations(inventoryDocumentItems, ({ one }) => ({
  document: one(inventoryDocuments, { fields: [inventoryDocumentItems.documentId], references: [inventoryDocuments.id] }),
  product: one(products, { fields: [inventoryDocumentItems.productId], references: [products.id] }),
}));

// ============ DRIZZLE DB INSTANCE ============
export const db = drizzle(sqlite, {
  schema: {
    users, sessions, accounts, verifications,
    categories, units, warehouses, products,
    inventoryDocuments, inventoryDocumentItems,
    productsRelations, inventoryDocumentsRelations, inventoryDocumentItemsRelations,
  }
});

export { sqlite, eq, and, sql, desc, asc, like, gte, lte };

// ============ MIGRATION ============
export function runMigrations() {
  console.log('Running database migrations...');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      emailVerified INTEGER DEFAULT 0,
      image TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      banned INTEGER DEFAULT 0,
      banReason TEXT,
      banExpires INTEGER
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      impersonatedBy TEXT
    );

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      accessTokenExpiresAt TEXT,
      refreshTokenExpiresAt TEXT,
      scope TEXT,
      password TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      barcode TEXT,
      categoryId INTEGER REFERENCES categories(id),
      unitId INTEGER REFERENCES units(id),
      minStock REAL DEFAULT 0,
      description TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documentNumber TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      warehouseId INTEGER NOT NULL REFERENCES warehouses(id),
      description TEXT,
      createdBy TEXT NOT NULL REFERENCES user(id),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_document_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documentId INTEGER NOT NULL REFERENCES inventory_documents(id) ON DELETE CASCADE,
      productId INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      unitPrice REAL
    );
  `);

  console.log('Migrations completed.');
}

// ============ SEED ============
export function seedData(adminUserId) {
  console.log('Seeding initial data...');

  // Categories
  const existingCategories = sqlite.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (existingCategories.count === 0) {
    const now = new Date().toISOString();
    const insertCat = sqlite.prepare('INSERT INTO categories (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)');
    insertCat.run('لوازم اداری', 'کاغذ، خودکار، پوشه و...', now, now);
    insertCat.run('کالای مصرفی', 'مواد شوینده، بهداشتی و...', now, now);
    insertCat.run('قطعات', 'قطعات یدکی و فنی', now, now);
    console.log('Categories seeded.');
  }

  // Units
  const existingUnits = sqlite.prepare('SELECT COUNT(*) as count FROM units').get();
  if (existingUnits.count === 0) {
    const now = new Date().toISOString();
    const insertUnit = sqlite.prepare('INSERT INTO units (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)');
    insertUnit.run('عدد', 'واحد شمارشی', now, now);
    insertUnit.run('بسته', 'بسته‌بندی', now, now);
    insertUnit.run('کیلوگرم', 'وزن', now, now);
    insertUnit.run('متر', 'طول', now, now);
    console.log('Units seeded.');
  }

  // Warehouses
  const existingWarehouses = sqlite.prepare('SELECT COUNT(*) as count FROM warehouses').get();
  if (existingWarehouses.count === 0) {
    const now = new Date().toISOString();
    sqlite.prepare('INSERT INTO warehouses (code, name, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)')
      .run('WH-001', 'انبار مرکزی', 'انبار اصلی شرکت', 1, now, now);
    console.log('Warehouses seeded.');
  }

  // Sample Products
  const existingProducts = sqlite.prepare('SELECT COUNT(*) as count FROM products').get();
  if (existingProducts.count === 0 && adminUserId) {
    const now = new Date().toISOString();
    const insertProd = sqlite.prepare('INSERT INTO products (code, name, barcode, categoryId, unitId, minStock, description, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertProd.run('PRD-001', 'کاغذ A4', '6200000001', 1, 2, 5, 'بسته کاغذ A4', 1, now, now);
    insertProd.run('PRD-002', 'خودکار آبی', '6200000002', 1, 1, 20, 'خودکار آبی معمولی', 1, now, now);
    insertProd.run('PRD-003', 'مایع ظرفشویی', '6200000003', 2, 1, 3, 'مایع ظرفشویی یک لیتری', 1, now, now);
    insertProd.run('PRD-004', 'پیچ M6', '6200000004', 3, 1, 50, 'پیچ شش‌گوش M6', 1, now, now);
    console.log('Products seeded.');
  }

  console.log('Seed completed.');
}
