// backend/prisma.config.ts
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

// 👈 CRITICAL: This loads the DATABASE_URL from your .env file
dotenv.config(); 

export default defineConfig({
  datasource: {
    // 👈 The CLI needs this string to connect to Postgres for migrations
    url: process.env.DATABASE_URL, 
  },
});