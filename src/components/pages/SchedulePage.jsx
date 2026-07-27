import { useEffect, useMemo, useRef, useState } from 'react'
import Calendar from '../calendar/Calendar'
import {
  WEEKDAY_OPTIONS,
  dateFromKey,
  isTaskCompletedOnDate,
  normalizeRecurrence,
  recurrenceLabel,
  taskBaseDateKey,
  taskOccurrenceId,
  taskOccursOnDate,
  weekdayNumber,
} from '../../utils/taskRecurrence'
import './SchedulePage.css'

const TASKS_STORAGE_KEY = 'manoong-schedule-tasks'
const DAILY_STATS_KEY = 'manoong-daily-stats'
const TIME_WHEEL_ROW_HEIGHT = 40

const PRIORITY_OPTIONS = [
  {
    value: 'important-urgent',
    label: '重要 · 紧急',
    shortLabel: '重要紧急',
    hint: '优先立即处理',
  },
  {
    value: 'important-not-urgent',
    label: '重要 · 不紧急',
    shortLabel: '重要不紧急',
    hint: '规划时间推进',
  },
  {
    value: 'not-important-urgent',
    label: '不重要 · 紧急',
    shortLabel: '紧急不重要',
    hint: '尽快处理或委托',
  },
  {
    value: 'not-important-not-urgent',
    label: '不重要 · 不紧急',
    shortLabel: '不重要不紧急',
    hint: '有余力时再做',
  },
]

const RECURRENCE_OPTIONS = [
  {
    value: 'none',
    icon: '—',
    label: '不重复',
    hint: '仅安排这一次',
  },
  {
    value: 'daily',
    icon: '日',
    label: '每天',
    hint: '每天同一时间',
  },
  {
    value: 'weekly',
    icon: '周',
    label: '每周',
    hint: '每周同一天',
  },
  {
    value: 'custom',
    icon: '选',
    label: '自定义',
    hint: '选择特定工作日',
  },
]

const padNumber = (number) => String(number).padStart(2, '0')

function dateKey(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDateTitle(date) {
  const today = new Date()
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const prefix =
    dateKey(date) === dateKey(today)
      ? '今天'
      : dateKey(date) === dateKey(tomorrow)
        ? '明天'
        : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]

  return `${prefix}，${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

function formatMinutes(seconds = 0) {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} 小时 ${remainder} 分` : `${hours} 小时`
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function normalizeTask(task, index) {
  const start = new Date(task.start)
  const validStart = !Number.isNaN(start.getTime())
  const baseDateKey = task.date || (validStart ? dateKey(start) : null)
  const createdAt =
    task.createdAt ||
    (validStart ? task.start : new Date(Date.now() + index).toISOString())
  const recurrence = normalizeRecurrence(task.recurrence, baseDateKey)
  const completedOccurrences =
    task.completedOccurrences &&
    typeof task.completedOccurrences === 'object' &&
    !Array.isArray(task.completedOccurrences)
      ? { ...task.completedOccurrences }
      : {}

  if (
    recurrence &&
    task.completed &&
    baseDateKey &&
    !completedOccurrences[baseDateKey]
  ) {
    completedOccurrences[baseDateKey] =
      task.completedAt || new Date().toISOString()
  }

  return {
    ...task,
    // Older tasks may span several dates, so keep them range-based.
    date: task.date || null,
    hasTime: task.hasTime !== false,
    createdAt,
    completed: recurrence ? false : Boolean(task.completed),
    completedAt: recurrence ? null : task.completedAt || null,
    completedOccurrences,
    recurrence,
    priority: PRIORITY_OPTIONS.some(
      (option) => option.value === task.priority,
    )
      ? task.priority
      : null,
  }
}

function readStoredTasks() {
  const tasks = readJson(TASKS_STORAGE_KEY, [])
  return Array.isArray(tasks)
    ? tasks.map((task, index) => normalizeTask(task, index))
    : []
}

function taskStartValue(task) {
  const value = new Date(task.start).getTime()
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value
}

function taskTimeLabel(task) {
  const start = new Date(task.start)
  const end = new Date(task.end)
  return `${padNumber(start.getHours())}:${padNumber(start.getMinutes())} — ${padNumber(end.getHours())}:${padNumber(end.getMinutes())}`
}

function timeInputValue(value, fallback) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
}

