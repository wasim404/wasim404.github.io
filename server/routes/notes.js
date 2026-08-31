import { Router } from 'express'
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from '../controllers/notesController.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { createNoteSchema } from '../validation/notes.schemas.js'

export const notesRouter = Router()

notesRouter.use(requireAuth)
notesRouter.get('/', getNotes)
notesRouter.post('/', validate(createNoteSchema), createNote)
notesRouter.patch('/:id', validate(createNoteSchema), updateNote)
notesRouter.delete('/:id', deleteNote)
