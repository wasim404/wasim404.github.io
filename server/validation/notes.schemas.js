import { z } from 'zod'

export const createNoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '随手记内容不能为空')
    .max(10000, '随手记内容不能超过 10000 个字符'),
}).strict()

export const noteIdSchema = z.string().uuid()
