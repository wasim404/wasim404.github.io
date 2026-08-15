import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  localDateKey,
  nextTaskOccurrence,
  recurrenceLabel,
} from '../../utils/taskRecurrence'
import './FocusPage.css'
import { setAccountStorageItem } from '../../services/accountData'

const TASKS_STORAGE_KEY = 'manoong-schedule-tasks'
const PREFERENCES_STORAGE_KEY = 'manoong-focus-preferences'
const DAILY_STATS_KEY = 'manoong-daily-stats'
const ACTIVE_FOCUS_SESSION_KEY = 'manoong-active-focus-session'
const MAX_SECONDS = 12 * 60 * 60
const MIN_SAVED_FOCUS_SECONDS = 5 * 60
const REST_PROMPT_AUTO_CONTINUE_SECONDS = 30

const pad = (value) => String(Math.max(0, value)).padStart(2, '0')

function recordFocusTime(totalSeconds) {
  if (totalSeconds < MIN_SAVED_FOCUS_SECONDS) return false

  try {
    const storedStats = JSON.parse(
      localStorage.getItem(DAILY_STATS_KEY) || '{}',
    )
    const stats =
      storedStats &&
      typeof storedStats === 'object' &&
      !Array.isArray(storedStats)
        ? storedStats
        : {}
    const key = localDateKey()
    const day = { ...(stats[key] || {}) }
    day.focusSeconds = (Number(day.focusSeconds) || 0) + totalSeconds
    day.focusSessions = (Number(day.focusSessions) || 0) + 1
    day.lastFocusedAt = new Date().toISOString()
    stats[key] = day
    setAccountStorageItem(DAILY_STATS_KEY, JSON.stringify(stats))
    return true
  } catch {
    // A disabled or full browser store should never prevent ending a session.
    return false
  }
}

