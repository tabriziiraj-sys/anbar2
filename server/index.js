import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import { runMigrations, seedData } from './db.js';
import { ensureAdminExists } from './auth.js';
import { errorHandler } from './middleware.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import referenceDataRoutes from './routes/reference-data.js';
import warehouseRoutes from './routes/warehouses.js';
import inventoryRoutes from './routes/inventory.js';
import analyticsRoutes from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for our SPA
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use(authRoutes);
app.use(userRoutes);
app.use(productRoutes);
app.use(referenceDataRoutes);
app.use(warehouseRoutes);
app.use(inventoryRoutes);
app.use(analyticsRoutes);

// Serve static frontend files
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

// Error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Run migrations
    runMigrations();

    // Ensure admin exists
    const adminId = await ensureAdminExists();

    // Seed data
    seedData(adminId);

    app.listen(config.port, () => {
      console.log(`\n✅ نرم‌افزار مدیریت انبار اجرا شد`);
      console.log(`📍 آدرس: http://localhost:${config.port}`);
      console.log(`🗄️  دیتابیس: ${config.dbFile}`);
      console.log(`🌍 محیط: ${config.nodeEnv}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
