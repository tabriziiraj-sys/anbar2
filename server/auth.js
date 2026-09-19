import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { admin } from 'better-auth/plugins';
import { sqlite, users, sessions, accounts, verifications } from './db.js';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import config from './config.js';

const authDb = drizzle(sqlite, {
  schema: { users, sessions, accounts, verifications }
});

export const auth = betterAuth({
  database: drizzleAdapter(authDb, {
    provider: 'sqlite',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    admin(),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    database: {
      joins: true,
    },
  },
});

export async function ensureAdminExists() {
  const existing = sqlite.prepare('SELECT id FROM user WHERE email = ?').get(config.admin.email);
  if (existing) {
    console.log('Admin user already exists.');
    return existing.id;
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: config.admin.name,
        email: config.admin.email,
        password: config.admin.password,
      },
    });

    if (result && result.user) {
      sqlite.prepare('UPDATE user SET role = ? WHERE id = ?').run('admin', result.user.id);
      console.log(`Admin user created: ${config.admin.email}`);
      return result.user.id;
    }
  } catch (err) {
    console.error('Failed to create admin via API, trying direct approach:', err.message);
  }

  return null;
}
