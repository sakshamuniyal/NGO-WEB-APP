// backend/prisma.config.ts
import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

// 👈 CRITICAL: This loads the DATABASE_URL from your .env file
dotenv.config(); 

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL, 
  },
});