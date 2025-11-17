import { Router } from 'express';
import { scraperController } from '@/controllers/scraper.controller';

const router = Router();

// List presets
router.get('/presets', scraperController.listPresets.bind(scraperController));

// CRUD operations
router.get('/', scraperController.listJobs.bind(scraperController));
router.post('/', scraperController.createJob.bind(scraperController));
router.get('/:id', scraperController.getJob.bind(scraperController));
router.patch('/:id', scraperController.updateJob.bind(scraperController));
router.delete('/:id', scraperController.deleteJob.bind(scraperController));

// Execution
router.post('/:id/execute', scraperController.executeJob.bind(scraperController));

// Results
router.get('/:id/results', scraperController.getResults.bind(scraperController));

// Scheduling
router.post('/:id/schedule', scraperController.scheduleJob.bind(scraperController));
router.delete('/:id/schedule/:scheduleId', scraperController.unscheduleJob.bind(scraperController));

export default router;
