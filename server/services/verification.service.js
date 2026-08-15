import { env } from '../config/env.js'
import { withTransaction } from '../db/pool.js'
import * as verificationCodes from '../db/verification.repository.js'
import {
  createVerificationCode,
  hashVerificationCode,
  matchesVerificationCodeHash,
} from '../utils/crypto.js'
import { HttpError } from '../utils/http-error.js'

export async function issueVerificationCode({ userId, type, target, send }) {
  const latest = await verificationCodes.findLatestCode(type, target)
  if (latest) {
    const elapsedSeconds = (Date.now() - new Date(latest.created_at).getTime()) / 1000
    if (elapsedSeconds < env.VERIFICATION_RESEND_SECONDS) {
      throw new HttpError(429, `请在 ${Math.ceil(env.VERIFICATION_RESEND_SECONDS - elapsedSeconds)} 秒后重试`)
    }
  }

  const code = createVerificationCode()
  await send(target, code)
  await verificationCodes.createCode({
    userId,
    type,
    target,
    codeHash: hashVerificationCode(type, target, code),
    expiresAt: new Date(Date.now() + env.VERIFICATION_CODE_TTL_MINUTES * 60 * 1000),
  })
}

export async function consumeVerificationCode({ type, target, code, userId }, transactionClient) {
  const consume = async (client) => {
    const record = await verificationCodes.findCodeForUpdate(type, target, client)
    const invalid =
      !record ||
      record.user_id !== userId ||
      new Date(record.expires_at).getTime() <= Date.now() ||
      record.attempts >= env.VERIFICATION_MAX_ATTEMPTS

    if (invalid) return false

    const expectedHash = hashVerificationCode(type, target, code)
    if (!matchesVerificationCodeHash(record.code_hash, expectedHash)) {
      await verificationCodes.incrementAttempts(record.id, client)
      return false
    }

    await verificationCodes.markCodeUsed(record.id, client)
    return true
  }

  if (transactionClient) return consume(transactionClient)
  return withTransaction(consume)
}
