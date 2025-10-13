import { PrismaClient } from '@prisma/client';

// Test database configuration for demonstration
// This creates an in-memory SQLite database for testing

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

export { testPrisma };