function readTasks() {
  try {
    const value = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function readActiveFocusSession() {
  try {
    const snapshot = JSON.parse(
      sessionStorage.getItem(ACTIVE_FOCUS_SESSION_KEY) || 'null',
    )
    if (
      !snapshot ||
      (snapshot.mode !== 'up' && snapshot.mode !== 'down') ||
      !Number.isFinite(Number(snapshot.elapsedSeconds)) ||
      Date.now() - Number(snapshot.savedAt) > 24 * 60 * 60 * 1000
    ) {
      sessionStorage.removeItem(ACTIVE_FOCUS_SESSION_KEY)
      return null
    }

    const durationMinutes = Math.min(
      720,
      Math.max(1, Number(snapshot.durationMinutes) || 50),
    )
    const maximumElapsed =
      snapshot.mode === 'down' ? durationMinutes * 60 : MAX_SECONDS

    return {
      mode: snapshot.mode,
      durationMinutes,
      reminderMinutes: Math.max(0, Number(snapshot.reminderMinutes) || 0),
      breakMinutes: Math.max(1, Number(snapshot.breakMinutes) || 10),
      task:
        snapshot.task && typeof snapshot.task === 'object'
          ? snapshot.task
          : null,
      resumeElapsedSeconds: Math.min(
        maximumElapsed,
        Math.max(0, Number(snapshot.elapsedSeconds) || 0),
      ),
      resumePaused: Boolean(snapshot.isPaused),
      resumeAfterRefresh: true,
    }
  } catch {
    return null
  }
}

function saveActiveFocusSession(snapshot) {
  try {
    sessionStorage.setItem(
      ACTIVE_FOCUS_SESSION_KEY,
      JSON.stringify({ ...snapshot, savedAt: Date.now() }),
    )
  } catch {
    // Focus remains usable even if session storage is unavailable.
  }
}

function clearActiveFocusSession() {
  try {
    sessionStorage.removeItem(ACTIVE_FOCUS_SESSION_KEY)
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function createLaunchSession(launchRequest, preferences) {
  const requestedMinutes = Number(launchRequest?.durationMinutes)
  if (!Number.isFinite(requestedMinutes)) return null

  return {
    mode: 'down',
    durationMinutes: Math.min(720, Math.max(1, Math.round(requestedMinutes))),
    reminderMinutes: Math.max(
      0,
      Number(preferences.reminderMinutes) || 0,
    ),
    breakMinutes: Math.max(1, Number(preferences.breakMinutes) || 10),
    task: null,
  }
}

function formatTaskDate(task) {
  const date = new Date(task.occurrenceStart || task.start)
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  const dayLabel = isToday
    ? '今天'
    : `${date.getMonth() + 1}月${date.getDate()}日`
  const timeLabel = task.hasTime
    ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
    : '灵活安排'
  const repeatLabel = recurrenceLabel(task)

  return `${dayLabel} · ${timeLabel}${repeatLabel ? ` · ${repeatLabel}` : ''}`
}

function FlipPair({ value, label, tick }) {
  return (
    <div className="flip-unit" aria-label={`${value}${label}`}>
      <div className="flip-card">
        <span className="flip-card__number">{value}</span>
        <span key={tick} className="flip-card__leaf" aria-hidden="true">
          {value}
        </span>
        <span className="flip-card__shine" aria-hidden="true" />
      </div>
      <span className="flip-unit__label">{label}</span>
    </div>
  )
}

function FocusTimer({
  mode,
  durationMinutes,
  task,
  reminderMinutes,
  breakMinutes,
  resumeElapsedSeconds = 0,
  resumePaused = false,
  resumeAfterRefresh = false,
  onFinish,
}) {
  const initialSeconds = mode === 'down' ? durationMinutes * 60 : 0
  const safeResumeElapsed = Math.min(
    mode === 'down' ? initialSeconds : MAX_SECONDS,
    Math.max(0, Number(resumeElapsedSeconds) || 0),
  )
  const [seconds, setSeconds] = useState(() =>
    mode === 'down'
      ? Math.max(0, initialSeconds - safeResumeElapsed)
      : safeResumeElapsed,
  )
  const [isPaused, setIsPaused] = useState(Boolean(resumePaused))
  const [showControls, setShowControls] = useState(true)
  const [showRestPrompt, setShowRestPrompt] = useState(false)
  const [restPromptSeconds, setRestPromptSeconds] = useState(
    REST_PROMPT_AUTO_CONTINUE_SECONDS,
  )
  const [showStopPrompt, setShowStopPrompt] = useState(
    Boolean(resumeAfterRefresh),
  )
  const [exitSource, setExitSource] = useState(
    resumeAfterRefresh ? 'restore' : 'control',
  )
  const [isResting, setIsResting] = useState(false)
  const [restSeconds, setRestSeconds] = useState(breakMinutes * 60)
  const reminderShownRef = useRef(false)
  const completionTriggeredRef = useRef(false)
  const hideTimerRef = useRef(null)

  useEffect(() => {
    document.body.classList.add('focus-session-open')
    return () => {
      document.body.classList.remove('focus-session-open')
      window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  useEffect(() => {
    function addHistoryGuard() {
      window.history.pushState(
        { ...window.history.state, manoongFocusGuard: true },
        '',
        window.location.href,
      )
    }

    function handleBrowserBack() {
      setExitSource('back')
      setShowRestPrompt(false)
      addHistoryGuard()
      setShowStopPrompt(true)
    }

    addHistoryGuard()
    window.addEventListener('popstate', handleBrowserBack)
    return () => window.removeEventListener('popstate', handleBrowserBack)
  }, [])

  useEffect(() => {
    if (isPaused || showRestPrompt || showStopPrompt || isResting) return undefined

    const anchorTime = Date.now()
    const anchorSeconds = seconds

    function updateFromClock() {
      const elapsed = Math.floor((Date.now() - anchorTime) / 1000)
      const next =
        mode === 'down'
          ? Math.max(0, anchorSeconds - elapsed)
          : Math.min(MAX_SECONDS, anchorSeconds + elapsed)

      setSeconds(next)

      if (
        reminderMinutes > 0 &&
        !reminderShownRef.current &&
        (mode === 'up'
          ? next >= reminderMinutes * 60
          : initialSeconds - next >= reminderMinutes * 60)
      ) {
        reminderShownRef.current = true
        setShowRestPrompt(true)
      }

      if (
        !completionTriggeredRef.current &&
        ((mode === 'down' && next === 0) ||
          (mode === 'up' && next === MAX_SECONDS))
      ) {
        completionTriggeredRef.current = true
        onFinish(
          mode === 'down' ? initialSeconds : next,
          true,
          'automatic',
        )
      }
    }

    const timer = window.setInterval(updateFromClock, 200)

    return () => window.clearInterval(timer)
    // `seconds` is intentionally captured only when a running period begins.
    // Pausing, resting, or opening a blocking dialog starts a fresh anchor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialSeconds,
    isPaused,
    isResting,
    mode,
    onFinish,
    reminderMinutes,
    showRestPrompt,
    showStopPrompt,
  ])

  useEffect(() => {
    if (!showRestPrompt || mode !== 'up') return undefined

    const continueAt = Date.now() + REST_PROMPT_AUTO_CONTINUE_SECONDS * 1000

    function updateAutoContinueCountdown() {
      const remaining = Math.max(
        0,
        Math.ceil((continueAt - Date.now()) / 1000),
      )
      setRestPromptSeconds(remaining)

      if (remaining === 0) setShowRestPrompt(false)
    }

    const timer = window.setInterval(updateAutoContinueCountdown, 250)
    return () => window.clearInterval(timer)
  }, [mode, showRestPrompt])

  useEffect(() => {
    if (!isResting) return undefined
    const timer = window.setInterval(() => {
      setRestSeconds((current) => {
        if (current <= 1) {
          window.setTimeout(() => {
            setIsResting(false)
            setRestSeconds(breakMinutes * 60)
          }, 0)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [breakMinutes, isResting])

  useEffect(() => {
    function handleKeyDown(event) {
      const isRefreshShortcut =
        event.key === 'F5' ||
        ((event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'r')

      if (isRefreshShortcut) {
        event.preventDefault()
        setExitSource('refresh')
        setShowRestPrompt(false)
        setShowStopPrompt(true)
        return
      }

      if (
        event.code === 'Space' &&
        !isResting &&
        !showRestPrompt &&
        !showStopPrompt
      ) {
        event.preventDefault()
        setIsPaused((current) => !current)
      }
      if (event.key === 'Escape') {
        setExitSource('control')
        setShowRestPrompt(false)
        setShowStopPrompt(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isResting, showRestPrompt, showStopPrompt])

  function revealControls() {
    setShowControls(true)
    window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => setShowControls(false), 2600)
  }

  function requestStop(source = 'control') {
    setExitSource(source)
    setShowRestPrompt(false)
    setShowStopPrompt(true)
  }

  function continueFocus() {
    setExitSource('control')
    setShowStopPrompt(false)
  }

  const visibleSeconds = isResting ? restSeconds : seconds
  const elapsedSeconds =
    mode === 'down' ? initialSeconds - seconds : seconds
  const isEarlyExit = elapsedSeconds < MIN_SAVED_FOCUS_SECONDS
  const encouragements = [
    '有急事吗？没关系，我会在这里等你。',
    '要不要再坚持一小会儿？五分钟后再回头看看。',
    '刚开始也算开始。如果可以，再给自己一点进入状态的时间。',
    '注意力偶尔走开很正常，轻轻把它带回来就好。',
  ]
  const encouragement =
    encouragements[elapsedSeconds % encouragements.length]
  const hours = pad(Math.floor(visibleSeconds / 3600))
  const minutes = pad(Math.floor((visibleSeconds % 3600) / 60))
  const secondValue = pad(visibleSeconds % 60)

  useEffect(() => {
    saveActiveFocusSession({
      mode,
      durationMinutes,
      reminderMinutes,
      breakMinutes,
      task,
      elapsedSeconds,
      isPaused,
    })
  }, [
    breakMinutes,
    durationMinutes,
    elapsedSeconds,
    isPaused,
    mode,
    reminderMinutes,
    task,
  ])

  return (
    <div
      className={`focus-timer ${showControls ? 'is-awake' : ''}`}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      <div className="focus-timer__ambient focus-timer__ambient--one" />
      <div className="focus-timer__ambient focus-timer__ambient--two" />

      <div className="focus-timer__meta">
        <span className="focus-timer__pulse" />
        {isResting
          ? `休息 ${breakMinutes} 分钟`
          : task
            ? task.title
            : '自由专注'}
      </div>

      <main className="scoreboard" aria-live="off">
        <FlipPair value={hours} label="时" tick={visibleSeconds} />
        <span className="scoreboard__colon" aria-hidden="true">
          <i />
          <i />
        </span>
        <FlipPair value={minutes} label="分" tick={visibleSeconds} />
        <span className="scoreboard__colon" aria-hidden="true">
          <i />
          <i />
        </span>
        <FlipPair value={secondValue} label="秒" tick={visibleSeconds} />
      </main>

      <p className="focus-timer__state" aria-live="polite">
        {isResting
          ? '慢慢呼吸，回来时思路会更清晰'
          : isPaused
            ? '已暂停'
            : mode === 'down'
              ? '保持当下，时间正在为你倒数'
              : '不赶时间，只记录投入'}
      </p>

      <div className="focus-controls" aria-label="计时控制">
        <button
          type="button"
          onClick={() => setIsPaused((current) => !current)}
          disabled={isResting}
        >
          <span>{isPaused ? '▶' : 'Ⅱ'}</span>
          {isPaused ? '继续' : '暂停'}
        </button>
        <span className="focus-controls__line" />
        <button type="button" onClick={() => requestStop()}>
          <span>■</span>
          结束
        </button>
      </div>

      <span className="focus-timer__hint">
        {isResting
          ? '休息计时中 · 回来后会继续保持原来的节奏'
          : '移动光标显示控制 · 空格暂停'}
      </span>

      {showRestPrompt && (
        <div className="focus-dialog-backdrop">
          <section
            className="focus-dialog focus-dialog--rest"
            role="dialog"
            aria-modal="true"
            aria-labelledby="focus-rest-title"
          >
            <span className="focus-dialog__icon">☕</span>
            <p className="focus-dialog__eyebrow">温柔提醒</p>
            <h2 id="focus-rest-title">专注很久了，休息一下吗？</h2>
            <p>
              短暂离开屏幕、喝口水，通常比勉强坚持更有效。
            </p>
            {mode === 'up' && (
              <div
                className="focus-dialog__auto-continue"
                role="status"
                aria-live="polite"
              >
                <span aria-hidden="true">
                  <i
                    style={{
                      '--auto-continue-progress': `${
                        (restPromptSeconds /
                          REST_PROMPT_AUTO_CONTINUE_SECONDS) *
                        100
                      }%`,
                    }}
                  />
                </span>
                <p>
                  <span>
                    <strong>{restPromptSeconds} 秒</strong> 后自动继续计时
                  </span>
                  <small>无需操作，倒计时结束后将恢复原来的节奏</small>
                </p>
              </div>
            )}
            <div className="focus-dialog__actions">
              <button
                className="focus-dialog__primary"
                type="button"
                onClick={() => {
                  setShowRestPrompt(false)
                  setRestSeconds(breakMinutes * 60)
                  setIsResting(true)
                }}
              >
                休息 {breakMinutes} 分钟
              </button>
              <button type="button" onClick={() => setShowRestPrompt(false)}>
                暂时不用
              </button>
            </div>
          </section>
        </div>
      )}

      {showStopPrompt && (
        <div className="focus-dialog-backdrop">
          <section
            className={`focus-dialog focus-dialog--compact ${isEarlyExit ? 'focus-dialog--early' : ''}`}
            role="dialog"
            aria-modal="true"
          >
            {isEarlyExit && <span className="focus-dialog__early-icon">↗</span>}
            <p className="focus-dialog__eyebrow">
              {exitSource === 'back'
                ? '离开专注模式'
                : exitSource === 'refresh'
                  ? '刷新当前页面'
                  : exitSource === 'restore'
                    ? '专注状态已恢复'
                  : '结束专注'}
            </p>
            <h2>
              {exitSource === 'restore'
                ? '要继续刚才的专注吗？'
                : isEarlyExit
                  ? '才刚刚开始，要现在离开吗？'
                  : '要保存这段专注吗？'}
            </h2>
            <p>
              {exitSource === 'restore'
                ? `已为你恢复到 ${Math.floor(elapsedSeconds / 60)}:${pad(
                    elapsedSeconds % 60,
                  )}，确认后再决定继续或结束。`
                : isEarlyExit
                ? encouragement
                : `本次已经专注 ${Math.floor(elapsedSeconds / 60)} 分钟，可以安心收尾了。`}
            </p>

            {isEarlyExit && (
              <div className="early-focus-progress">
                <div>
                  <span>已专注 {Math.floor(elapsedSeconds / 60)}:{pad(elapsedSeconds % 60)}</span>
                  <span>5:00 后计入统计</span>
                </div>
                <i>
                  <span
                    style={{
                      width: `${Math.min(100, (elapsedSeconds / MIN_SAVED_FOCUS_SECONDS) * 100)}%`,
                    }}
                  />
                </i>
                <p>不足 5 分钟的专注不会计入今日记录。</p>
              </div>
            )}

            <div className="focus-dialog__actions">
              {isEarlyExit ? (
                <>
                  <button
                    className="focus-dialog__primary"
                    type="button"
                    onClick={continueFocus}
                  >
                    再坚持一下
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onFinish(elapsedSeconds, false, exitSource)
                    }
                  >
                    {exitSource === 'refresh'
                      ? '仍然刷新'
                      : exitSource === 'restore'
                        ? '结束这次专注'
                        : '仍然结束'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="focus-dialog__primary"
                    type="button"
                    onClick={() =>
                      onFinish(elapsedSeconds, false, exitSource)
                    }
                  >
                    {exitSource === 'refresh'
                      ? '保存并刷新'
                      : '保存并结束'}
                  </button>
                  <button type="button" onClick={continueFocus}>
                    继续专注
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

const CELEBRATION_COLORS = [
  '#2c8e89',
  '#756bc4',
  '#e6a84c',
  '#e27873',
  '#78b88d',
]

function FocusCelebration({
  minutes,
  taskTitle,
  automatic,
  onComplete,
}) {
  const completedRef = useRef(false)
  const actionRef = useRef(null)
  const confetti = Array.from({ length: 24 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 24
    const distance = 150 + (index % 4) * 34
    return {
      id: index,
      style: {
        '--celebration-x': `${Math.cos(angle) * distance}px`,
        '--celebration-y': `${Math.sin(angle) * distance}px`,
        '--celebration-rotation': `${140 + index * 37}deg`,
        '--celebration-delay': `${(index % 6) * 45}ms`,
        '--celebration-color':
          CELEBRATION_COLORS[index % CELEBRATION_COLORS.length],
      },
    }
  })

  function finishCelebration() {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  useEffect(() => {
    document.body.classList.add('focus-celebration-open')
    actionRef.current?.focus()
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const timer = window.setTimeout(
      finishCelebration,
      prefersReducedMotion ? 1400 : 3800,
    )

    return () => {
      document.body.classList.remove('focus-celebration-open')
      window.clearTimeout(timer)
    }
  })

  return (
    <section
      className="focus-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-celebration-title"
    >
      <div className="focus-celebration__glow focus-celebration__glow--one" />
      <div className="focus-celebration__glow focus-celebration__glow--two" />

      <div className="focus-celebration__confetti" aria-hidden="true">
        {confetti.map((piece) => (
          <i key={piece.id} style={piece.style} />
        ))}
      </div>

      <div className="focus-celebration__content">
        <div className="focus-celebration__mark" aria-hidden="true">
          <span>✓</span>
          <i />
          <i />
        </div>
        <p className="focus-celebration__eyebrow">FOCUS SAVED</p>
        <h1 id="focus-celebration-title">这段专注，值得庆祝</h1>
        <p className="focus-celebration__message">
          {automatic
            ? '你完整走完了设定的节奏。'
            : '你为重要的事情留出了一段不被打扰的时间。'}
        </p>

        <div className="focus-celebration__result">
          <strong>{minutes}</strong>
          <span>
            分钟
            <small>已计入今天的专注记录</small>
          </span>
        </div>

        {taskTitle && (
          <div className="focus-celebration__task">
            <span aria-hidden="true">✦</span>
            <p>
              本次专注
              <strong>{taskTitle}</strong>
            </p>
          </div>
        )}

        <button
          ref={actionRef}
          type="button"
          onClick={finishCelebration}
        >
          收下这份专注
          <span aria-hidden="true">→</span>
        </button>
        <small className="focus-celebration__hint">
          动画结束后将自动返回
        </small>
      </div>
    </section>
  )
}

function FocusPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [preferences] = useState(() => readPreferences())
  const [tasks] = useState(() => {
    const cutoff = Date.now() - 86400000
    const today = new Date()
    return readTasks()
      .flatMap((task) => {
        if (task.recurrence) {
          const occurrence = nextTaskOccurrence(task, today)
          if (!occurrence) return []
          return [
            {
              ...task,
              occurrenceStart: occurrence.toISOString(),
              focusOptionId: `${task.id}::${localDateKey(occurrence)}`,
            },
          ]
        }

        if (
          task.completed ||
          new Date(task.end).getTime() <= cutoff
        ) {
          return []
        }

        return [{ ...task, focusOptionId: task.id }]
      })
      .sort(
        (taskA, taskB) =>
          new Date(taskA.occurrenceStart || taskA.start) -
          new Date(taskB.occurrenceStart || taskB.start),
      )
  })
  const [mode, setMode] = useState(preferences.mode || 'up')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(
    preferences.durationMinutes || 50,
  )
  const [reminderMinutes, setReminderMinutes] = useState(
    preferences.reminderMinutes ?? 120,
  )
  const [breakMinutes, setBreakMinutes] = useState(
    preferences.breakMinutes || 10,
  )
  const [session, setSession] = useState(
    () =>
      readActiveFocusSession() ||
      createLaunchSession(location.state?.focusLaunch, preferences),
  )
  const [summary, setSummary] = useState(null)
  const [celebration, setCelebration] = useState(null)

  useEffect(() => {
    if (!location.state?.focusLaunch) return
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const selectedTask = tasks.find(
    (task) => task.focusOptionId === selectedTaskId,
  )

  function changeDuration(delta) {
    setDurationMinutes((current) =>
      Math.min(720, Math.max(1, current + delta)),
    )
  }

  function startFocus() {
    clearActiveFocusSession()
    const nextSession = {
      mode,
      durationMinutes,
      reminderMinutes,
      breakMinutes,
      task: selectedTask || null,
    }
    setAccountStorageItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        mode,
        durationMinutes,
        reminderMinutes,
        breakMinutes,
      }),
    )
    saveActiveFocusSession({
      ...nextSession,
      elapsedSeconds: 0,
      isPaused: false,
    })
    setSummary(null)
    setCelebration(null)
    setSession(nextSession)
  }

  function leaveFocus(exitSource) {
    window.setTimeout(() => {
      if (exitSource === 'refresh') window.location.reload()
      else if (exitSource === 'back') window.history.go(-2)
      else window.history.back()
    }, 0)
  }

  function finishFocus(
    totalSeconds,
    automatic = false,
    exitSource = 'automatic',
  ) {
    clearActiveFocusSession()
    const eligible = totalSeconds >= MIN_SAVED_FOCUS_SECONDS
    const saved = eligible ? recordFocusTime(totalSeconds) : false
    const result = {
      minutes: Math.max(0, Math.floor(totalSeconds / 60)),
      automatic,
      saved,
      saveFailed: eligible && !saved,
      exitSource,
      taskTitle: session?.task?.title || '',
    }
    setSession(null)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})

    if (saved) {
      setCelebration(result)
      return
    }

    setSummary(result)
    leaveFocus(exitSource)
  }

  if (session) {
    return <FocusTimer {...session} onFinish={finishFocus} />
  }

  if (celebration) {
    return (
      <FocusCelebration
        minutes={celebration.minutes}
        taskTitle={celebration.taskTitle}
        automatic={celebration.automatic}
        onComplete={() => {
          setSummary(celebration)
          setCelebration(null)
          leaveFocus(celebration.exitSource)
        }}
      />
    )
  }

  return (
    <main className="focus-page">
      <div className="focus-page__orb focus-page__orb--one" />
      <div className="focus-page__orb focus-page__orb--two" />

      <div className="focus-shell">
        <header className="focus-heading">
          <div className="focus-heading__status">
            <i />
            空间已准备好
          </div>
        </header>

        {summary && (
          <section className="focus-summary" aria-live="polite">
            <span>✓</span>
            <div>
              <strong>
                {summary.saveFailed
                  ? '这段专注暂时没能保存'
                  : summary.saved
                  ? summary.automatic
                    ? '本轮专注已自动完成'
                    : '这段专注已收好'
                  : '短暂离开也没关系'}
              </strong>
              <p>
                {summary.saveFailed
                  ? '浏览器存储当前不可用，请稍后再试。'
                  : summary.saved
                  ? `你为重要的事投入了 ${summary.minutes} 分钟，做得很好。`
                  : '这次不足 5 分钟，没有计入统计。准备好时，我们再开始。'}
              </p>
            </div>
            <button type="button" onClick={() => setSummary(null)} aria-label="关闭">
              ×
            </button>
          </section>
        )}

        <div className="focus-grid">
          <section className="focus-panel focus-panel--primary">
            <div className="focus-panel__title">
              <span>01</span>
              <div>
                <h2>这次专注于什么？</h2>
                <p>可以关联日程任务，也可以直接开始</p>
              </div>
            </div>

            <div className="task-options" role="radiogroup" aria-label="选择专注任务">
              <button
                type="button"
                role="radio"
                aria-checked={!selectedTaskId}
                className={!selectedTaskId ? 'is-selected' : ''}
                onClick={() => setSelectedTaskId('')}
              >
                <span className="task-option__icon">∞</span>
                <span>
                  <strong>自由专注</strong>
                  <small>不关联任何任务</small>
                </span>
                <i />
              </button>
              {tasks.slice(0, 4).map((task) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedTaskId === task.focusOptionId}
                  className={selectedTaskId === task.focusOptionId ? 'is-selected' : ''}
                  onClick={() => setSelectedTaskId(task.focusOptionId)}
                  key={task.focusOptionId}
                >
                  <span className="task-option__icon task-option__icon--task">✓</span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>{formatTaskDate(task)}</small>
                  </span>
                  <i />
                </button>
              ))}
            </div>
          </section>

          <section className="focus-panel focus-panel--timer">
            <div className="focus-panel__title">
              <span>02</span>
              <div>
                <h2>选择计时方式</h2>
                <p>最长 12 小时，到时会自动停止</p>
              </div>
            </div>

            <div className="mode-switch">
              <button
                type="button"
                className={mode === 'up' ? 'is-active' : ''}
                onClick={() => setMode('up')}
              >
                <span>↗</span>
                <strong>正计时</strong>
                <small>开放节奏</small>
              </button>
              <button
                type="button"
                className={mode === 'down' ? 'is-active' : ''}
                onClick={() => setMode('down')}
              >
                <span>↓</span>
                <strong>倒计时</strong>
                <small>明确边界</small>
              </button>
            </div>

            {mode === 'down' && (
              <div className="duration-control">
                <div className="duration-control__top">
                  <span>专注时长</span>
                  <strong>
                    {Math.floor(durationMinutes / 60) > 0 &&
                      `${Math.floor(durationMinutes / 60)} 小时 `}
                    {durationMinutes % 60 > 0 && `${durationMinutes % 60} 分钟`}
                  </strong>
                </div>
                <div className="duration-stepper">
                  <button type="button" onClick={() => changeDuration(-5)} aria-label="减少五分钟">
                    −
                  </button>
                  <div>
                    <span>{pad(Math.floor(durationMinutes / 60))}</span>
                    <i>:</i>
                    <span>{pad(durationMinutes % 60)}</span>
                  </div>
                  <button type="button" onClick={() => changeDuration(5)} aria-label="增加五分钟">
                    ＋
                  </button>
                </div>
                <div className="duration-presets">
                  {[25, 50, 90, 120].map((minutes) => (
                    <button
                      type="button"
                      className={durationMinutes === minutes ? 'is-active' : ''}
                      onClick={() => setDurationMinutes(minutes)}
                      key={minutes}
                    >
                      {minutes} 分钟
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="focus-panel focus-panel--care">
            <div className="focus-panel__title">
              <span>03</span>
              <div>
                <h2>专注也需要留白</h2>
                <p>到点后温柔提醒，不会突然打断</p>
              </div>
            </div>

            <div className="care-settings">
              <label>
                <span>
                  <strong>休息提醒</strong>
                  <small>持续专注多久后提醒</small>
                </span>
                <select
                  value={reminderMinutes}
                  onChange={(event) => setReminderMinutes(Number(event.target.value))}
                >
                  <option value="60">60 分钟后</option>
                  <option value="90">90 分钟后</option>
                  <option value="120">120 分钟后</option>
                  <option value="0">不提醒</option>
                </select>
              </label>
              <label>
                <span>
                  <strong>建议休息</strong>
                  <small>提醒时提供的休息时长</small>
                </span>
                <select
                  value={breakMinutes}
                  onChange={(event) => setBreakMinutes(Number(event.target.value))}
                  disabled={!reminderMinutes}
                >
                  <option value="5">5 分钟</option>
                  <option value="10">10 分钟</option>
                  <option value="15">15 分钟</option>
                  <option value="20">20 分钟</option>
                </select>
              </label>
            </div>

            <div className="focus-care-note">
              <span>✦</span>
              <p>
                {reminderMinutes
                  ? `持续专注 ${reminderMinutes} 分钟后，我会询问你是否休息。`
                  : '本次不主动提醒休息，你仍可随时暂停。'}
              </p>
            </div>
          </section>
        </div>

        <footer className="focus-launch">
          <div>
            <span className="focus-launch__dot" />
            <p>
              {selectedTask ? selectedTask.title : '自由专注'}
              <small>
                {mode === 'up'
                  ? '从 00:00 开始记录'
                  : `倒计时 ${durationMinutes} 分钟`}
              </small>
            </p>
          </div>
          <button type="button" onClick={startFocus}>
            开始专注
            <span>→</span>
          </button>
        </footer>
      </div>
    </main>
  )
}

export default FocusPage
