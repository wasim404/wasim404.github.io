import { apiRequest } from './api'

export const authService = {
  register(username, email, password) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  },
  login(login, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    })
  },
  logout() {
    return apiRequest('/api/auth/logout', { method: 'POST' })
  },
  getMe() {
    return apiRequest('/api/auth/me')
  },
  sendEmailCode(email) {
    return apiRequest('/api/auth/email/send-code', {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    })
  },
  verifyEmail(email, code) {
    return apiRequest('/api/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  },
  sendPhoneCode(phone) {
    return apiRequest('/api/auth/phone/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
  },
  verifyPhone(phone, code) {
    return apiRequest('/api/auth/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    })
  },
}