function priorityDetails(priority) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority)
}

function PriorityBadge({ priority }) {
  const details = priorityDetails(priority)
  if (!details) return null

  return (
    <span className="task-priority-badge" data-priority={priority}>
      <i aria-hidden="true" />
      {details.shortLabel}
    </span>
  )
}

function RepeatBadge({ task }) {
  const label = recurrenceLabel(task)
  if (!label) return null

  return (
    <span className="task-repeat-badge" title={`重复规则：${label}`}>
      <i aria-hidden="true">↻</i>
      <span>{label}</span>
    </span>
  )
}

function TimeWheelColumn({ label, value, max, onChange }) {
  const options = useMemo(
    () => Array.from({ length: max }, (_, index) => index),
    [max],
  )
  const scrollRef = useRef(null)
  const scrollTimerRef = useRef(null)
  const keyboardRef = useRef({ key: null, repeats: 0 })
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startY: 0,
    startScrollTop: 0,
    moved: false,
  })

  useEffect(() => {
    if (!scrollRef.current) return
    const expectedTop = value * TIME_WHEEL_ROW_HEIGHT
    if (Math.abs(scrollRef.current.scrollTop - expectedTop) > 1) {
      scrollRef.current.scrollTo({ top: expectedTop, behavior: 'smooth' })
    }
  }, [value])

  useEffect(
    () => () => {
      window.clearTimeout(scrollTimerRef.current)
    },
    [],
  )

  function selectClosest(element) {
    const index = Math.max(
      0,
      Math.min(max - 1, Math.round(element.scrollTop / TIME_WHEEL_ROW_HEIGHT)),
    )
    element.scrollTo({
      top: index * TIME_WHEEL_ROW_HEIGHT,
      behavior: 'smooth',
    })
    if (index !== value) onChange(index)
  }

  function handleScroll(event) {
    if (dragRef.current.active) return
    window.clearTimeout(scrollTimerRef.current)
    const element = event.currentTarget
    scrollTimerRef.current = window.setTimeout(() => {
      selectClosest(element)
    }, 70)
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    window.clearTimeout(scrollTimerRef.current)
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: event.currentTarget.scrollTop,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return
    const distance = event.clientY - drag.startY
    if (Math.abs(distance) > 2) drag.moved = true
    event.currentTarget.scrollTop = drag.startScrollTop - distance
    event.preventDefault()
  }

  function finishPointerDrag(event) {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return
    drag.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    selectClosest(event.currentTarget)
  }

  function handleKeyDown(event) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()

    const keyboard = keyboardRef.current
    if (keyboard.key !== event.key) {
      keyboard.key = event.key
      keyboard.repeats = 0
    } else if (event.repeat) {
      keyboard.repeats += 1
    }

    const fastStep =
      keyboard.repeats > 24
        ? max === 60
          ? 10
          : 3
        : keyboard.repeats > 9
          ? max === 60
            ? 5
            : 2
          : 1
    const direction = event.key === 'ArrowDown' ? 1 : -1
    onChange(Math.max(0, Math.min(max - 1, value + direction * fastStep)))
  }

  function resetKeyboardAcceleration() {
    keyboardRef.current = { key: null, repeats: 0 }
  }

  return (
    <div className="time-wheel-column">
      <span className="time-wheel-column__label">{label}</span>
      <div className="time-wheel-column__frame">
        <span className="time-wheel-column__selection" aria-hidden="true" />
        <div
          ref={scrollRef}
          className="time-wheel-column__scroller"
          tabIndex="0"
          role="spinbutton"
          aria-label={`${label}，可滚动、拖动或使用上下方向键`}
          aria-valuemin="0"
          aria-valuemax={max - 1}
          aria-valuenow={value}
          aria-valuetext={padNumber(value)}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerDrag}
          onPointerCancel={finishPointerDrag}
          onKeyDown={handleKeyDown}
          onKeyUp={resetKeyboardAcceleration}
          onBlur={resetKeyboardAcceleration}
        >
          <div className="time-wheel-column__spacer" />
          {options.map((option) => (
            <button
              type="button"
              tabIndex="-1"
              key={option}
              className={option === value ? 'is-selected' : ''}
              onClick={(event) => {
                if (dragRef.current.moved) {
                  event.preventDefault()
                  dragRef.current.moved = false
                  return
                }
                onChange(option)
              }}
            >
              {padNumber(option)}
            </button>
          ))}
          <div className="time-wheel-column__spacer" />
        </div>
      </div>
    </div>
  )
}

