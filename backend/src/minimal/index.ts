import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from '../config/logger';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Minimal Omni Node API running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});