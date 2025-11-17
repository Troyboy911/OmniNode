import { PrismaClient } from '@prisma/client';
import { httpTools } from '@/tools/http.tools';
import { logger } from '@/config/logger';
import cron from 'node-cron';

const prisma = new PrismaClient();

/**
 * Scraper Preset Templates
 * Just insert your target data and go
 */
export const SCRAPER_PRESETS = {
  // News articles
  NEWS_ARTICLE: {
    name: 'News Article Scraper',
    selectors: {
      title: 'h1, article h1, .article-title',
      author: '.author, .byline, [rel="author"]',
      date: 'time, .date, .publish-date',
      content: 'article p, .article-content p, .post-content p',
      image: 'article img@src, .featured-image img@src',
    },
  },
  
  // E-commerce products
  PRODUCT_LISTING: {
    name: 'Product Listing Scraper',
    listSelector: '.product, .item, [data-product]',
    itemSelectors: {
      name: 'h2, .product-name, .title',
      price: '.price, .product-price, [data-price]',
      image: 'img@src',
      link: 'a@href',
      rating: '.rating, .stars, [data-rating]',
    },
  },
  
  // Social media posts
  SOCIAL_POSTS: {
    name: 'Social Media Posts Scraper',
    listSelector: '.post, article, [data-testid="tweet"]',
    itemSelectors: {
      author: '.author, .username, [data-author]',
      content: '.content, .text, p',
      timestamp: 'time, .timestamp, [datetime]',
      likes: '.likes, [data-likes]',
      shares: '.shares, [data-shares]',
    },
  },
  
  // Job listings
  JOB_LISTING: {
    name: 'Job Listing Scraper',
    listSelector: '.job, .job-card, [data-job-id]',
    itemSelectors: {
      title: 'h2, .job-title, .title',
      company: '.company, .employer',
      location: '.location, .job-location',
      salary: '.salary, .compensation',
      description: '.description, .job-desc',
      link: 'a@href',
    },
  },
  
  // Real estate listings
  REAL_ESTATE: {
    name: 'Real Estate Listing Scraper',
    listSelector: '.property, .listing, [data-property-id]',
    itemSelectors: {
      address: '.address, .property-address',
      price: '.price, .listing-price',
      bedrooms: '.beds, [data-beds]',
      bathrooms: '.baths, [data-baths]',
      sqft: '.sqft, .area',
      image: 'img@src',
      link: 'a@href',
    },
  },
  
  // Event listings
  EVENT_LISTING: {
    name: 'Event Listing Scraper',
    listSelector: '.event, .event-card, [data-event-id]',
    itemSelectors: {
      title: 'h2, .event-title, .title',
      date: 'time, .event-date, [datetime]',
      location: '.venue, .location',
      price: '.price, .ticket-price',
      description: '.description, .event-desc',
      link: 'a@href',
    },
  },

  // Search results (generic)
  SEARCH_RESULTS: {
    name: 'Search Results Scraper',
    listSelector: '.result, .search-result, .g',
    itemSelectors: {
      title: 'h2, h3, .title',
      snippet: '.snippet, .description, p',
      link: 'a@href',
    },
  },

  // Blog posts
  BLOG_POSTS: {
    name: 'Blog Posts Scraper',
    listSelector: 'article, .post, .blog-entry',
    itemSelectors: {
      title: 'h1, h2, .post-title',
      author: '.author, .byline',
      date: 'time, .date',
      excerpt: '.excerpt, .summary',
      link: 'a@href',
      image: 'img@src',
    },
  },
};

export class ScraperSwarmController {
  private activeJobs: Map<string, NodeJS.Timeout> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize scraper swarm
   */
  async initialize() {
    logger.info('🕷️  Initializing scraper swarm...');
    
    // Load scheduled jobs from database
    const jobs = await prisma.scraperJob.findMany({
      where: {
        status: { in: ['PENDING', 'PAUSED'] },
        schedule: { not: null },
      },
      include: {
        schedules: {
          where: { enabled: true },
        },
      },
    });

    for (const job of jobs) {
      for (const schedule of job.schedules) {
        this.scheduleJob(job.id, schedule.cronExpr);
      }
    }

    logger.info(`✅ Scraper swarm initialized with ${jobs.length} scheduled jobs`);
  }

