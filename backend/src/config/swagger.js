import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Security Event Platform API',
      version: '1.0.0',
      description: 'Enterprise security event monitoring and analysis platform API',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            username: { type: 'string' },
            full_name: { type: 'string' },
            role: { type: 'string' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            external_id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            source: { type: 'string', enum: ['NVD', 'CISA', 'RSS'] },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
            event_type: { type: 'string' },
            affected_products: { type: 'array', items: { type: 'string' } },
            published_date: { type: 'string', format: 'date-time' },
            collected_date: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            message: { type: 'string' },
            severity: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Events', description: 'Security event endpoints' },
      { name: 'Analysis', description: 'Event analysis endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Notifications', description: 'Notification endpoints' },
      { name: 'Admin', description: 'Admin management endpoints' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['Events'],
          summary: 'Health check',
          responses: { '200': { description: 'Server is healthy' } },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'username', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    username: { type: 'string', minLength: 3 },
                    password: { type: 'string', minLength: 6 },
                    full_name: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'User registered' },
            '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '409': { description: 'Email already registered' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'User login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful - returns JWT token' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/events': {
        get: {
          tags: ['Events'],
          summary: 'Get events with optional filtering and pagination',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'severity', in: 'query', schema: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] } },
            { name: 'source', in: 'query', schema: { type: 'string', enum: ['NVD', 'CISA', 'RSS'] } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['published_date', 'collected_date', 'severity', 'title'] } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'] } },
          ],
          responses: { '200': { description: 'List of events' } },
        },
      },
      '/api/events/stats': {
        get: {
          tags: ['Events'],
          summary: 'Get event statistics',
          responses: { '200': { description: 'Event statistics' } },
        },
      },
      '/api/events/search': {
        get: {
          tags: ['Events'],
          summary: 'Search events by keyword',
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: { '200': { description: 'Search results' } },
        },
      },
      '/api/events/{id}': {
        get: {
          tags: ['Events'],
          summary: 'Get event by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            '200': { description: 'Event details' },
            '404': { description: 'Event not found' },
          },
        },
      },
      '/api/analysis/clusters': {
        get: {
          tags: ['Analysis'],
          summary: 'Get event clusters',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Event clusters' } },
        },
      },
      '/api/analysis/trends': {
        get: {
          tags: ['Analysis'],
          summary: 'Get event trends',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 30 } }],
          responses: { '200': { description: 'Trend data' } },
        },
      },
      '/api/analysis/severity-distribution': {
        get: {
          tags: ['Analysis'],
          summary: 'Get severity distribution',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Severity distribution data' } },
        },
      },
      '/api/analysis/tags/{eventId}': {
        get: {
          tags: ['Analysis'],
          summary: 'Get tags for an event',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'eventId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Event tags' } },
        },
        post: {
          tags: ['Analysis'],
          summary: 'Add a tag to an event',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'eventId', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['tag_name'],
                  properties: {
                    tag_name: { type: 'string' },
                    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Tag created' } },
        },
      },
      '/api/users/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'User profile' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { full_name: { type: 'string' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Profile updated' } },
        },
      },
      '/api/users/preferences': {
        get: {
          tags: ['Users'],
          summary: 'Get user preferences',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'User preferences' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user preferences',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    collection_frequency: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'monthly'] },
                    notification_enabled: { type: 'boolean' },
                    email_notification_enabled: { type: 'boolean' },
                    data_sources: { type: 'array', items: { type: 'string', enum: ['nvd', 'cisa', 'rss'] } },
                    alert_severity_threshold: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Preferences updated' } },
        },
      },
      '/api/users/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get notifications',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { '200': { description: 'Notification list with unreadCount' } },
        },
      },
      '/api/users/notifications/{id}/read': {
        put: {
          tags: ['Notifications'],
          summary: 'Mark notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Notification marked as read' } },
        },
      },
      '/api/users/notifications/mark-all-read': {
        put: {
          tags: ['Notifications'],
          summary: 'Mark all notifications as read',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'All notifications marked as read' } },
        },
      },
      '/api/users/notifications/history': {
        get: {
          tags: ['Notifications'],
          summary: 'Get notification history',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Notification history' } },
        },
      },
      '/api/admin/collection/status': {
        get: {
          tags: ['Admin'],
          summary: 'Get data collection status',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Collection status' } },
        },
      },
      '/api/admin/collection/run': {
        post: {
          tags: ['Admin'],
          summary: 'Trigger data collection manually',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Collection result' } },
        },
      },
      '/api/admin/collection/schedule': {
        post: {
          tags: ['Admin'],
          summary: 'Update collection schedule',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['frequency'],
                  properties: {
                    frequency: {
                      type: 'string',
                      enum: ['hourly', 'every-4-hours', 'daily', 'twice-daily', 'weekly', 'monthly'],
                    },
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Schedule updated' } },
        },
      },
      '/api/admin/collection/stop': {
        post: {
          tags: ['Admin'],
          summary: 'Stop data collection',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Collection stopped' } },
        },
      },
      '/api/admin/health': {
        get: {
          tags: ['Admin'],
          summary: 'System health check',
          responses: { '200': { description: 'System status' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
