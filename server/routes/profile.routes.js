import { Router } from 'express'
import {
  getProfile,
  updateAvatar,
  updateGender,
  updateProfile,
  updateUsername,
} from '../controllers/profile.controller.js'
import { receiveAvatar } from '../middleware/avatar-upload.middleware.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import {
  updateGenderSchema,
  updateProfileSchema,
  updateUsernameSchema,
} from '../validation/profile.schemas.js'

export const profileRouter = Router()

profileRouter.use(requireAuth)
profileRouter.get('/', getProfile)
profileRouter.patch('/', validate(updateProfileSchema), updateProfile)
profileRouter.patch('/username', validate(updateUsernameSchema), updateUsername)
profileRouter.patch('/gender', validate(updateGenderSchema), updateGender)
profileRouter.post('/avatar', receiveAvatar, updateAvatar)
