import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js'
import { healthRouter } from './routes/health.routes.js'
import { authRouter } from './routes/auth.routes.js'
import { userRouter } from './routes/user.routes.js'
import { verifyRequestOrigin } from './middleware/origin.middleware.js'
import { dataRouter } from './routes/data.routes.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false, limit: '32kb' }))
  app.use(cookieParser())
  app.use('/api', verifyRequestOrigin)

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/user', userRouter)
  app.use('/api/data', dataRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