function TimeWheel({ label, value, onChange }) {
  const [hours, minutes] = value.split(':').map(Number)

  return (
    <fieldset className="time-wheel">
      <legend>{label}</legend>
      <div className="time-wheel__columns">
        <TimeWheelColumn
          label="时"
          value={hours}
          max={24}
          onChange={(nextHours) =>
            onChange(`${padNumber(nextHours)}:${padNumber(minutes)}`)
          }
        />
        <span className="time-wheel__colon" aria-hidden="true">:</span>
        <TimeWheelColumn
          label="分"
          value={minutes}
          max={60}
          onChange={(nextMinutes) =>
            onChange(`${padNumber(hours)}:${padNumber(nextMinutes)}`)
          }
        />
      </div>
    </fieldset>
  )
}

function TaskModal({ selectedDate, task, onClose, onSaveTask }) {
  const isEditing = Boolean(task)
  const taskDate = task
    ? dateFromKey(taskBaseDateKey(task), selectedDate)
    : selectedDate
  const baseDateKey = dateKey(taskDate)
  const initialRecurrence = normalizeRecurrence(
    task?.recurrence,
    baseDateKey,
  )
  const defaultUntilDate = new Date(
    taskDate.getFullYear(),
    taskDate.getMonth() + 1,
    taskDate.getDate(),
  )
  const [title, setTitle] = useState(task?.title || '')
  const [hasTime, setHasTime] = useState(task?.hasTime ?? false)
  const [startTime, setStartTime] = useState(() =>
    timeInputValue(task?.start, '09:00'),
  )
  const [endTime, setEndTime] = useState(() =>
    timeInputValue(task?.end, '10:00'),
  )
  const [priority, setPriority] = useState(task?.priority || null)
  const [recurrenceType, setRecurrenceType] = useState(
    initialRecurrence?.type || 'none',
  )
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState(
    initialRecurrence?.weekdays?.length
      ? initialRecurrence.weekdays
      : [weekdayNumber(taskDate)],
  )
  const [recurrenceEnd, setRecurrenceEnd] = useState(
    initialRecurrence?.until ? 'until' : 'never',
  )
  const [recurrenceUntil, setRecurrenceUntil] = useState(
    initialRecurrence?.until || dateKey(defaultUntilDate),
  )
  const [error, setError] = useState('')
  const titleInputRef = useRef(null)

  useEffect(() => {
    titleInputRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function buildDate(time) {
    const [hours, minutes] = time.split(':').map(Number)
    return new Date(
      taskDate.getFullYear(),
      taskDate.getMonth(),
      taskDate.getDate(),
      hours,
      minutes,
      0,
      0,
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    const cleanTitle = title.trim()

    if (!cleanTitle) {
      setError('请写下要完成的事情')
      titleInputRef.current?.focus()
      return
    }

    const start = hasTime
      ? buildDate(startTime)
      : startOfDay(taskDate)
    const end = hasTime
      ? buildDate(endTime)
      : new Date(
          taskDate.getFullYear(),
          taskDate.getMonth(),
          taskDate.getDate(),
          23,
          59,
          59,
        )

    if (hasTime && end <= start) {
      setError('结束时间需要晚于开始时间')
      return
    }

    const now = new Date().toISOString()
    const recurrence =
      recurrenceType === 'none'
        ? null
        : normalizeRecurrence(
            {
              type: recurrenceType,
              weekdays: recurrenceWeekdays,
              until: recurrenceEnd === 'until' ? recurrenceUntil : null,
            },
            baseDateKey,
          )

    if (
      recurrenceType !== 'none' &&
      recurrenceEnd === 'until' &&
      (!recurrenceUntil || recurrenceUntil < baseDateKey)
    ) {
      setError('重复截止日期不能早于任务开始日期')
      return
    }

    if (
      recurrenceType === 'custom' &&
      recurrenceWeekdays.length === 0
    ) {
      setError('请至少选择一个重复工作日')
      return
    }

    let completed = Boolean(task?.completed)
    let completedAt = task?.completedAt || null
    let completedOccurrences = { ...(task?.completedOccurrences || {}) }

    if (recurrence) {
      if (!initialRecurrence && completed) {
        completedOccurrences[baseDateKey] = completedAt || now
      }
      completed = false
      completedAt = null
    } else if (initialRecurrence) {
      completedAt = completedOccurrences[baseDateKey] || null
      completed = Boolean(completedAt)
      completedOccurrences = {}
    }

    onSaveTask({
      ...task,
      id: task?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: cleanTitle,
      date: baseDateKey,
      hasTime,
      start: start.toISOString(),
      end: end.toISOString(),
      priority,
      recurrence,
      createdAt: task?.createdAt || now,
      completed,
      completedAt,
      completedOccurrences,
    })
  }

  return (
    <div
      className="schedule-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        className="schedule-modal"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <header className="schedule-modal__header">
          <div>
            <p>
              {isEditing ? 'EDIT TASK' : 'NEW TASK'} · {taskDate.getMonth() + 1}/{taskDate.getDate()}
            </p>
            <h2 id="task-modal-title">
              {isEditing ? '修改任务安排' : '安排一件想完成的事'}
            </h2>
            {isEditing && initialRecurrence && (
              <small className="schedule-modal__series-note">
                修改会应用到整组重复任务
              </small>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>

        <label className="schedule-field">
          <span>任务名称</span>
          <input
            ref={titleInputRef}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setError('')
            }}
            maxLength={80}
            placeholder="例如：整理项目提案"
          />
        </label>

        <div className="time-choice">
          <button
            type="button"
            className={!hasTime ? 'is-active' : ''}
            onClick={() => {
              setHasTime(false)
              setError('')
            }}
          >
            <span>○</span>
            <strong>灵活安排</strong>
            <small>不设置具体几点</small>
          </button>
          <button
            type="button"
            className={hasTime ? 'is-active' : ''}
            onClick={() => setHasTime(true)}
          >
            <span>◷</span>
            <strong>指定时间</strong>
            <small>加入当天时间线</small>
          </button>
        </div>

        {hasTime && (
          <div className="schedule-time-wheels">
            <div className="schedule-time-wheels__head">
              <strong>具体时间</strong>
              <span>滚动或拖动 · 聚焦后可用 ↑ ↓</span>
            </div>
            <div className="schedule-time-wheels__body">
              <TimeWheel
                label="开始"
                value={startTime}
                onChange={(nextTime) => {
                  setStartTime(nextTime)
                  setError('')
                }}
              />
              <span className="schedule-time-wheels__arrow" aria-hidden="true">→</span>
              <TimeWheel
                label="结束"
                value={endTime}
                onChange={(nextTime) => {
                  setEndTime(nextTime)
                  setError('')
                }}
              />
            </div>
          </div>
        )}

        <fieldset className="recurrence-picker">
          <legend>
            重复安排 <span>选填</span>
          </legend>
          <div className="recurrence-picker__modes">
            {RECURRENCE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={recurrenceType === option.value ? 'is-active' : ''}
                aria-pressed={recurrenceType === option.value}
                onClick={() => {
                  setRecurrenceType(option.value)
                  setError('')
                }}
              >
                <i aria-hidden="true">{option.icon}</i>
                <span>
                  <strong>
                    {option.value === 'weekly'
                      ? `每${WEEKDAY_OPTIONS.find(
                          (day) => day.value === weekdayNumber(taskDate),
                        )?.fullLabel}`
                      : option.label}
                  </strong>
                  <small>{option.hint}</small>
                </span>
              </button>
            ))}
          </div>

          {recurrenceType !== 'none' && (
            <div className="recurrence-settings">
              {recurrenceType === 'custom' && (
                <div className="weekday-picker">
                  <div>
                    <strong>选择重复日</strong>
                    <small>至少保留一天</small>
                  </div>
                  <div role="group" aria-label="选择重复工作日">
                    {WEEKDAY_OPTIONS.map((weekday) => {
                      const isSelected = recurrenceWeekdays.includes(
                        weekday.value,
                      )
                      return (
                        <button
                          type="button"
                          key={weekday.value}
                          className={isSelected ? 'is-active' : ''}
                          aria-pressed={isSelected}
                          aria-label={weekday.fullLabel}
                          onClick={() => {
                            setRecurrenceWeekdays((currentWeekdays) => {
                              if (
                                currentWeekdays.includes(weekday.value)
                              ) {
                                return currentWeekdays.length === 1
                                  ? currentWeekdays
                                  : currentWeekdays.filter(
                                      (day) => day !== weekday.value,
                                    )
                              }
                              return [...currentWeekdays, weekday.value].sort(
                                (dayA, dayB) => dayA - dayB,
                              )
                            })
                            setError('')
                          }}
                        >
                          {weekday.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="recurrence-end">
                <div>
                  <strong>何时结束</strong>
                  <small>可持续重复，也可设定截止日期</small>
                </div>
                <div className="recurrence-end__controls">
                  <button
                    type="button"
                    className={recurrenceEnd === 'never' ? 'is-active' : ''}
                    onClick={() => setRecurrenceEnd('never')}
                  >
                    持续重复
                  </button>
                  <button
                    type="button"
                    className={recurrenceEnd === 'until' ? 'is-active' : ''}
                    onClick={() => setRecurrenceEnd('until')}
                  >
                    截止日期
                  </button>
                  {recurrenceEnd === 'until' && (
                    <input
                      type="date"
                      min={baseDateKey}
                      value={recurrenceUntil}
                      aria-label="重复截止日期"
                      onChange={(event) => {
                        setRecurrenceUntil(event.target.value)
                        setError('')
                      }}
                    />
                  )}
                </div>
              </div>
              <p className="recurrence-settings__summary">
                <span aria-hidden="true">↻</span>
                {recurrenceLabel({
                  date: baseDateKey,
                  start: startTime,
                  recurrence: {
                    type: recurrenceType,
                    weekdays: recurrenceWeekdays,
                    until:
                      recurrenceEnd === 'until' ? recurrenceUntil : null,
                  },
                })}
                {hasTime ? `，固定在 ${startTime} 开始` : '，当天灵活安排'}
              </p>
            </div>
          )}
        </fieldset>

        <fieldset className="priority-picker">
          <legend>
            重要与紧急程度 <span>选填</span>
          </legend>
          <p>选择一个象限，再次点击可取消选择。</p>
          <div className="priority-picker__grid">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                data-priority={option.value}
                className={priority === option.value ? 'is-active' : ''}
                aria-pressed={priority === option.value}
                onClick={() =>
                  setPriority((currentPriority) =>
                    currentPriority === option.value ? null : option.value,
                  )
                }
              >
                <i aria-hidden="true" />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </span>
                <b aria-hidden="true">
                  {priority === option.value ? '✓' : ''}
                </b>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="schedule-modal__error" aria-live="polite">
          {error && <p>{error}</p>}
        </div>

        <footer className="schedule-modal__footer">
          <button type="button" onClick={onClose}>取消</button>
          <button type="submit">
            {isEditing ? '保存修改' : '添加到日程'} <span>→</span>
          </button>
        </footer>
      </form>
    </div>
  )
}

function DeleteTaskModal({ task, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    cancelButtonRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="schedule-modal-backdrop">
      <section className="schedule-delete" role="alertdialog" aria-modal="true">
        <span className="schedule-delete__icon">×</span>
        <h2>{task.recurrence ? '删除整组重复任务？' : '删除这项任务？'}</h2>
        <p>
          “{task.title}”
          {task.recurrence
            ? '的所有重复安排与完成记录都会被删除。'
            : '删除后将无法恢复。'}
        </p>
        <div>
          <button ref={cancelButtonRef} type="button" onClick={onCancel}>保留任务</button>
          <button type="button" onClick={onConfirm}>确认删除</button>
        </div>
      </section>
    </div>
  )
}

function TaskCheck({ task, completed, onToggle }) {
  return (
    <button
      type="button"
      className={`task-check ${completed ? 'is-complete' : ''}`}
      aria-label={`${completed ? '恢复' : '完成'}任务：${task.title}`}
      onClick={() => onToggle(task)}
    >
      {completed ? '✓' : ''}
    </button>
  )
}

function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState(readStoredTasks)
  const [dailyStats, setDailyStats] = useState(() =>
    readJson(DAILY_STATS_KEY, {}),
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const selectedTasks = useMemo(
    () => tasks.filter((task) => taskOccursOnDate(task, selectedDate)),
    [selectedDate, tasks],
  )

  const flexibleTasks = useMemo(
    () =>
      selectedTasks
        .filter((task) => !task.hasTime)
        .sort(
          (taskA, taskB) =>
            new Date(taskA.createdAt).getTime() -
            new Date(taskB.createdAt).getTime(),
        ),
    [selectedTasks],
  )

  const timedTasks = useMemo(
    () =>
      selectedTasks
        .filter((task) => task.hasTime)
        .sort(
          (taskA, taskB) =>
            taskStartValue(taskA) - taskStartValue(taskB) ||
            new Date(taskA.createdAt).getTime() -
              new Date(taskB.createdAt).getTime(),
        ),
    [selectedTasks],
  )

  const completedCount = selectedTasks.filter((task) =>
    isTaskCompletedOnDate(task, selectedDate),
  ).length
  const selectedStats = dailyStats[dateKey(selectedDate)] || {}
  const completionPercent = selectedTasks.length
    ? Math.round((completedCount / selectedTasks.length) * 100)
    : 0

  function hasTasksForDate(date) {
    return tasks.some((task) => taskOccursOnDate(task, date))
  }

  function addTask(task) {
    setTasks((currentTasks) => [...currentTasks, task])
    setIsModalOpen(false)
  }

  function updateTask(updatedTask) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      ),
    )
    setTaskToEdit(null)
  }

  function toggleTask(task) {
    const recurrence = normalizeRecurrence(
      task.recurrence,
      taskBaseDateKey(task),
    )
    const nextCompleted = !isTaskCompletedOnDate(task, selectedDate)
    const completedAt = nextCompleted ? new Date().toISOString() : null
    const occurrenceKey = dateKey(selectedDate)
    const previousCompletedAt = recurrence
      ? task.completedOccurrences?.[occurrenceKey]
      : task.completedAt
    const statsId = taskOccurrenceId(task, selectedDate)

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) => {
        if (currentTask.id !== task.id) return currentTask
        if (!recurrence) {
          return { ...currentTask, completed: nextCompleted, completedAt }
        }

        const completedOccurrences = {
          ...(currentTask.completedOccurrences || {}),
        }
        if (nextCompleted) completedOccurrences[occurrenceKey] = completedAt
        else delete completedOccurrences[occurrenceKey]

        return { ...currentTask, completedOccurrences }
      }),
    )

    setDailyStats((currentStats) => {
      const stats = { ...currentStats }
      const completionDate = nextCompleted
        ? new Date()
        : new Date(previousCompletedAt || Date.now())
      const key = dateKey(completionDate)
      const day = { ...(stats[key] || {}) }
      const ids = new Set(day.completedTaskIds || [])
      const previousCount = Math.max(
        Number(day.completedCount) || 0,
        ids.size,
      )
      const alreadyRecorded = ids.has(statsId)

      if (nextCompleted) ids.add(statsId)
      else ids.delete(statsId)

      day.completedTaskIds = [...ids]
      day.completedCount = Math.max(
        0,
        previousCount +
          (nextCompleted && !alreadyRecorded
            ? 1
            : !nextCompleted && alreadyRecorded
              ? -1
              : 0),
      )
      stats[key] = day
      localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats))
      return stats
    })
  }

  function confirmDeleteTask() {
    if (!taskToDelete) return
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskToDelete.id),
    )

    setDailyStats((currentStats) => {
      const stats = Object.fromEntries(
        Object.entries(currentStats).map(([key, currentDay]) => {
          if (!Array.isArray(currentDay.completedTaskIds)) {
            return [key, currentDay]
          }

          const day = { ...currentDay }
          const previousIds = day.completedTaskIds
          day.completedTaskIds = previousIds.filter(
            (id) =>
              id !== taskToDelete.id &&
              !id.startsWith(`${taskToDelete.id}::`),
          )
          const removedCount = previousIds.length - day.completedTaskIds.length
          day.completedCount = Math.max(
            0,
            (Number(day.completedCount) || previousIds.length) - removedCount,
          )
          return [key, day]
        }),
      )
      localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats))
      return stats
    })
    setTaskToDelete(null)
  }

  function renderFlexibleTask(task, index) {
    const completed = isTaskCompletedOnDate(task, selectedDate)
    return (
      <article
        className={`flex-task ${completed ? 'is-complete' : ''}`}
        data-priority={task.priority || undefined}
        key={task.id}
      >
        <TaskCheck task={task} completed={completed} onToggle={toggleTask} />
        <span className="flex-task__order">{padNumber(index + 1)}</span>
        <div className="task-copy">
          <h4>{task.title}</h4>
          <div className="task-meta">
            <p>{completed ? '本次已完成' : '按创建顺序排列'}</p>
            <RepeatBadge task={task} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
        <div className="task-actions">
          <button
            type="button"
            className="task-edit"
            onClick={() => setTaskToEdit(task)}
            aria-label={`编辑任务：${task.title}`}
          >
            ✎
          </button>
          <button
            type="button"
            className="task-delete"
            onClick={() => setTaskToDelete(task)}
            aria-label={`删除任务：${task.title}`}
          >
            ×
          </button>
        </div>
      </article>
    )
  }

  function renderTimedTask(task) {
    const completed = isTaskCompletedOnDate(task, selectedDate)
    return (
      <article
        className={`timeline-task ${completed ? 'is-complete' : ''}`}
        data-priority={task.priority || undefined}
        key={task.id}
      >
        <time>{taskTimeLabel(task).split(' — ')[0]}</time>
        <span className="timeline-task__node" />
        <div className="timeline-task__card">
          <TaskCheck task={task} completed={completed} onToggle={toggleTask} />
          <div className="task-copy">
            <h4>{task.title}</h4>
            <div className="task-meta">
              <p>{taskTimeLabel(task)}</p>
              <RepeatBadge task={task} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
          <div className="task-actions">
            <button
              type="button"
              className="task-edit"
              onClick={() => setTaskToEdit(task)}
              aria-label={`编辑任务：${task.title}`}
            >
              ✎
            </button>
            <button
              type="button"
              className="task-delete"
              onClick={() => setTaskToDelete(task)}
              aria-label={`删除任务：${task.title}`}
            >
              ×
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <main className="schedule-page">
      <div className="schedule-shell">
        <header className="schedule-heading">
          <div>
            <p><span /> SCHEDULE</p>
            <h1>让每一天，<em>清晰发生</em></h1>
            <small>先放下要做的事，再决定它何时发生。</small>
          </div>
          <div className="schedule-heading__actions">
            <button type="button" onClick={() => setSelectedDate(new Date())}>
              回到今天
            </button>
            <button type="button" onClick={() => setIsModalOpen(true)}>
              <span>＋</span> 新建任务
            </button>
          </div>
        </header>

        <section className="schedule-overview">
          <div>
            <span>完成进度</span>
            <strong>{completedCount}<small> / {selectedTasks.length}</small></strong>
            <div className="schedule-progress">
              <i style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
          <div>
            <span>当日专注</span>
            <strong>{formatMinutes(selectedStats.focusSeconds || 0)}</strong>
            <small>专注完成后自动累计</small>
          </div>
          <p>
            {selectedTasks.length === 0
              ? '留白不是浪费，也是一种安排。'
              : completionPercent === 100
                ? '今天的任务全部完成，辛苦了。'
                : `还有 ${selectedTasks.length - completedCount} 件事，慢慢来。`}
          </p>
        </section>

        <div className="schedule-workspace">
          <section className="calendar-panel">
            <div className="calendar-panel__head">
              <div>
                <p>日期导航</p>
                <h2>选择一天</h2>
              </div>
              <span>圆点表示有任务</span>
            </div>
            <Calendar
              key={`${selectedDate.getFullYear()}-${selectedDate.getMonth()}`}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              hasTasksForDate={hasTasksForDate}
            />
          </section>

          <section className="agenda-panel">
            <header className="agenda-panel__head">
              <div>
                <p>DAILY PLAN</p>
                <h2>{formatDateTitle(selectedDate)}</h2>
              </div>
              <span>{selectedTasks.length} 项</span>
            </header>

            {selectedTasks.length === 0 ? (
              <div className="agenda-empty">
                <span>✦</span>
                <h3>这一天还没有安排</h3>
                <p>先添加一件想完成的小事，时间可以稍后再定。</p>
                <button type="button" onClick={() => setIsModalOpen(true)}>
                  添加第一项任务
                </button>
              </div>
            ) : (
              <div className="agenda-content">
                {flexibleTasks.length > 0 && (
                  <section className="agenda-group">
                    <header>
                      <div>
                        <span className="agenda-group__icon">∞</span>
                        <h3>灵活安排</h3>
                      </div>
                      <small>未设置具体时间 · 先创建先展示</small>
                    </header>
                    <div className="flex-task-list">
                      {flexibleTasks.map(renderFlexibleTask)}
                    </div>
                  </section>
                )}

                {timedTasks.length > 0 && (
                  <section className="agenda-group agenda-group--timeline">
                    <header>
                      <div>
                        <span className="agenda-group__icon">◷</span>
                        <h3>时间线</h3>
                      </div>
                      <small>按开始时间排列</small>
                    </header>
                    <div className="timeline-task-list">
                      {timedTasks.map(renderTimedTask)}
                    </div>
                  </section>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      <button
        type="button"
        className="schedule-mobile-add"
        onClick={() => setIsModalOpen(true)}
        aria-label="新建任务"
      >
        ＋
      </button>

      {isModalOpen && (
        <TaskModal
          selectedDate={selectedDate}
          onClose={() => setIsModalOpen(false)}
          onSaveTask={addTask}
        />
      )}

      {taskToEdit && (
        <TaskModal
          selectedDate={selectedDate}
          task={taskToEdit}
          onClose={() => setTaskToEdit(null)}
          onSaveTask={updateTask}
        />
      )}

      {taskToDelete && (
        <DeleteTaskModal
          task={taskToDelete}
          onCancel={() => setTaskToDelete(null)}
          onConfirm={confirmDeleteTask}
        />
      )}
    </main>
  )
}

export default SchedulePage
