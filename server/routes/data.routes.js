import { Router } from 'express'
import { getData, migrateData, putData } from '../controllers/data.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { migrationSchema, userDataSchema } from '../validation/data.schemas.js'

export const dataRouter = Router()

dataRouter.use(requireAuth)
dataRouter.get('/', getData)
dataRouter.put('/:key', validate(userDataSchema), putData)
dataRouter.post('/migrate', validate(migrationSchema), migrateData)
