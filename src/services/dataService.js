import { apiRequest } from './api'

export const dataService = {
  getAll() {
    return apiRequest('/api/data')
  },
  save(key, data) {
    return apiRequest(`/api/data/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    })
  },
  migrate(data) {
    return apiRequest('/api/data/migrate', {
      method: 'POST',
      body: JSON.stringify({ data }),
    })
  },
}