  /**
   * Create scraper job from preset
   */
  async createFromPreset(
    projectId: string,
    presetName: keyof typeof SCRAPER_PRESETS,
    targetUrl: string,
    customConfig?: any
  ) {
    const preset = SCRAPER_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Preset "${presetName}" not found`);
    }

    const job = await prisma.scraperJob.create({
      data: {
        projectId,
        name: preset.name,
        targetUrl,
        preset: presetName,
        config: { ...preset, ...customConfig },
        status: 'PENDING',
      },
    });

    logger.info(`📝 Created scraper job: ${job.name} (${job.id})`);
    return job;
  }

  /**
   * Execute scraper job
   */
  async executeJob(jobId: string) {
    const job = await prisma.scraperJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    logger.info(`🚀 Executing scraper job: ${job.name}`);
    
    const startTime = Date.now();
    await prisma.scraperJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', lastRunAt: new Date() },
    });

    try {
      let result;
      const config = job.config as any;

      if (config.listSelector) {
        // List-based scraping
        result = await httpTools.scrapeList(
          job.targetUrl,
          config.listSelector,
          config.itemSelectors,
          config.requestConfig || {}
        );
      } else {
        // Single-page scraping
        result = await httpTools.scrape(
          job.targetUrl,
          config.selectors,
          config.requestConfig || {}
        );
      }

      const duration = Date.now() - startTime;

      // Save result
      await prisma.scraperResult.create({
        data: {
          jobId,
          data: result.data || [],
          metadata: result.metadata || {},
          itemsCount: result.data?.length || 0,
          success: result.success,
          error: result.error,
          duration,
        },
      });

      await prisma.scraperJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      });

      logger.info(`✅ Job completed: ${job.name} (${result.data?.length || 0} items, ${duration}ms)`);

      return result;
    } catch (error: any) {
      logger.error(`❌ Job failed: ${job.name}`, error);
      
      await prisma.scraperResult.create({
        data: {
          jobId,
          data: [],
          itemsCount: 0,
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
        },
      });

      await prisma.scraperJob.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  /**
   * Schedule job with cron expression
   */
  scheduleJob(jobId: string, cronExpression: string) {
    // Unschedule existing job
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId)?.stop();
    }

    // Schedule new job
    const task = cron.schedule(cronExpression, async () => {
      try {
        await this.executeJob(jobId);
      } catch (error) {
        logger.error(`Scheduled job ${jobId} failed:`, error);
      }
    });

    this.scheduledJobs.set(jobId, task);
    logger.info(`⏰ Scheduled job ${jobId} with cron: ${cronExpression}`);
  }

  /**
   * Stop scheduled job
   */
  stopScheduledJob(jobId: string) {
    const task = this.scheduledJobs.get(jobId);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(jobId);
      logger.info(`⏸️  Stopped scheduled job ${jobId}`);
    }
  }

  /**
   * Get job results
   */
  async getResults(jobId: string, limit: number = 10) {
    return await prisma.scraperResult.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Cleanup old results
   */
  async cleanupOldResults(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.scraperResult.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    logger.info(`🧹 Cleaned up ${deleted.count} old scraper results`);
    return deleted.count;
  }

  /**
   * Shutdown scraper swarm
   */
  async shutdown() {
    logger.info('🛑 Shutting down scraper swarm...');
    
    // Stop all scheduled jobs
    for (const [jobId, task] of this.scheduledJobs) {
      task.stop();
    }
    
    this.scheduledJobs.clear();
    this.activeJobs.clear();
    
    await prisma.$disconnect();
    logger.info('✅ Scraper swarm shutdown complete');
  }
}

export const scraperSwarm = new ScraperSwarmController();
