import { z } from 'zod';

import { EventSchema, LocationSchema } from './schemas';

export type Event = z.infer<typeof EventSchema>;
export type Location = z.infer<typeof LocationSchema>;

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
