import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { login, logout, me, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { optionalAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  emailCodeRequestSchema,
  emailVerifySchema,
  loginSchema,
  phoneCodeRequestSchema,
  phoneVerifySchema,
  registerSchema,
} from '../validation/auth.schemas.js'
import {
  sendEmailCode,
  sendPhoneCode,
  verifyEmail,
  verifyPhone,
} from '../controllers/verification.controller.js'

export const authRouter = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: '尝试次数过多，请稍后再试' },
})

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: '验证码请求过于频繁，请稍后再试' },
})

authRouter.post('/register', authLimiter, validate(registerSchema), register)
authRouter.post('/login', authLimiter, validate(loginSchema), login)
authRouter.post('/logout', requireAuth, logout)
authRouter.get('/me', requireAuth, me)
authRouter.post('/email/send-code', verificationLimiter, optionalAuth, validate(emailCodeRequestSchema), sendEmailCode)
authRouter.post('/email/verify', verificationLimiter, optionalAuth, validate(emailVerifySchema), verifyEmail)
authRouter.post('/phone/send-code', verificationLimiter, requireAuth, validate(phoneCodeRequestSchema), sendPhoneCode)
authRouter.post('/phone/verify', verificationLimiter, requireAuth, validate(phoneVerifySchema), verifyPhone)
