import { useEffect, useRef, useState } from 'react'
import { notesApi } from '../services/notesApi'

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function sortNewestFirst(notes) {
  return [...notes].sort(
    (noteA, noteB) =>
      new Date(noteB.createdAt).getTime() - new Date(noteA.createdAt).getTime(),
  )
}

function noteSummary(content) {
  const cleanContent = content.trim()
  return cleanContent.length > 320
    ? `${cleanContent.slice(0, 320)}…`
    : cleanContent
}

function formatCreatedAt(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

function NotesPage() {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [content, setContent] = useState('')
  const [composerError, setComposerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
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
    if (!isComposerOpen) return undefined

    textareaRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSaving) setIsComposerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isComposerOpen, isSaving])

  function openComposer() {
    setContent('')
    setComposerError('')
    setIsComposerOpen(true)
  }

  function closeComposer() {
    if (isSaving) return
    setIsComposerOpen(false)
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
      const createdNote = await notesApi.create(cleanContent)
      setNotes((current) => sortNewestFirst([createdNote, ...current]))
      closeComposer()
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
          <div className="grid grid-cols-1 gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3" aria-label="正在加载随手记">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="h-56 animate-pulse rounded-[26px] bg-white/70" key={index} />
            ))}
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
          <section className="grid grid-cols-1 gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3" aria-label="随手记列表">
            {notes.map((note) => (
              <article
                className="group flex min-h-[220px] flex-col rounded-[26px] border border-[#253d35]/8 bg-[#fffdf8] p-5 shadow-[0_12px_35px_rgba(48,62,55,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[#d3ad4f]/35 hover:shadow-[0_18px_42px_rgba(48,62,55,0.12)]"
                key={note.id}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <time className="text-[11px] font-medium text-[#89948e]" dateTime={note.createdAt}>
                    {formatCreatedAt(note.createdAt)}
                  </time>
                  <button
                    type="button"
                    disabled={deletingIds.has(note.id)}
                    onClick={() => deleteNote(note.id)}
                    className="grid size-8 shrink-0 place-items-center rounded-xl text-lg text-[#a2aaa6] transition hover:bg-[#f8e9e5] hover:text-[#a74e42] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a74e42] disabled:cursor-wait disabled:opacity-40"
                    aria-label="删除这条随手记"
                  >
                    ×
                  </button>
                </div>
                <p className="m-0 whitespace-pre-wrap break-words text-[15px] leading-7 text-[#30443d]">
                  {noteSummary(note.content)}
                </p>
              </article>
            ))}
          </section>
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
            className="modal-card w-full max-w-[620px] rounded-[30px] border border-white/70 bg-[#fffdf8] p-5 shadow-[0_35px_100px_rgba(25,45,39,0.28)] sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-note-title"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="m-0 text-2xl font-bold tracking-[-0.03em]" id="new-note-title">
                新建记录
              </h2>
              <button
                type="button"
                onClick={closeComposer}
                disabled={isSaving}
                className="grid size-9 place-items-center rounded-xl bg-[#f0f1ec] text-xl text-[#718079] transition hover:bg-[#e5e8e1] hover:text-[#20332e] disabled:opacity-40"
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
                rows={10}
                placeholder="写点什么……"
                className="w-full resize-y rounded-2xl border border-[#263e36]/12 bg-[#f7f5ed] p-4 text-base leading-7 text-[#263b34] outline-none transition placeholder:text-[#9ca59f] focus:border-[#d5a93d] focus:bg-white focus:ring-4 focus:ring-[#e9bd55]/15"
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
                  {isSaving ? '保存中…' : '保存'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default NotesPage
