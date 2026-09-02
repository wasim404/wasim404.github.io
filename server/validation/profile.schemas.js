import { z } from 'zod'
import { usernameSchema } from './auth.schemas.js'

function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  if (Number(value.slice(0, 4)) === 0) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const birthdaySchema = z.union([
  z.null(),
  z.string().refine(isRealIsoDate, '请输入有效的生日日期'),
])

const bioSchema = z.string()
  .trim()
  .refine((value) => [...value].length <= 30, '个性签名不能超过 30 个字符')
  .transform((value) => value || null)

export const updateProfileSchema = z.object({
  birthday: birthdaySchema.optional(),
  bio: bioSchema.optional(),
}).strict().refine(
  (value) => Object.hasOwn(value, 'birthday') || Object.hasOwn(value, 'bio'),
  '请至少提供一项需要更新的资料',
)

export const updateUsernameSchema = z.object({
  username: usernameSchema,
}).strict()

export const updateGenderSchema = z.object({
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    error: '请选择有效的性别选项',
  }),
}).strict()
