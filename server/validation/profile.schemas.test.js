import assert from 'node:assert/strict'
import test from 'node:test'
import {
  updateGenderSchema,
  updateProfileSchema,
  updateUsernameSchema,
} from './profile.schemas.js'

test('profile details accept nullable birthday and a 30 character bio', () => {
  const parsed = updateProfileSchema.safeParse({
    birthday: null,
    bio: '好'.repeat(30),
  })
  assert.equal(parsed.success, true)
})

test('profile details reject long bios, invalid dates and forged user ids', () => {
  assert.equal(updateProfileSchema.safeParse({ bio: '好'.repeat(31) }).success, false)
  assert.equal(updateProfileSchema.safeParse({ birthday: '2026-02-30' }).success, false)
  assert.equal(updateProfileSchema.safeParse({ bio: '测试', user_id: 'someone-else' }).success, false)
})

test('profile username reuses registration username rules', () => {
  assert.equal(updateUsernameSchema.safeParse({ username: '新名字_02' }).success, true)
  assert.equal(updateUsernameSchema.safeParse({ username: 'bad name' }).success, false)
})

test('profile gender only accepts stable enum values', () => {
  assert.equal(updateGenderSchema.safeParse({ gender: 'prefer_not_to_say' }).success, true)
  assert.equal(updateGenderSchema.safeParse({ gender: '不愿透露' }).success, false)
})
