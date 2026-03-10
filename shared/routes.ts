import { z } from 'zod';
import { insertMotorcycleSchema, motorcycles, insertMaintenanceSchema, maintenance, insertModificationSchema, modifications, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    }
  },
  motorcycles: {
    list: {
      method: 'GET' as const,
      path: '/api/motorcycles' as const,
      responses: {
        200: z.array(z.custom<typeof motorcycles.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/motorcycles/:id' as const,
      responses: {
        200: z.custom<typeof motorcycles.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/motorcycles' as const,
      input: insertMotorcycleSchema,
      responses: {
        201: z.custom<typeof motorcycles.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/motorcycles/:id' as const,
      input: insertMotorcycleSchema.partial(),
      responses: {
        200: z.custom<typeof motorcycles.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/motorcycles/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  maintenance: {
    list: {
      method: 'GET' as const,
      path: '/api/motorcycles/:motorcycleId/maintenance' as const,
      responses: {
        200: z.array(z.custom<typeof maintenance.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/motorcycles/:motorcycleId/maintenance' as const,
      input: insertMaintenanceSchema.omit({ motorcycleId: true }),
      responses: {
        201: z.custom<typeof maintenance.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/maintenance/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  modifications: {
    list: {
      method: 'GET' as const,
      path: '/api/motorcycles/:motorcycleId/modifications' as const,
      responses: {
        200: z.array(z.custom<typeof modifications.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/motorcycles/:motorcycleId/modifications' as const,
      input: insertModificationSchema.omit({ motorcycleId: true }),
      responses: {
        201: z.custom<typeof modifications.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/modifications/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  dashboard: {
    summary: {
      method: 'GET' as const,
      path: '/api/dashboard' as const,
      responses: {
        200: z.object({
          motorcycleCount: z.number(),
          totalExpenses: z.number(),
          recentActivity: z.array(z.any()),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  documents: {
    uploadRegistration: {
      method: 'POST' as const,
      path: '/api/motorcycles/:motorcycleId/registration-document' as const,
      input: z.object({
        documentUrl: z.string().min(1, "Document URL is required"),
        registrationDate: z.string().min(1, "Registration date is required"),
        initialMileage: z.coerce.number().min(0, "Initial mileage must be non-negative"),
        createMaintenanceRecord: z.boolean().default(true),
      }),
      responses: {
        200: z.object({
          motorcycle: z.custom<typeof motorcycles.$inferSelect>(),
          maintenanceCreated: z.boolean(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    addHistoricalMaintenance: {
      method: 'POST' as const,
      path: '/api/motorcycles/:motorcycleId/maintenance-history' as const,
      input: z.object({
        title: z.string().min(1, "Service title is required"),
        date: z.string().min(1, "Date is required"),
        mileage: z.coerce.number().min(0, "Mileage must be non-negative"),
        cost: z.coerce.string().optional(),
        notes: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof maintenance.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
