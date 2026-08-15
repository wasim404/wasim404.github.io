import { z } from 'zod'

export const DATA_KEYS = [
  'tasks',
  'daily_stats',
  'reflections',
  'preferences',
  'checkins',
]

export const dataKeySchema = z.enum(DATA_KEYS)
export const userDataSchema = z.object({
  data: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]),
}).strict()

export const migrationSchema = z.object({
  data: z.object({
    tasks: z.array(z.unknown()).optional(),
    daily_stats: z.record(z.string(), z.unknown()).optional(),
    reflections: z.record(z.string(), z.unknown()).optional(),
    preferences: z.record(z.string(), z.unknown()).optional(),
    checkins: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
}).strict()
