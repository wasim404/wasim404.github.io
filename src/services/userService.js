import { apiRequest } from './api'

export const userService = {
  changePassword(currentPassword, newPassword) {
    return apiRequest('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },
}
