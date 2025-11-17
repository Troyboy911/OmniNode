import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { scraperSwarm, SCRAPER_PRESETS } from '@/services/scraper/swarm-controller';
import { logger } from '@/config/logger';

const prisma = new PrismaClient();

export class ScraperController {
  /**
   * GET /api/scraper - List all scraper jobs
   */
  async listJobs(req: Request, res: Response) {
    try {
      const { projectId, status, limit = '50', offset = '0' } = req.query;
      
      const where: any = {};
      if (projectId) where.projectId = projectId as string;
      if (status) where.status = status as string;

      const jobs = await prisma.scraperJob.findMany({
        where,
        include: {
          schedules: true,
          results: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.scraperJob.count({ where });

      res.json({
        success: true,
        data: jobs,
        meta: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });
    } catch (error: any) {
      logger.error('Error listing scraper jobs:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/scraper - Create new scraper job
   */
  async createJob(req: Request, res: Response) {
    try {
      const { projectId, preset, targetUrl, name, customConfig, schedule } = req.body;

      if (!projectId || !targetUrl) {
        return res.status(400).json({
          success: false,
          error: 'projectId and targetUrl are required'
        });
      }

      let job;
      
      if (preset && preset in SCRAPER_PRESETS) {
        // Create from preset
        job = await scraperSwarm.createFromPreset(
          projectId,
          preset,
          targetUrl,
          customConfig
        );
      } else {
        // Create custom job
        job = await prisma.scraperJob.create({
          data: {
            projectId,
            name: name || 'Custom Scraper',
            targetUrl,
            config: customConfig || {},
            status: 'PENDING'
          }
        });
      }

      // Add schedule if provided
      if (schedule) {
        await prisma.scraperSchedule.create({
          data: {
            jobId: job.id,
            cronExpr: schedule,
            enabled: true
          }
        });

        scraperSwarm.scheduleJob(job.id, schedule);
      }

      logger.info(`Scraper job created: ${job.id}`);

      res.status(201).json({
        success: true,
        data: job
      });
    } catch (error: any) {
      logger.error('Error creating scraper job:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/scraper/:id - Get scraper job details
   */
  async getJob(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const job = await prisma.scraperJob.findUnique({
        where: { id },
        include: {
          schedules: true,
          results: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error: any) {
      logger.error('Error getting scraper job:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /api/scraper/:id - Update scraper job
   */
  async updateJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, targetUrl, config, status } = req.body;

      const job = await prisma.scraperJob.update({
        where: { id },
        data: {
          name,
          targetUrl,
          config,
          status
        }
      });

      res.json({
        success: true,
        data: job
      });
    } catch (error: any) {
      logger.error('Error updating scraper job:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/scraper/:id - Delete scraper job
   */
  async deleteJob(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Stop scheduled job
      scraperSwarm.stopScheduledJob(id);

      // Delete from database
      await prisma.scraperJob.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Job deleted successfully'
      });
    } catch (error: any) {
      logger.error('Error deleting scraper job:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/scraper/:id/execute - Execute scraper job
   */
  async executeJob(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await scraperSwarm.executeJob(id);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error executing scraper job:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/scraper/:id/results - Get scraper results
   */
  async getResults(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { limit = '10', offset = '0' } = req.query;

      const results = await prisma.scraperResult.findMany({
        where: { jobId: id },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      const total = await prisma.scraperResult.count({
        where: { jobId: id }
      });

      res.json({
        success: true,
        data: results,
        meta: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });
    } catch (error: any) {
      logger.error('Error getting scraper results:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/scraper/:id/schedule - Add/update schedule
   */
  async scheduleJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { cronExpr, enabled = true } = req.body;

      if (!cronExpr) {
        return res.status(400).json({
          success: false,
          error: 'cronExpr is required'
        });
      }

      const schedule = await prisma.scraperSchedule.create({
        data: {
          jobId: id,
          cronExpr,
          enabled
        }
      });

      if (enabled) {
        scraperSwarm.scheduleJob(id, cronExpr);
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      logger.error('Error scheduling scraper job:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/scraper/:id/schedule/:scheduleId - Remove schedule
   */
  async unscheduleJob(req: Request, res: Response) {
    try {
      const { id, scheduleId } = req.params;

      await prisma.scraperSchedule.delete({
        where: { id: scheduleId }
      });

      scraperSwarm.stopScheduledJob(id);

      res.json({
        success: true,
        message: 'Schedule removed successfully'
      });
    } catch (error: any) {
      logger.error('Error removing schedule:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/scraper/presets - List available presets
   */
  async listPresets(req: Request, res: Response) {
    try {
      const presets = Object.entries(SCRAPER_PRESETS).map(([key, value]) => ({
        key,
        name: value.name,
        type: 'listSelector' in value ? 'list' : 'single'
      }));

      res.json({
        success: true,
        data: presets
      });
    } catch (error: any) {
      logger.error('Error listing presets:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const scraperController = new ScraperController();
