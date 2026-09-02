import 'dotenv/config'
import { isAbsolute, resolve } from 'node:path'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).default('postgresql://manoong:manoong@127.0.0.1:5432/manoong'),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  SESSION_COOKIE_NAME: z.string().min(1).default('manoong_session'),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  CODE_HASH_SECRET: z.string().min(16).default('development-only-change-me'),
  VERIFICATION_CODE_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
  VERIFICATION_RESEND_SECONDS: z.coerce.number().int().min(30).max(3600).default(60),
  VERIFICATION_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM: z.string().default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.string().default('MANOONG <no-reply@manoong.com>'),
  SMS_PROVIDER: z.enum(['mock']).default('mock'),
  SMS_ACCESS_KEY: z.string().default(''),
  SMS_SECRET: z.string().default(''),
  SMS_SIGN_NAME: z.string().default(''),
  SMS_TEMPLATE_CODE: z.string().default(''),
  AVATAR_UPLOAD_DIR: z.string().min(1).default('/tmp/manoong/uploads/avatars'),
  AVATAR_PUBLIC_BASE_URL: z.string().min(1).default('/uploads/avatars'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Invalid server environment configuration')
  process.exit(1)
}

export const env = result.data
export const isProduction = env.NODE_ENV === 'production'

if (isProduction && env.CODE_HASH_SECRET === 'development-only-change-me') {
  console.error('CODE_HASH_SECRET must be replaced in production')
  process.exit(1)
}

if (isProduction && !env.RESEND_API_KEY && !env.SMTP_HOST) {
  console.error('RESEND_API_KEY or SMTP_HOST must be configured in production')
  process.exit(1)
}

if (isProduction && env.RESEND_API_KEY && !env.RESEND_FROM) {
  console.error('RESEND_FROM must be configured when using Resend in production')
  process.exit(1)
}

if (isProduction && !process.env.AVATAR_UPLOAD_DIR) {
  console.error('AVATAR_UPLOAD_DIR must be configured in production')
  process.exit(1)
}

if (isProduction && !process.env.AVATAR_PUBLIC_BASE_URL) {
  console.error('AVATAR_PUBLIC_BASE_URL must be configured in production')
  process.exit(1)
}

const resolvedAvatarUploadDirectory = resolve(env.AVATAR_UPLOAD_DIR)
if (
  isProduction &&
  (
    !isAbsolute(env.AVATAR_UPLOAD_DIR) ||
    /[\\/](?:releases|current)[\\/]/.test(resolvedAvatarUploadDirectory)
  )
) {
  console.error('AVATAR_UPLOAD_DIR must be an absolute persistent path outside release directories')
  process.exit(1)
}
