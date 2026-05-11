console.log("DB URL Check:", process.env.DATABASE_URL ? "Exists (starts with " + process.env.DATABASE_URL.substring(0, 8) + "...)" : "IS COMPLETELY MISSING");
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in .env');
}

// 1. Setup the Pool and Adapter
const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);

// 2. Create a function to initialize the client
const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });
};

// 3. Prevent multiple instances in development
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;