import { withTransaction } from '../db/pool.js'
import * as profiles from '../db/profile.repository.js'
import { HttpError } from '../utils/http-error.js'
import { deleteManagedAvatar, storeAvatar } from './avatar-storage.service.js'

export async function getProfile(userId) {
  const profile = await profiles.findProfileByUserId(userId)
  if (!profile) throw new HttpError(404, '账户不存在')
  return profile
}

export async function updateProfile(userId, details) {
  const profile = await profiles.updateProfileDetails(userId, details)
  if (!profile) throw new HttpError(404, '账户不存在')
  return profile
}

export async function updateUsername(userId, username) {
  try {
    return await withTransaction(async (client) => {
      const current = await profiles.findProfileForUpdate(userId, client)
      if (!current) throw new HttpError(404, '账户不存在')
      if (current.username === username) return current

      const claimed = await profiles.claimUsernameChange(userId, client)
      if (!claimed) {
        const nextAvailableAt = await profiles.findNextUsernameChangeAt(userId, client)
        throw new HttpError(429, '用户名每 24 小时只能修改一次', {
          nextAvailableAt,
        })
      }

      await profiles.updateCanonicalUsername(userId, username, client)
      return profiles.findProfileByUserId(userId, client)
    })
  } catch (error) {
    if (error.code === '23505') throw new HttpError(409, '该用户名已被使用')
    throw error
  }
}

export async function setGender(userId, gender) {
  return withTransaction(async (client) => {
    const updated = await profiles.setGenderOnce(userId, gender, client)
    if (!updated) throw new HttpError(409, '性别设置后无法自行修改')
    return profiles.findProfileByUserId(userId, client)
  })
}

export async function updateAvatar(userId, file) {
  const stored = await storeAvatar(userId, file)
  let oldAvatarUrl
  let profile

  try {
    profile = await withTransaction(async (client) => {
      oldAvatarUrl = await profiles.replaceAvatarUrl(userId, stored.avatarUrl, client)
      return profiles.findProfileByUserId(userId, client)
    })
  } catch (error) {
    try {
      await deleteManagedAvatar(stored.avatarUrl, userId)
    } catch (cleanupError) {
      console.error('Failed to clean up uncommitted avatar', cleanupError)
    }
    throw error
  }

  if (oldAvatarUrl) {
    try {
      await deleteManagedAvatar(oldAvatarUrl, userId)
    } catch (error) {
      console.error('Failed to delete replaced avatar', error)
    }
  }

  return profile
}
