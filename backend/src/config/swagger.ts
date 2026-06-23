import swaggerJSDoc from 'swagger-jsdoc';

const PORT = process.env.PORT ?? 5000;

const definition: swaggerJSDoc.OAS3Definition = {
  openapi: '3.0.0',
  info: {
    title: 'GigFlow API',
    version: '1.0.0',
    description:
      'REST API for GigFlow — a smart leads dashboard with JWT auth, role-based access control, audit trails, and CSV import/export.',
    contact: {
      name: 'Agniva Mukherjee',
      url: 'https://github.com/agniva1803/GigFlow',
    },
    license: { name: 'MIT' },
  },
  servers: [
    { url: `http://localhost:${PORT}/api`, description: 'Local' },
    { url: 'https://gigflow-kn78.onrender.com/api', description: 'Production' },
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
          id: { type: 'string' },
          name: { type: 'string', example: 'Agniva Mukherjee' },
          email: { type: 'string', example: 'admin@gigflow.com' },
          role: { type: 'string', enum: ['admin', 'sales'] },
        },
      },
      Lead: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Priya Sharma' },
          email: { type: 'string', example: 'priya@example.com' },
          status: { type: 'string', enum: ['New', 'Contacted', 'Qualified', 'Lost'] },
          source: { type: 'string', enum: ['Website', 'Instagram', 'Referral'] },
          notes: { type: 'string' },
          createdBy: { type: 'string' },
          assignedTo: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Activity: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          lead: { type: 'string' },
          actor: { type: 'string' },
          action: {
            type: 'string',
            enum: ['created', 'status_changed', 'assigned', 'updated', 'deleted', 'note_added'],
          },
          message: { type: 'string', example: 'Status changed from "New" to "Contacted"' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string', minLength: 6 },
                  role: { type: 'string', enum: ['admin', 'sales'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created, returns JWT' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful, returns JWT + user' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        responses: { '200': { description: 'Current user' }, '401': { description: 'Not authenticated' } },
      },
    },
    '/leads': {
      get: {
        tags: ['Leads'],
        summary: 'List leads with filters, search, sort, and pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['New', 'Contacted', 'Qualified', 'Lost'] } },
          { name: 'source', in: 'query', schema: { type: 'string', enum: ['Website', 'Instagram', 'Referral'] } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Matches name or email' },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['latest', 'oldest'] } },
        ],
        responses: { '200': { description: 'Paginated list of leads' } },
      },
      post: {
        tags: ['Leads'],
        summary: 'Create a new lead',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Lead' },
            },
          },
        },
        responses: { '201': { description: 'Lead created' }, '400': { description: 'Validation error' } },
      },
    },
    '/leads/{id}': {
      get: {
        tags: ['Leads'],
        summary: 'Get a single lead by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Lead found' }, '404': { description: 'Lead not found' } },
      },
      put: {
        tags: ['Leads'],
        summary: 'Update a lead (status, assignment, notes, etc.)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Lead updated' }, '403': { description: 'Access denied' } },
      },
      delete: {
        tags: ['Leads'],
        summary: 'Delete a lead',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Lead deleted' }, '403': { description: 'Access denied' } },
      },
    },
    '/leads/{id}/activity': {
      get: {
        tags: ['Leads'],
        summary: "Get a lead's audit trail / activity timeline",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'List of activity entries, newest first' } },
      },
    },
    '/leads/bulk-import': {
      post: {
        tags: ['Leads'],
        summary: 'Bulk-create leads from parsed CSV rows',
        description:
          'Accepts up to 500 rows. Each row is validated independently — invalid rows are skipped and reported, valid rows are created. Rate-limited to 10 requests/hour.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rows: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        email: { type: 'string' },
                        status: { type: 'string' },
                        source: { type: 'string' },
                        notes: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Rows imported, with per-row error report' } },
      },
    },
    '/leads/stats': {
      get: {
        tags: ['Leads'],
        summary: 'Dashboard stats — totals by status and source',
        responses: { '200': { description: 'Aggregated stats' } },
      },
    },
    '/leads/export/csv': {
      get: {
        tags: ['Leads'],
        summary: 'Export leads matching the current filters as CSV',
        responses: { '200': { description: 'CSV file stream' } },
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({ definition, apis: [] });
