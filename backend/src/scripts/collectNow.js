import logger from '../utils/logger.js';
import * as userModel from '../models/User.js';
import { runMigrations } from '../utils/migrations.js';
import { executeCollectionTask } from '../tasks/collectionScheduler.js';

async function main() {
  logger.info('=== Manual AI Security News Collection ===');

  // Initialize DB
  try {
    await userModel.initializeUserTables();
    await runMigrations();
    logger.info('Database initialized');
  } catch (e) {
    logger.error(`DB init failed: ${e.message}`);
    process.exit(1);
  }

  // Run collection
  try {
    logger.info('Starting collection from all sources...');
    const result = await executeCollectionTask();
    logger.info(`Collection result: ${JSON.stringify(result)}`);
    logger.info('=== Collection complete ===');
  } catch (e) {
    logger.error(`Collection failed: ${e.message}`);
    process.exit(1);
  }

  process.exit(0);
}

main();
