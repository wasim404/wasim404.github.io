import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto'
import { env } from '../config/env.js'

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function createVerificationCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function hashVerificationCode(type, target, code) {
  return createHmac('sha256', env.CODE_HASH_SECRET)
    .update(`${type}:${target}:${code}`)
    .digest('hex')
}

export function matchesVerificationCodeHash(actualHash, expectedHash) {
  const actual = Buffer.from(actualHash, 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
