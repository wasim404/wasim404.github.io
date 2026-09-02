import * as profileService from '../services/profile.service.js'

export async function getProfile(request, response, next) {
  try {
    const profile = await profileService.getProfile(request.user.id)
    response.json({ profile })
  } catch (error) {
    next(error)
  }
}

export async function updateProfile(request, response, next) {
  try {
    const profile = await profileService.updateProfile(
      request.user.id,
      request.validatedBody,
    )
    response.json({ profile })
  } catch (error) {
    next(error)
  }
}

export async function updateUsername(request, response, next) {
  try {
    const profile = await profileService.updateUsername(
      request.user.id,
      request.validatedBody.username,
    )
    response.json({ profile })
  } catch (error) {
    next(error)
  }
}

export async function updateGender(request, response, next) {
  try {
    const profile = await profileService.setGender(
      request.user.id,
      request.validatedBody.gender,
    )
    response.json({ profile })
  } catch (error) {
    next(error)
  }
}

export async function updateAvatar(request, response, next) {
  try {
    const profile = await profileService.updateAvatar(request.user.id, request.file)
    response.json({ profile })
  } catch (error) {
    next(error)
  }
}
