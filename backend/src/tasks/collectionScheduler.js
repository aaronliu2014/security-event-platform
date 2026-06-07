import cron from 'node-cron';
import logger from '../utils/logger.js';
import { collectAllEvents } from '../services/eventCollector.js';
import { saveEvents, updateCollectionTask, saveEventTags, getEventsByExternalIds } from '../services/eventService.js';
import { getTopicConfig } from '../services/aiTaggingService.js';

const tasks = new Map();

/**
 * Convert user frequency preference to cron expression.
 */
function frequencyToCronExpression(frequency) {
  const cronExpressions = {
    hourly: '0 * * * *',
    'every-4-hours': '0 */4 * * *',
    daily: '0 0 * * *',
    'early-morning': '7 7 * * *', // 7:07 AM, avoids :00 peak
    'twice-daily': '0 0,12 * * *',
    weekly: '0 0 * * 0',
    monthly: '0 0 1 * *',
  };

  return cronExpressions[frequency] || cronExpressions['early-morning'];
}

/**
 * Save AI topic tags for events that have AI relevance.
 */
async function saveAITags(eventId, tags) {
  if (!tags || tags.length === 0) return;
  const topicConfig = getTopicConfig();

  const validTags = tags.filter((tag) => topicConfig[tag]);
  if (validTags.length === 0) return;

  try {
    await saveEventTags(eventId, validTags);
  } catch (error) {
    logger.warn(`Failed to save AI tags for event ${eventId}: ${error.message}`);
  }
}

/**
 * Execute data collection task.
 */
export async function executeCollectionTask() {
  try {
    logger.info('Starting scheduled data collection task');
    const startTime = Date.now();

    const results = await collectAllEvents();

    const savePromises = [
      saveEvents(results.nvd, 'NVD'),
      saveEvents(results.cisa, 'CISA'),
      saveEvents(results.rss, 'RSS'),
    ];

    const saveResults = await Promise.all(savePromises);

    // Save AI tags for RSS news items
    const aiNewsItems = results.rss.filter((e) => e._tags && e._tags.length > 0);
    if (aiNewsItems.length > 0) {
      logger.info(`Saving AI tags for ${aiNewsItems.length} articles`);
      const aiExternalIds = aiNewsItems.map((e) => e.external_id);
      const savedEvents = await getEventsByExternalIds(aiExternalIds);
      for (const event of savedEvents) {
        const rssItem = aiNewsItems.find((e) => e.external_id === event.external_id);
        if (rssItem && rssItem._tags) {
          await saveAITags(event.id, rssItem._tags);
        }
      }
    }

    const totalSaved = saveResults.reduce((sum, r) => sum + r.saved, 0);
    const totalErrors = saveResults.reduce((sum, r) => sum + r.errors.length, 0);

    await updateCollectionTask('data-collection', 'all', 'completed', {
      saved: totalSaved,
      errors: totalErrors > 0 ? ['See logs for details'] : [],
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Data collection completed: ${totalSaved} events saved in ${duration}s`);

    return { success: true, stats: { total: totalSaved, errors: totalErrors } };
  } catch (error) {
    logger.error(`Data collection task failed: ${error.message}`);

    try {
      await updateCollectionTask('data-collection', 'all', 'failed', {
        errors: [error.message],
      });
    } catch (updateError) {
      logger.error(`Failed to update task status: ${updateError.message}`);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Schedule collection task.
 */
export function scheduleCollectionTask(frequency = 'early-morning') {
  if (tasks.has('data-collection')) {
    const existingTask = tasks.get('data-collection');
    existingTask.stop();
    logger.info('Cancelled existing data collection task');
  }

  const cronExpression = frequencyToCronExpression(frequency);
  logger.info(`Scheduling data collection with frequency: ${frequency} (${cronExpression})`);

  const task = cron.schedule(cronExpression, () => {
    executeCollectionTask();
  }, {
    timezone: process.env.TZ || 'Asia/Shanghai',
  });

  tasks.set('data-collection', task);
  return task;
}

/**
 * Cancel scheduled task.
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
 * Get task status.
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
 * Update collection frequency.
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
