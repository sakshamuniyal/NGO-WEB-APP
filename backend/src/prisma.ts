import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();   // ← make sure this is here

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in .env');
}

const pool = new Pool({
  connectionString,
  // Optional but recommended for production
  max: 10,
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,                    // ← this is now typed correctly after update
  log: ['query', 'error', 'warn'], // optional: helpful for debugging
});

export default prisma;