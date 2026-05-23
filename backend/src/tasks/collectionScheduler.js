import cron from 'node-cron';
import logger from '../utils/logger.js';
import { collectAllEvents } from '../services/eventCollector.js';
import { saveEvents, updateCollectionTask } from '../services/eventService.js';

// Store running tasks
const tasks = new Map();

/**
 * Convert user frequency preference to cron expression
 */
function frequencyToCronExpression(frequency) {
  const cronExpressions = {
    hourly: '0 * * * *', // Every hour
    'every-4-hours': '0 */4 * * *', // Every 4 hours
    daily: '0 0 * * *', // Every day at midnight
    'twice-daily': '0 0,12 * * *', // 00:00 and 12:00
    weekly: '0 0 * * 0', // Every Sunday at midnight
    monthly: '0 0 1 * *', // First day of month
  };

  return cronExpressions[frequency] || cronExpressions.daily;
}

/**
 * Execute data collection task
 */
async function executeCollectionTask() {
  try {
    logger.info('Starting scheduled data collection task');
    const startTime = Date.now();

    // Collect events from all sources
    const results = await collectAllEvents();

    // Save events to database
    const savePromises = [
      saveEvents(results.nvd, 'NVD'),
      saveEvents(results.cisa, 'CISA'),
      saveEvents(results.rss, 'RSS'),
    ];

    const saveResults = await Promise.all(savePromises);

    // Update collection task status
    const totalSaved = saveResults.reduce((sum, r) => sum + r.saved, 0);
    const totalErrors = saveResults.reduce((sum, r) => sum + r.errors.length, 0);

    await updateCollectionTask('data-collection', 'all', 'completed', {
      saved: totalSaved,
      errors: totalErrors > 0 ? ['See logs for details'] : [],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(
      `Data collection completed: ${totalSaved} events saved in ${duration}s`
    );

    return {
      success: true,
      stats: {
        nvd: saveResults[0],
        cisa: saveResults[1],
        rss: saveResults[2],
        total: totalSaved,
        errors: totalErrors,
      },
    };
  } catch (error) {
    logger.error(`Data collection task failed: ${error.message}`);

    try {
      await updateCollectionTask('data-collection', 'all', 'failed', {
        errors: [error.message],
      });
    } catch (updateError) {
      logger.error(`Failed to update task status: ${updateError.message}`);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Schedule collection task
 */
export function scheduleCollectionTask(frequency = 'daily') {
  // Cancel existing task if running
  if (tasks.has('data-collection')) {
    const existingTask = tasks.get('data-collection');
    existingTask.stop();
    logger.info('Cancelled existing data collection task');
  }

  // Create new scheduled task
  const cronExpression = frequencyToCronExpression(frequency);
  logger.info(`Scheduling data collection with frequency: ${frequency} (${cronExpression})`);

  const task = cron.schedule(cronExpression, () => {
    executeCollectionTask();
  });

  tasks.set('data-collection', task);

  // Run immediately on startup
  logger.info('Running initial data collection...');
  executeCollectionTask();

  return task;
}

/**
 * Cancel scheduled task
 */
export function cancelCollectionTask() {
  const task = tasks.get('data-collection');
  if (task) {
    task.stop();
    tasks.delete('data-collection');
    logger.info('Data collection task cancelled');
    return true;
  }
  return false;
}

/**
 * Get task status
 */
export function getTaskStatus(taskName = 'data-collection') {
  const task = tasks.get(taskName);
  return {
    taskName,
    isRunning: !!task,
    status: task ? 'scheduled' : 'not-scheduled',
  };
}

/**
 * Update collection frequency
 */
export function updateCollectionFrequency(frequency) {
  logger.info(`Updating collection frequency to: ${frequency}`);
  scheduleCollectionTask(frequency);
  return getTaskStatus();
}

export default {
  scheduleCollectionTask,
  cancelCollectionTask,
  getTaskStatus,
  updateCollectionFrequency,
  executeCollectionTask,
};
