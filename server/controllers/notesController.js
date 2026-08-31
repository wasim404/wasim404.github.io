import {
  deleteNoteByUser,
  findNotesByUserId,
  insertNote,
  updateNoteByUser,
} from '../db/notes.repository.js'
import { noteIdSchema } from '../validation/notes.schemas.js'

export async function getNotes(request, response, next) {
  try {
    const notes = await findNotesByUserId(request.user.id)
    response.json({ notes })
  } catch (error) {
    next(error)
  }
}

export async function createNote(request, response, next) {
  try {
    const note = await insertNote(
      request.user.id,
      request.validatedBody.content,
    )
    response.status(201).json({ note })
  } catch (error) {
    next(error)
  }
}

export async function updateNote(request, response, next) {
  try {
    const noteId = noteIdSchema.safeParse(request.params.id)
    if (!noteId.success) {
      return response.status(404).json({ error: '随手记不存在' })
    }

    const note = await updateNoteByUser(
      request.user.id,
      noteId.data,
      request.validatedBody.content,
    )
    if (!note) {
      return response.status(404).json({ error: '随手记不存在' })
    }

    response.json({ note })
  } catch (error) {
    next(error)
  }
}

export async function deleteNote(request, response, next) {
  try {
    const noteId = noteIdSchema.safeParse(request.params.id)
    if (!noteId.success) {
      return response.status(404).json({ error: '随手记不存在' })
    }

    const deleted = await deleteNoteByUser(request.user.id, noteId.data)
    if (!deleted) {
      return response.status(404).json({ error: '随手记不存在' })
    }

    response.status(204).end()
  } catch (error) {
    next(error)
  }
}
