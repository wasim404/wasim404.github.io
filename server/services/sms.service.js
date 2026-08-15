import { env, isProduction } from '../config/env.js'

export async function sendVerificationSms(phone, code) {
  if (env.SMS_PROVIDER === 'mock' && !isProduction) {
    console.info(`[development sms] verification code for ${phone}: ${code}`)
    return { mocked: true }
  }

  throw new Error('SMS provider is not configured')
}
