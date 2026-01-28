const { PrismaClient } = require('@prisma/client');

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis;

const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  });
};

// Use existing client or create new one
const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Connection with retry logic
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ All database connection attempts failed');
  return false;
};

// Initial connection
connectWithRetry();

// Keep-alive ping to prevent Neon from sleeping (every 4 minutes)
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000; // 4 minutes

const keepAlive = setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('🏓 Database keep-alive ping successful');
  } catch (error) {
    console.error('🏓 Keep-alive ping failed, attempting reconnection...', error.message);
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log('🔄 Database reconnected successfully');
    } catch (reconnectError) {
      console.error('❌ Reconnection failed:', reconnectError.message);
    }
  }
}, KEEP_ALIVE_INTERVAL);

// Middleware to handle connection errors on queries
prisma.$use(async (params, next) => {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await next(params);
    } catch (error) {
      // Check if it's a connection error
      if (
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1002' || // Database server timed out
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017' || // Server closed connection
        error.message?.includes('terminating connection') ||
        error.message?.includes('Connection refused') ||
        error.message?.includes('connection closed')
      ) {
        retries++;
        console.log(`🔄 Query failed, retrying (${retries}/${maxRetries})...`);
        
        // Try to reconnect
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (e) {
          // Ignore reconnect errors, will retry query anyway
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      } else {
        // Not a connection error, throw immediately
        throw error;
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw new Error('Database query failed after multiple retries');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  clearInterval(keepAlive);
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  clearInterval(keepAlive);
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  clearInterval(keepAlive);
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;