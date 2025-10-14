import { performance } from 'perf_hooks';
import { logger } from '../../config/logger';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';

export interface PerformanceMetrics {
  apiLatency: number;
  databaseLatency: number;
  redisLatency: number;
  aiProcessingTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  errorRate: number;
  throughput: number;
}

export interface DetailedMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  error?: string;
  aiProvider?: string;
  aiModel?: string;
  aiTokens?: number;
  aiLatency?: number;
}

export class EnhancedMetricsService {
  private metricsBuffer: DetailedMetrics[] = [];
  private bufferSize = 1000;
  private flushInterval = 30000; // 30 seconds
  private isCollecting = false;

  constructor() {
    this.startMetricsCollection();
    this.startPeriodicFlush();
  }

  private startMetricsCollection(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    logger.info('Enhanced metrics collection started');
  }

  private startPeriodicFlush(): void {
    setInterval(async () => {
      if (this.metricsBuffer.length > 0) {
        await this.flushMetrics();
      }
    }, this.flushInterval);
  }

  async recordApiMetrics(metrics: DetailedMetrics): Promise<void> {
    this.metricsBuffer.push({
      ...metrics,
      timestamp: new Date()
    });

    if (this.metricsBuffer.length >= this.bufferSize) {
      await this.flushMetrics();
    }

    // Real-time monitoring alerts
    if (metrics.responseTime > 2000) {
      logger.warn(`High API latency detected: ${metrics.endpoint} took ${metrics.responseTime}ms`);
    }

    if (metrics.statusCode >= 500) {
      logger.error(`Server error detected: ${metrics.method} ${metrics.endpoint} returned ${metrics.statusCode}`);
    }
  }

  async recordAIMetrics(provider: string, model: string, tokens: number, latency: number): Promise<void> {
    const aiMetrics = {
      provider,
      model,
      tokens,
      latency,
      timestamp: new Date()
    };

    try {
      await prisma.aIMetrics.create({
        data: aiMetrics
      });

      // Check for performance anomalies
      if (latency > 10000) {
        logger.warn(`High AI latency detected: ${provider} ${model} took ${latency}ms`);
      }

      if (tokens > 10000) {
        logger.info(`High token usage: ${tokens} tokens used with ${provider} ${model}`);
      }
    } catch (error) {
      logger.error('Failed to record AI metrics:', error);
    }
  }

  async getPerformanceMetrics(timeRange: '1h' | '24h' | '7d' | '30d'): Promise<PerformanceMetrics> {
    const now = new Date();
    const startTime = new Date(now);

    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
    }

    try {
      // API Performance Metrics
      const apiMetrics = await prisma.apiMetrics.aggregate({
        where: {
          timestamp: { gte: startTime }
        },
        _avg: {
          responseTime: true
        },
        _count: {
          _all: true
        },
        _sum: {
          responseTime: true
        }
      });

      // AI Performance Metrics
      const aiMetrics = await prisma.aIMetrics.aggregate({
        where: {
          timestamp: { gte: startTime }
        },
        _avg: {
          latency: true,
          tokens: true
        },
        _count: {
          _all: true
        }
      });

      // Error Rate Calculation
      const errorMetrics = await prisma.apiMetrics.aggregate({
        where: {
          timestamp: { gte: startTime },
          statusCode: { gte: 400 }
        },
        _count: {
          _all: true
        }
      });

      const totalRequests = apiMetrics._count._all || 1;
      const errorRate = (errorMetrics._count._all || 0) / totalRequests;

      // System Metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = await this.getCPUUsage();
      const activeConnections = await this.getActiveConnections();

      return {
        apiLatency: apiMetrics._avg.responseTime || 0,
        databaseLatency: await this.getDatabaseLatency(),
        redisLatency: await this.getRedisLatency(),
        aiProcessingTime: aiMetrics._avg.latency || 0,
        memoryUsage,
        cpuUsage,
        activeConnections,
        errorRate,
        throughput: totalRequests / this.getTimeRangeHours(timeRange)
      };
    } catch (error) {
      logger.error('Failed to get performance metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  private async getDatabaseLatency(): Promise<number> {
    const start = performance.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return performance.now() - start;
    } catch (error) {
      logger.error('Database latency check failed:', error);
      return -1;
    }
  }

