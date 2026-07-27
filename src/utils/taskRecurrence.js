const VALID_RECURRENCE_TYPES = new Set(['daily', 'weekly', 'custom'])

export const WEEKDAY_OPTIONS = [
  { value: 1, label: '一', fullLabel: '周一' },
  { value: 2, label: '二', fullLabel: '周二' },
  { value: 3, label: '三', fullLabel: '周三' },
  { value: 4, label: '四', fullLabel: '周四' },
  { value: 5, label: '五', fullLabel: '周五' },
  { value: 6, label: '六', fullLabel: '周六' },
  { value: 7, label: '日', fullLabel: '周日' },
]

const pad = (value) => String(value).padStart(2, '0')

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dateFromKey(key, fallback = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '')
  if (!match) return new Date(fallback)

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) || localDateKey(date) !== key
    ? new Date(fallback)
    : date
}

export function weekdayNumber(date) {
  return date.getDay() || 7
}

export function taskBaseDateKey(task) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(task?.date || '')) return task.date
  const start = new Date(task?.start)
  return Number.isNaN(start.getTime()) ? null : localDateKey(start)
}

export function normalizeRecurrence(recurrence, baseDateKey) {
  if (
    !recurrence ||
    !VALID_RECURRENCE_TYPES.has(recurrence.type) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(baseDateKey || '')
  ) {
    return null
  }

  const baseDate = dateFromKey(baseDateKey)
  const validWeekdays = Array.isArray(recurrence.weekdays)
    ? [...new Set(recurrence.weekdays.map(Number))]
        .filter((day) => day >= 1 && day <= 7)
        .sort((dayA, dayB) => dayA - dayB)
    : []

  let weekdays = []
  if (recurrence.type === 'weekly') weekdays = [weekdayNumber(baseDate)]
  if (recurrence.type === 'custom') {
    weekdays = validWeekdays.length
      ? validWeekdays
      : [weekdayNumber(baseDate)]
  }

  const until =
    /^\d{4}-\d{2}-\d{2}$/.test(recurrence.until || '') &&
    recurrence.until >= baseDateKey
      ? recurrence.until
      : null

  return {
    type: recurrence.type,
    weekdays,
    until,
  }
}

export function taskOccursOnDate(task, date) {
  const targetKey = localDateKey(date)
  const baseKey = taskBaseDateKey(task)
  const recurrence = normalizeRecurrence(task?.recurrence, baseKey)

  if (recurrence && baseKey) {
    if (targetKey < baseKey) return false
    if (recurrence.until && targetKey > recurrence.until) return false
    if (recurrence.type === 'daily') return true
    return recurrence.weekdays.includes(weekdayNumber(date))
  }

  if (task?.date) return task.date === targetKey

  const start = new Date(task?.start)
  const end = new Date(task?.end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false

  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime()
  const endDay = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime()
  return day >= startDay && day <= endDay
}

export function isTaskCompletedOnDate(task, date) {
  const recurrence = normalizeRecurrence(
    task?.recurrence,
    taskBaseDateKey(task),
  )
  if (!recurrence) return Boolean(task?.completed)
  return Boolean(task?.completedOccurrences?.[localDateKey(date)])
}

export function taskOccurrenceId(task, date) {
  const recurrence = normalizeRecurrence(
    task?.recurrence,
    taskBaseDateKey(task),
  )
  return recurrence
    ? `${task.id}::${localDateKey(date)}`
    : task.id
}

export function occurrenceDateTime(task, date, field = 'start') {
  const source = new Date(task?.[field])
  if (Number.isNaN(source.getTime())) return new Date(date)

  const occurrence = new Date(date)
  occurrence.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  )
  return occurrence
}

export function nextTaskOccurrence(task, fromDate = new Date(), maxDays = 370) {
  const recurrence = normalizeRecurrence(
    task?.recurrence,
    taskBaseDateKey(task),
  )

  if (!recurrence) {
    const start = new Date(task?.start)
    return Number.isNaN(start.getTime()) ? null : start
  }

  const requestedStart = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  )
  const baseDate = dateFromKey(taskBaseDateKey(task), requestedStart)
  const cursor = baseDate > requestedStart ? baseDate : requestedStart

  for (let offset = 0; offset <= maxDays; offset += 1) {
    const candidate = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + offset,
    )
    if (
      taskOccursOnDate(task, candidate) &&
      !isTaskCompletedOnDate(task, candidate)
    ) {
      return occurrenceDateTime(task, candidate)
    }
    if (
      recurrence.until &&
      localDateKey(candidate) > recurrence.until
    ) {
      return null
    }
  }

  return null
}

export function recurrenceLabel(task) {
  const recurrence = normalizeRecurrence(
    task?.recurrence,
    taskBaseDateKey(task),
  )
  if (!recurrence) return ''

  let frequency = '每天'
  if (recurrence.type === 'weekly') {
    frequency = `每${WEEKDAY_OPTIONS.find(
      (day) => day.value === recurrence.weekdays[0],
    )?.fullLabel || '周'}`
  }
  if (recurrence.type === 'custom') {
    frequency = recurrence.weekdays
      .map(
        (weekday) =>
          WEEKDAY_OPTIONS.find((day) => day.value === weekday)?.fullLabel,
      )
      .filter(Boolean)
      .join('、')
  }

  if (!recurrence.until) return frequency
  const [, month, day] = recurrence.until.split('-').map(Number)
  return `${frequency} · 至 ${month}/${day}`
}
