import app from './app';
import { config } from '@/config/env';
import { logger } from '@/config/logger';
import DatabaseService from '@/config/database';

const PORT = config.server.port;

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await DatabaseService.connect();
    logger.info('✅ Database connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${config.server.env}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api/${config.server.apiVersion}`);
      logger.info(`💚 Health check: http://localhost:${PORT}/api/${config.server.apiVersion}/health`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await DatabaseService.disconnect();
    logger.info('✅ Database disconnected');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  throw reason;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();