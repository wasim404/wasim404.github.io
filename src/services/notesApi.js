import { apiRequest } from './api'

export const notesApi = {
  async getAll() {
    const result = await apiRequest('/api/notes')
    return result.notes
  },

  async create(content) {
    const result = await apiRequest('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
    return result.note
  },

  async update(noteId, content) {
    const result = await apiRequest(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    })
    return result.note
  },

  remove(noteId) {
    return apiRequest(`/api/notes/${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
    })
  },
}
