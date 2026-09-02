import { z } from 'zod'

const email = z.string().trim().email('请输入有效邮箱').max(320).toLowerCase()
const password = z
  .string()
  .min(10, '密码至少需要 10 位')
  .max(128, '密码不能超过 128 位')
  .regex(/[a-zA-Z]/, '密码需要包含字母')
  .regex(/[0-9]/, '密码需要包含数字')
export const usernameSchema = z
  .string()
  .trim()
  .min(2, '用户名至少需要 2 个字符')
  .max(30, '用户名不能超过 30 个字符')
  .regex(/^[\p{L}\p{N}_-]+$/u, '用户名只能包含文字、数字、下划线或短横线')

export const registerSchema = z.object({ username: usernameSchema, email, password }).strict()
export const loginSchema = z.object({
  login: z.string().trim().min(1, '请输入用户名或邮箱').max(320),
  password: z.string().min(1).max(128),
}).strict()
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
}).strict()
export const emailCodeRequestSchema = z.object({ email }).strict()
export const emailVerifySchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, '请输入 6 位验证码'),
}).strict()
export const phoneCodeRequestSchema = z.object({
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, '请输入带国家区号的手机号'),
}).strict()
export const phoneVerifySchema = phoneCodeRequestSchema.extend({
  code: z.string().regex(/^\d{6}$/, '请输入 6 位验证码'),
})
