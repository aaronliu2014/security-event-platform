import Joi from 'joi';
import logger from '../utils/logger.js';

const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly', 'early-morning'];
const validSeverities = ['critical', 'high', 'medium', 'low', 'info'];
const validSources = ['NVD', 'CISA', 'KrebsOnSecurity', 'DarkReading', 'SchneierOnSecurity', 'SimonWillison'];
const validSortColumns = ['published_date', 'collected_date', 'severity', 'title'];
const validSortOrders = ['ASC', 'DESC'];

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).max(128).required(),
    full_name: Joi.string().max(100).optional().allow(''),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    full_name: Joi.string().max(100).optional(),
  }).min(1),

  updatePreferences: Joi.object({
    collection_frequency: Joi.string().valid(...validFrequencies).optional(),
    notification_enabled: Joi.boolean().optional(),
    email_notification_enabled: Joi.boolean().optional(),
    data_sources: Joi.array().items(Joi.string().valid('nvd', 'cisa', 'rss')).optional(),
    alert_severity_threshold: Joi.string().valid(...validSeverities).optional(),
    notification_severity_threshold: Joi.string().valid(...validSeverities).optional(),
  }).min(1),

  eventsQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(200).optional(),
    offset: Joi.number().integer().min(0).optional(),
    severity: Joi.string().valid(...validSeverities).optional(),
    source: Joi.string().valid(...validSources).optional(),
    eventType: Joi.string().optional(),
    sortBy: Joi.string().valid(...validSortColumns).optional(),
    sortOrder: Joi.string().valid(...validSortOrders).optional(),
  }),

  searchQuery: Joi.object({
    q: Joi.string().min(1).max(200).required(),
    limit: Joi.number().integer().min(1).max(200).optional(),
  }),

  addTag: Joi.object({
    tag_name: Joi.string().min(1).max(100).required(),
    severity: Joi.string().valid(...validSeverities).optional(),
  }),

  collectionSchedule: Joi.object({
    frequency: Joi.string().valid('hourly', 'every-4-hours', 'daily', 'twice-daily', 'weekly', 'monthly', 'early-morning').required(),
  }),

  trendsQuery: Joi.object({
    days: Joi.number().integer().min(1).max(365).optional(),
  }),
};

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      logger.warn(`Validation failed on ${req.path}: ${messages}`);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: messages,
      });
    }
    req[source] = value;
    next();
  };
}

export default { schemas, validate };
