import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPassword, verifyPassword } from './password.service.js'

test('passwords use Argon2id and verify correctly', async () => {
  const password = 'A-secure-password-2026'
  const hash = await hashPassword(password)

  assert.match(hash, /^\$argon2id\$/)
  assert.equal(await verifyPassword(hash, password), true)
  assert.equal(await verifyPassword(hash, 'wrong-password'), false)
})
