/**
 * Prisma Client for Cloudflare Workers
 * Uses Neon serverless driver for edge compatibility
 */

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

let prismaClient: PrismaClient | null = null;

export function getPrismaClient(databaseUrl: string): PrismaClient {
  if (!prismaClient) {
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaNeon(pool);
    
    prismaClient = new PrismaClient({ 
      adapter,
      log: ['error', 'warn']
    });
  }
  
  return prismaClient;
}

export function closePrismaClient() {
  if (prismaClient) {
    prismaClient.$disconnect();
    prismaClient = null;
  }
}