  private async getRedisLatency(): Promise<number> {
    const start = performance.now();
    try {
      await redis.ping();
      return performance.now() - start;
    } catch (error) {
      logger.error('Redis latency check failed:', error);
      return -1;
    }
  }

  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);

        const totalTime = endTime[0] * 1000000 + endTime[1]; // Convert to microseconds
        const cpuPercent = (endUsage.user + endUsage.system) / totalTime * 100;

        resolve(cpuPercent);
      }, 100);
    });
  }

  private async getActiveConnections(): Promise<number> {
    try {
      // This would need to be implemented based on your connection tracking
      // For now, return a mock value
      return Math.floor(Math.random() * 100) + 50;
    } catch (error) {
      logger.error('Failed to get active connections:', error);
      return 0;
    }
  }

  private getTimeRangeHours(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 24 * 7;
      case '30d': return 24 * 30;
      default: return 1;
    }
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      apiLatency: 0,
      databaseLatency: 0,
      redisLatency: 0,
      aiProcessingTime: 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: 0,
      activeConnections: 0,
      errorRate: 0,
      throughput: 0
    };
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Batch insert metrics
      await prisma.apiMetrics.createMany({
        data: metricsToFlush
      });

      logger.info(`Flushed ${metricsToFlush.length} metrics to database`);
    } catch (error) {
      logger.error('Failed to flush metrics:', error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  async getDetailedAnalytics(timeRange: string): Promise<any> {
    const metrics = await this.getPerformanceMetrics(timeRange as any);
    
    return {
      summary: {
        totalRequests: metrics.throughput * this.getTimeRangeHours(timeRange),
        averageResponseTime: metrics.apiLatency,
        errorRate: metrics.errorRate,
        activeUsers: metrics.activeConnections
      },
      performance: {
        apiLatency: metrics.apiLatency,
        databaseLatency: metrics.databaseLatency,
        redisLatency: metrics.redisLatency,
        aiProcessingTime: metrics.aiProcessingTime
      },
      resources: {
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        activeConnections: metrics.activeConnections
      },
      aiUsage: await this.getAIUsageAnalytics(timeRange),
      trends: await this.getPerformanceTrends(timeRange)
    };
  }

  private async getAIUsageAnalytics(timeRange: string): Promise<any> {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - parseInt(timeRange));

    const aiStats = await prisma.aIMetrics.groupBy({
      by: ['provider', 'model'],
      where: {
        timestamp: { gte: startTime }
      },
      _count: {
        _all: true
      },
      _avg: {
        latency: true,
        tokens: true
      },
      _sum: {
        tokens: true
      }
    });

    return aiStats.map(stat => ({
      provider: stat.provider,
      model: stat.model,
      requestCount: stat._count._all,
      averageLatency: stat._avg.latency,
      averageTokens: stat._avg.tokens,
      totalTokens: stat._sum.tokens
    }));
  }

  private async getPerformanceTrends(timeRange: string): Promise<any> {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - parseInt(timeRange));

    const hourlyMetrics = await prisma.apiMetrics.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: { gte: startTime }
      },
      _avg: {
        responseTime: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    return hourlyMetrics.map(metric => ({
      timestamp: metric.timestamp,
      averageResponseTime: metric._avg.responseTime,
      requestCount: metric._count._all
    }));
  }

  // Real-time monitoring methods
  async startRealTimeMonitoring(): Promise<void> {
    setInterval(async () => {
      const currentMetrics = await this.getPerformanceMetrics('1h');
      
      // Check for performance anomalies
      if (currentMetrics.apiLatency > 2000) {
        logger.warn(`Performance anomaly: API latency is ${currentMetrics.apiLatency}ms`);
      }

      if (currentMetrics.errorRate > 0.05) {
        logger.warn(`High error rate detected: ${currentMetrics.errorRate * 100}%`);
      }

      if (currentMetrics.cpuUsage > 80) {
        logger.warn(`High CPU usage: ${currentMetrics.cpuUsage}%`);
      }

      if (currentMetrics.memoryUsage.heapUsed > 1000 * 1024 * 1024) {
        logger.warn(`High memory usage: ${Math.round(currentMetrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
      }
    }, 60000); // Check every minute
  }
}

export const enhancedMetricsService = new EnhancedMetricsService();