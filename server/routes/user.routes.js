import { Router } from 'express'
import { changePassword } from '../controllers/user.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { changePasswordSchema } from '../validation/auth.schemas.js'

export const userRouter = Router()

userRouter.post('/change-password', requireAuth, validate(changePasswordSchema), changePassword)
