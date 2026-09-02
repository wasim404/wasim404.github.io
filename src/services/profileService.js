import { apiRequest } from './api'

export const profileService = {
  get() {
    return apiRequest('/api/profile')
  },
  update(details) {
    return apiRequest('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(details),
    })
  },
  updateUsername(username) {
    return apiRequest('/api/profile/username', {
      method: 'PATCH',
      body: JSON.stringify({ username }),
    })
  },
  setGender(gender) {
    return apiRequest('/api/profile/gender', {
      method: 'PATCH',
      body: JSON.stringify({ gender }),
    })
  },
  uploadAvatar(file) {
    const body = new FormData()
    body.append('avatar', file)
    return apiRequest('/api/profile/avatar', { method: 'POST', body })
  },
}
