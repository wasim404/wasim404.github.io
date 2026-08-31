import { useEffect, useRef, useState } from 'react'
import { notesApi } from '../services/notesApi'

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function sortNewestFirst(notes) {
  return [...notes].sort(
    (noteA, noteB) =>
      new Date(noteB.createdAt).getTime() - new Date(noteA.createdAt).getTime(),
  )
}

function getDateGroup(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { key: 'unknown', label: '日期未知', year: '', time: '' }
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return {
    key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    label: `${month}月${day}日`,
    year: `${year}年`,
    time: timeFormatter.format(date),
  }
}

function groupNotesByDate(notes) {
  const groups = new Map()
  notes.forEach((note) => {
    const date = getDateGroup(note.createdAt)
    if (!groups.has(date.key)) groups.set(date.key, { ...date, notes: [] })
    groups.get(date.key).notes.push(note)
  })
  return [...groups.values()]
}

function NotesPage() {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [content, setContent] = useState('')
  const [composerError, setComposerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingDeleteNote, setPendingDeleteNote] = useState(null)
  const [deletingIds, setDeletingIds] = useState(() => new Set())
  const textareaRef = useRef(null)

  useEffect(() => {
    let isActive = true

    notesApi.getAll()
      .then((result) => {
        if (isActive) setNotes(sortNewestFirst(result))
      })
      .catch((error) => {
        if (isActive) setLoadError(error.message)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!isComposerOpen && !pendingDeleteNote) return undefined

    if (isComposerOpen) textareaRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      if (pendingDeleteNote && !deletingIds.has(pendingDeleteNote.id)) {
        setPendingDeleteNote(null)
      } else if (isComposerOpen && !isSaving) {
        setIsComposerOpen(false)
        setEditingNote(null)
        setContent('')
        setComposerError('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deletingIds, isComposerOpen, isSaving, pendingDeleteNote])

  function openComposer() {
    setEditingNote(null)
    setContent('')
    setComposerError('')
    setIsComposerOpen(true)
  }

  function openEditor(note) {
    setEditingNote(note)
    setContent(note.content)
    setComposerError('')
    setIsComposerOpen(true)
  }

  function closeComposer() {
    if (isSaving) return
    setIsComposerOpen(false)
    setEditingNote(null)
    setContent('')
    setComposerError('')
  }

  async function saveNote(event) {
    event.preventDefault()
    const cleanContent = content.trim()
    if (!cleanContent || isSaving) return

    setIsSaving(true)
    setComposerError('')
    try {
      if (editingNote) {
        const updatedNote = await notesApi.update(editingNote.id, cleanContent)
        setNotes((current) => sortNewestFirst(
          current.map((note) => note.id === updatedNote.id ? updatedNote : note),
        ))
      } else {
        const createdNote = await notesApi.create(cleanContent)
        setNotes((current) => sortNewestFirst([createdNote, ...current]))
      }
      setIsComposerOpen(false)
      setEditingNote(null)
      setContent('')
      setComposerError('')
    } catch (error) {
      setComposerError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteNote(noteId) {
    if (deletingIds.has(noteId)) return

    const previousNotes = notes
    setNotes((current) => current.filter((note) => note.id !== noteId))
    setDeletingIds((current) => new Set(current).add(noteId))
    setLoadError('')

    try {
      await notesApi.remove(noteId)
      setPendingDeleteNote(null)
    } catch (error) {
      setNotes(sortNewestFirst(previousNotes))
      setLoadError(error.message)
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current)
        next.delete(noteId)
        return next
      })
    }
  }

  const noteGroups = groupNotesByDate(notes)

  return (
    <main className="notes-page min-h-screen bg-[#f4f3ed] px-4 pb-20 pt-28 text-[#20332e] sm:px-6 sm:pt-32">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="flex items-end justify-between gap-5 border-b border-[#20332e]/10 pb-6">
          <div>
            <h1 className="m-0 text-[38px] font-bold tracking-[-0.045em] sm:text-[48px]">
              随手记
            </h1>
            <p className="mt-2 text-sm text-[#718079]">
              {isLoading ? '正在读取…' : `${notes.length} 条记录`}
            </p>
          </div>
          <button
            type="button"
            onClick={openComposer}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#e9bd55] px-4 py-3 text-sm font-bold text-[#3e3218] shadow-[0_10px_25px_rgba(142,105,29,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f0c967] hover:shadow-[0_14px_30px_rgba(142,105,29,0.24)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a7427] sm:px-5"
          >
            <span className="text-xl leading-none" aria-hidden="true">＋</span>
            新建记录
          </button>
        </header>

        {loadError && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-[#b45b4d]/20 bg-[#fff4f1] px-4 py-3 text-sm text-[#8f4439]" role="alert">
            <span>{loadError}</span>
            <button
              type="button"
              className="shrink-0 font-bold underline underline-offset-4"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-8" aria-label="正在加载随手记">
            <div className="mb-5 h-9 w-32 animate-pulse rounded-xl bg-white/60" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="h-[220px] animate-pulse rounded-[26px] bg-white/70" key={index} />
              ))}
            </div>
          </div>
        ) : notes.length === 0 ? (
          <section className="mt-8 grid min-h-[330px] place-items-center rounded-[30px] border border-dashed border-[#6f7e77]/25 bg-white/45 px-6 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f6e8bd] text-2xl text-[#81621e]" aria-hidden="true">✎</span>
              <h2 className="mb-0 mt-5 text-xl font-bold">还没有随手记</h2>
              <button
                type="button"
                onClick={openComposer}
                className="mt-5 rounded-xl border border-[#20332e]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#324b43] transition hover:border-[#e0b74f] hover:bg-[#fffaf0]"
              >
                写下第一条
              </button>
            </div>
          </section>
        ) : (
          <div className="space-y-12 py-8" aria-label="随手记列表">
            {noteGroups.map((group) => (
              <section key={group.key} aria-labelledby={`notes-date-${group.key}`}>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2
                    className="m-0 text-[28px] font-extrabold tracking-[-0.04em] text-[#17251f]"
                    id={`notes-date-${group.key}`}
                  >
                    {group.label}
                  </h2>
                  {group.year && (
                    <span className="text-xs font-semibold tracking-[0.08em] text-[#929c96]">
                      {group.year}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.notes.map((note) => {
                    const noteDate = getDateGroup(note.createdAt)
                    return (
                      <article
                        className="group flex h-[220px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-[26px] border border-[#253d35]/8 bg-[#fffdf8] p-5 shadow-[0_12px_35px_rgba(48,62,55,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[#d3ad4f]/35 hover:shadow-[0_18px_42px_rgba(48,62,55,0.12)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9a7427]"
                        key={note.id}
                        onDoubleClick={() => openEditor(note)}
                        onKeyDown={(event) => {
                          if (event.target === event.currentTarget && event.key === 'Enter') {
                            openEditor(note)
                          }
                        }}
                        tabIndex={0}
                        aria-label={`${group.label}${noteDate.time}的随手记，双击或按回车查看并编辑`}
                        title="双击查看并编辑"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <time className="text-[11px] font-medium text-[#89948e]" dateTime={note.createdAt}>
                            {noteDate.time}
                          </time>
                          <button
                            type="button"
                            disabled={deletingIds.has(note.id)}
                            onClick={(event) => {
                              event.stopPropagation()
                              setPendingDeleteNote(note)
                            }}
                            onDoubleClick={(event) => event.stopPropagation()}
                            className="grid size-8 shrink-0 place-items-center rounded-xl text-lg text-[#a2aaa6] transition hover:bg-[#f8e9e5] hover:text-[#a74e42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a74e42] disabled:cursor-wait disabled:opacity-40"
                            aria-label="删除这条随手记"
                          >
                            ×
                          </button>
                        </div>
                        <p
                          className="m-0 min-h-0 flex-1 overflow-hidden whitespace-pre-wrap break-words text-[15px] leading-7 text-[#30443d]"
                          style={{
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 6,
                          }}
                        >
                          {note.content.trim()}
                        </p>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {isComposerOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-[#182d27]/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeComposer()
          }}
        >
          <section
            className="modal-card max-h-[calc(100vh-2rem)] w-full max-w-[760px] overflow-y-auto rounded-[30px] border border-white/70 bg-[#fffdf8] p-5 shadow-[0_35px_100px_rgba(25,45,39,0.28)] sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-editor-title"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2
                className={editingNote ? 'sr-only' : 'm-0 text-2xl font-bold tracking-[-0.03em]'}
                id="note-editor-title"
              >
                {editingNote ? '编辑随手记' : '新建记录'}
              </h2>
              <button
                type="button"
                onClick={closeComposer}
                disabled={isSaving}
                className="ml-auto grid size-9 place-items-center rounded-xl bg-[#f0f1ec] text-xl text-[#718079] transition hover:bg-[#e5e8e1] hover:text-[#20332e] disabled:opacity-40"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveNote}>
              <label className="sr-only" htmlFor="note-content">随手记内容</label>
              <textarea
                ref={textareaRef}
                id="note-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={10000}
                rows={16}
                placeholder="写点什么……"
                className="min-h-[360px] w-full resize-y rounded-2xl border border-[#263e36]/12 bg-[#f7f5ed] p-4 text-base leading-7 text-[#263b34] outline-none transition placeholder:text-[#9ca59f] focus:border-[#d5a93d] focus:bg-white focus:ring-4 focus:ring-[#e9bd55]/15"
              />

              <div className="mt-2 flex min-h-5 items-center justify-between gap-3 text-xs">
                <p className="m-0 text-[#a44f43]" role="alert">{composerError}</p>
                <span className="shrink-0 text-[#929c96]">{content.length} / 10000</span>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeComposer}
                  disabled={isSaving}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#65736d] transition hover:bg-[#eef0eb] disabled:opacity-40"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || isSaving}
                  className="rounded-xl bg-[#263e36] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(38,62,54,0.18)] transition hover:bg-[#34584b] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? '保存中…' : editingNote ? '保存修改' : '保存'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {pendingDeleteNote && (
        <div
          className="modal-backdrop fixed inset-0 z-[110] grid place-items-center bg-[#182d27]/35 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingIds.has(pendingDeleteNote.id)) {
              setPendingDeleteNote(null)
            }
          }}
        >
          <section
            className="modal-card w-full max-w-[430px] rounded-[28px] border border-white/70 bg-[#fffdf8] p-6 shadow-[0_35px_100px_rgba(25,45,39,0.28)] sm:p-8"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            aria-describedby="delete-note-description"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[#f8e9e5] text-xl text-[#a74e42]" aria-hidden="true">
              ×
            </span>
            <h2 className="mb-0 mt-5 text-2xl font-bold tracking-[-0.03em]" id="delete-note-title">
              确认删除这条随手记？
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#718079]" id="delete-note-description">
              删除后无法恢复。请再次确认是否继续。
            </p>
            <p className="mt-4 max-h-24 overflow-hidden whitespace-pre-wrap rounded-2xl bg-[#f7f5ed] px-4 py-3 text-sm leading-6 text-[#52655e]">
              {pendingDeleteNote.content}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deletingIds.has(pendingDeleteNote.id)}
                onClick={() => setPendingDeleteNote(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#65736d] transition hover:bg-[#eef0eb] disabled:opacity-40"
              >
                取消
              </button>
              <button
                type="button"
                disabled={deletingIds.has(pendingDeleteNote.id)}
                onClick={() => deleteNote(pendingDeleteNote.id)}
                className="rounded-xl bg-[#a74e42] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(167,78,66,0.2)] transition hover:bg-[#913f35] disabled:cursor-wait disabled:opacity-50"
              >
                {deletingIds.has(pendingDeleteNote.id) ? '删除中…' : '确认删除'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default NotesPage
