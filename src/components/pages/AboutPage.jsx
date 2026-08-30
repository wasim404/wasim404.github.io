import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  isTaskCompletedOnDate,
  taskOccursOnDate,
} from '../../utils/taskRecurrence'
import './AboutPage.css'
import { setAccountStorageItem } from '../../services/accountData'

const DAILY_STATS_KEY = 'manoong-daily-stats'
const TASKS_STORAGE_KEY = 'manoong-schedule-tasks'
const REFLECTIONS_STORAGE_KEY = 'manoong-daily-reflections'
const FOCUS_GOAL_STORAGE_KEY = 'manoong-focus-goal-minutes'
const MIN_FOCUS_GOAL_MINUTES = 30
const MAX_FOCUS_GOAL_MINUTES = 12 * 60
const DEFAULT_FOCUS_GOAL_MINUTES = 2 * 60

const pad = (value) => String(value).padStart(2, '0')

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '')
    return value ?? fallback
  } catch {
    return fallback
  }
}

function readFocusGoal() {
  try {
    const storedValue = localStorage.getItem(FOCUS_GOAL_STORAGE_KEY)
    if (storedValue === null) return DEFAULT_FOCUS_GOAL_MINUTES
    const storedGoal = Number(storedValue)
    if (!Number.isFinite(storedGoal)) return DEFAULT_FOCUS_GOAL_MINUTES
    return Math.min(
      MAX_FOCUS_GOAL_MINUTES,
      Math.max(MIN_FOCUS_GOAL_MINUTES, Math.round(storedGoal / 30) * 30),
    )
  } catch {
    return DEFAULT_FOCUS_GOAL_MINUTES
  }
}

function formatGoalDuration(minutes) {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} 小时 ${remainder} 分钟` : `${hours} 小时`
}

function taskCompletionsRecordedOn(task, key) {
  let count =
    task.completedAt && dateKey(new Date(task.completedAt)) === key ? 1 : 0

  if (
    task.completedOccurrences &&
    typeof task.completedOccurrences === 'object'
  ) {
    count += Object.values(task.completedOccurrences).filter(
      (completedAt) =>
        completedAt && dateKey(new Date(completedAt)) === key,
    ).length
  }

  return count
}

function formatFocusTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60

  if (hours === 0) return { primary: minutes, unit: '分钟', detail: '今天的专注积累' }
  return {
    primary: hours,
    unit: '小时',
    detail: remainder ? `另有 ${remainder} 分钟` : '完整的专注时间',
  }
}

function formatMonthlyFocus(totalSeconds) {
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) {
    return {
      value: totalMinutes,
      unit: '分钟',
      detail: totalMinutes ? '一点一点，累积成这个月' : '这个月还没有专注记录',
    }
  }

  const hours = Math.floor(totalMinutes / 60)
  const remainder = totalMinutes % 60
  return {
    value: hours,
    unit: '小时',
    detail: remainder ? `另有 ${remainder} 分钟` : `累计 ${totalMinutes} 分钟`,
  }
}

const SCORE_GUIDE = {
  1: { label: '很艰难', note: '今天已经很不容易了，你不必马上让一切变好。' },
  2: { label: '有些低落', note: '允许自己慢一点，撑过今天本身就值得肯定。' },
  3: { label: '不太顺利', note: '不顺利的一天，不等于不够好的你。' },
  4: { label: '平平常常', note: '普通的一天也在构成真实而稳定的生活。' },
  5: { label: '还算可以', note: '没有大起大落，也是一种难得的平衡。' },
  6: { label: '比较平稳', note: '你稳稳地走过了今天，可以慢慢收尾了。' },
  7: { label: '整体顺利', note: '今天有不少时刻，都值得被轻轻记住。' },
  8: { label: '充实满足', note: '你和今天配合得很好，为自己留一点认可。' },
  9: { label: '闪闪发光', note: '这是值得收藏的一天，让喜悦多停留一会儿。' },
  10: { label: '非常美好', note: '今天真的很棒，请好好记住此刻的感受。' },
}

function tierForScore(score) {
  if (score >= 9) return 'bright'
  if (score >= 4) return 'calm'
  return 'comfort'
}

function ScoreFeedback({ score }) {
  const tier = tierForScore(score)
  const content = {
    bright: {
      eyebrow: 'A BEAUTIFUL DAY',
      title: '今天，值得好好庆祝',
    },
    calm: {
      eyebrow: 'A GENTLE DAY',
      title: '平静地走过一天，也很好',
    },
    comfort: {
      eyebrow: 'BE KIND TO YOURSELF',
      title: '先抱抱今天的自己',
    },
  }[tier]

  return (
    <section className={`review-feedback review-feedback--${tier}`} aria-live="polite">
      <div className="review-feedback__animation" aria-hidden="true">
        {tier === 'bright' &&
          Array.from({ length: 12 }, (_, index) => (
            <i key={index} style={{ '--i': index }} />
          ))}
        {tier === 'calm' && (
          <>
            <i />
            <i />
            <i />
          </>
        )}
        {tier === 'comfort' && (
          <>
            <i>♥</i>
            <i />
          </>
        )}
      </div>
      <p>{content.eyebrow}</p>
      <strong>{score}<small>/10</small></strong>
      <h3>{content.title}</h3>
      <span>{SCORE_GUIDE[score].note}</span>
      <small className="review-feedback__loading">正在打开你的今日记录…</small>
    </section>
  )
}

const REVIEW_COLORS = [
  '',
  '#edb8c1',
  '#efc7ce',
  '#efd5dc',
  '#dce7f5',
  '#d4e2f3',
  '#ccdcf1',
  '#c3d5ed',
  '#b8cce9',
  '#f4dfa2',
  '#f0cf75',
]

function MonthReview({ reflections, dailyStats, tasks, today }) {
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const todayKey = dateKey(today)
  const [selectedKey, setSelectedKey] = useState(
    reflections[todayKey] ? todayKey : null,
  )
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const monthPrefix = `${year}-${pad(month + 1)}-`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const emptyDays = (new Date(year, month, 1).getDay() + 6) % 7
  const monthEntries = Object.entries(reflections).filter(
    ([key, reflection]) =>
      key.startsWith(monthPrefix) &&
      Number(reflection?.score) >= 1 &&
      Number(reflection?.score) <= 10,
  )
  const average = monthEntries.length
    ? monthEntries.reduce(
        (total, [, reflection]) => total + Number(reflection.score),
        0,
      ) / monthEntries.length
    : null
  const roundedAverage = average ? Math.round(average) : null
  const selectedReflection = selectedKey ? reflections[selectedKey] : null
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const key = `${monthPrefix}${pad(day)}`
    const dayStats = dailyStats[key] || {}
    const completedFromTasks = Array.isArray(tasks)
      ? tasks.reduce(
          (total, task) => total + taskCompletionsRecordedOn(task, key),
          0,
        )
      : 0

    return {
      day,
      key,
      focusSeconds: Number(dayStats.focusSeconds) || 0,
      completedCount: Math.max(
        Number(dayStats.completedCount) || 0,
        completedFromTasks,
      ),
    }
  })
  const monthlyFocusSeconds = monthDays.reduce(
    (total, day) => total + day.focusSeconds,
    0,
  )
  const monthlyCompletedCount = monthDays.reduce(
    (total, day) => total + day.completedCount,
    0,
  )
  const focusActiveDays = monthDays.filter((day) => day.focusSeconds > 0).length
  const taskActiveDays = monthDays.filter((day) => day.completedCount > 0).length
  const maximumDailyFocus = Math.max(
    1,
    ...monthDays.map((day) => day.focusSeconds),
  )
  const maximumDailyTasks = Math.max(
    1,
    ...monthDays.map((day) => day.completedCount),
  )
  const monthlyFocus = formatMonthlyFocus(monthlyFocusSeconds)

  function changeMonth(delta) {
    setCurrentMonth(new Date(year, month + delta, 1))
    setSelectedKey(null)
  }

  return (
    <section className="month-review">
      <header className="section-heading">
        <div>
          <p>MONTHLY VIEW</p>
          <h2>情绪天气</h2>
        </div>
        <span>仅统计完成复盘的日期</span>
      </header>

      <div className="month-review__card">
        <header className="month-review__header">
          <div className="month-review__navigation">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="上个月">‹</button>
            <div>
              <p>{year}</p>
              <h3>{month + 1} 月复盘</h3>
            </div>
            <button type="button" onClick={() => changeMonth(1)} aria-label="下个月">›</button>
          </div>

          <div className="month-average">
            <div
              className={`month-average__score ${average ? `is-${tierForScore(roundedAverage)}` : ''}`}
            >
              <strong>{average ? average.toFixed(1) : '—'}</strong>
              <small>/10</small>
            </div>
            <div>
              <p>当月平均分</p>
              <span>
                {average
                  ? `${monthEntries.length} 天记录 · ${SCORE_GUIDE[roundedAverage].label}`
                  : '这个月还没有复盘'}
              </span>
            </div>
          </div>
        </header>

        <div className="month-review__metrics">
          <article className="month-total month-total--focus">
            <div className="month-total__icon">◷</div>
            <div className="month-total__copy">
              <p>当月累计专注</p>
              <strong>{monthlyFocus.value}<small>{monthlyFocus.unit}</small></strong>
              <span>{monthlyFocus.detail} · {focusActiveDays} 天有专注</span>
            </div>
            <div
              className="month-spark"
              aria-label={`${month + 1}月每天专注时长分布`}
            >
              {monthDays.map((day) => (
                <i
                  className={day.focusSeconds > 0 ? 'is-active' : ''}
                  style={{
                    '--spark-height': `${Math.max(
                      day.focusSeconds > 0 ? 12 : 4,
                      (day.focusSeconds / maximumDailyFocus) * 100,
                    )}%`,
                  }}
                  title={`${month + 1}月${day.day}日：${Math.floor(day.focusSeconds / 60)}分钟`}
                  key={day.key}
                />
              ))}
            </div>
          </article>

          <article className="month-total month-total--tasks">
            <div className="month-total__icon">✓</div>
            <div className="month-total__copy">
              <p>当月完成任务</p>
              <strong>{monthlyCompletedCount}<small>项</small></strong>
              <span>
                {monthlyCompletedCount
                  ? `${taskActiveDays} 天留下完成记录`
                  : '这个月还没有完成记录'}
              </span>
            </div>
            <div
              className="month-spark"
              aria-label={`${month + 1}月每天完成任务数量分布`}
            >
              {monthDays.map((day) => (
                <i
                  className={day.completedCount > 0 ? 'is-active' : ''}
                  style={{
                    '--spark-height': `${Math.max(
                      day.completedCount > 0 ? 12 : 4,
                      (day.completedCount / maximumDailyTasks) * 100,
                    )}%`,
                  }}
                  title={`${month + 1}月${day.day}日：完成${day.completedCount}项`}
                  key={day.key}
                />
              ))}
            </div>
          </article>
        </div>

        <div className="month-review__body">
          <div className="review-calendar">
            <div className="review-calendar__weekdays">
              {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                <span key={day}>周{day}</span>
              ))}
            </div>
            <div className="review-calendar__days">
              {Array.from({ length: emptyDays }, (_, index) => (
                <span className="review-day review-day--empty" key={`empty-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1
                const key = `${monthPrefix}${pad(day)}`
                const reflection = reflections[key]
                const recordedScore = Number(reflection?.score) || 0
                const isToday = key === todayKey

                if (!reflection) {
                  return (
                    <span
                      className={`review-day ${isToday ? 'is-today' : ''}`}
                      key={key}
                    >
                      <small>{day}</small>
                    </span>
                  )
                }

                return (
                  <button
                    type="button"
                    className={`review-day has-review ${selectedKey === key ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
                    style={{ '--review-day-color': REVIEW_COLORS[recordedScore] }}
                    onClick={() =>
                      setSelectedKey((current) => (current === key ? null : key))
                    }
                    aria-label={`${month + 1}月${day}日，复盘评分${recordedScore}分`}
                    title={`${SCORE_GUIDE[recordedScore].label} · ${recordedScore}/10`}
                    key={key}
                  >
                    <small>{day}</small>
                    <strong>{recordedScore}</strong>
                    <i />
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="month-review__summary">
            <div className="month-review__legend">
              <p>颜色说明</p>
              <span><i />1–3 · 需要关怀</span>
              <span><i />4–8 · 平静日常</span>
              <span><i />9–10 · 美好明亮</span>
              <span><i />尚未记录</span>
            </div>

            {selectedReflection ? (
              <article className="review-day-detail">
                <p>SELECTED DAY</p>
                <div>
                  <strong>{selectedKey.slice(5, 7)}月{Number(selectedKey.slice(8))}日</strong>
                  <span>{selectedReflection.score}<small>/10</small></span>
                </div>
                <h4>{SCORE_GUIDE[selectedReflection.score].label}</h4>
                <blockquote>{selectedReflection.note}</blockquote>
              </article>
            ) : (
              <article className="review-day-detail review-day-detail--empty">
                <span>◌</span>
                <h4>点击有颜色的日期</h4>
                <p>可以重新看看那一天留下的感受与文字。</p>
              </article>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}

function AboutPage() {
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)
  const [stats] = useState(() => readJson(DAILY_STATS_KEY, {}))
  const [tasks] = useState(() => readJson(TASKS_STORAGE_KEY, []))
  const [reflections, setReflections] = useState(() =>
    readJson(REFLECTIONS_STORAGE_KEY, {}),
  )
  const existingReflection = reflections[todayKey]
  const [score, setScore] = useState(existingReflection?.score || null)
  const [note, setNote] = useState(existingReflection?.note || '')
  const [reviewStep, setReviewStep] = useState(
    existingReflection ? 'write' : 'score',
  )
  const [saveState, setSaveState] = useState(
    existingReflection ? 'saved' : 'idle',
  )
  const [focusGoalMinutes, setFocusGoalMinutes] = useState(readFocusGoal)

  const todayStats = stats[todayKey] || {}
  const todayTasks = Array.isArray(tasks)
    ? tasks.filter((task) => taskOccursOnDate(task, today))
    : []
  const completedFromTasks = todayTasks.filter((task) =>
    isTaskCompletedOnDate(task, today),
  ).length
  const completedCount = Math.max(
    Number(todayStats.completedCount) || 0,
    completedFromTasks,
  )
  const focusSeconds = Math.max(0, Number(todayStats.focusSeconds) || 0)
  const focusTime = formatFocusTime(focusSeconds)
  const focusGoalSeconds = focusGoalMinutes * 60
  const focusGoalPercent = Math.min(
    100,
    Math.round((focusSeconds / focusGoalSeconds) * 100),
  )
  const focusGoalRangePercent =
    ((focusGoalMinutes - MIN_FOCUS_GOAL_MINUTES) /
      (MAX_FOCUS_GOAL_MINUTES - MIN_FOCUS_GOAL_MINUTES)) *
    100
  const completionPercent = todayTasks.length
    ? Math.min(100, Math.round((completedFromTasks / todayTasks.length) * 100))
    : 0

  useEffect(() => {
    if (reviewStep !== 'feedback') return undefined
    const timer = window.setTimeout(() => setReviewStep('write'), 2400)
    return () => window.clearTimeout(timer)
  }, [reviewStep])

  useEffect(() => {
    try {
      setAccountStorageItem(
        FOCUS_GOAL_STORAGE_KEY,
        String(focusGoalMinutes),
      )
    } catch {
      // The control still works for this visit when browser storage is blocked.
    }
  }, [focusGoalMinutes])

  function changeFocusGoal(nextGoal) {
    setFocusGoalMinutes(
      Math.min(
        MAX_FOCUS_GOAL_MINUTES,
        Math.max(MIN_FOCUS_GOAL_MINUTES, Number(nextGoal) || 0),
      ),
    )
  }

  function chooseScore(nextScore) {
    setScore(nextScore)
    setSaveState('idle')
    setReviewStep('feedback')
  }

  function saveReflection() {
    const cleanNote = note.trim()
    if (!score || !cleanNote) return

    try {
      const current = readJson(REFLECTIONS_STORAGE_KEY, {})
      current[todayKey] = {
        score,
        note: cleanNote,
        tier: tierForScore(score),
        updatedAt: new Date().toISOString(),
      }
      setAccountStorageItem(REFLECTIONS_STORAGE_KEY, JSON.stringify(current))
      setReflections({ ...current })
      setNote(cleanNote)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  return (
    <main className="about-page">
      <div className="about-page__wash about-page__wash--one" />
      <div className="about-page__wash about-page__wash--two" />

      <div className="about-shell">
        <header className="statistics-hero">
          <div>
            <p>STATISTICS</p>
            <h1>数据统计</h1>
            <span>回顾你的专注、任务与每日状态。</span>
          </div>
          <Link to="/about">
            前往设置 <span aria-hidden="true">→</span>
          </Link>
        </header>

        <section className="today-insight">
          <div className="insight-grid">
            <article className="metric-card metric-card--focus">
              <div
                className="focus-progress-pie"
                style={{ '--focus-progress': `${focusGoalPercent}%` }}
                role="img"
                aria-label={`今日专注目标完成 ${focusGoalPercent}%`}
              >
                <span className="focus-progress-pie__label">
                  <strong>{focusGoalPercent}</strong>
                  <small>%</small>
                </span>
              </div>
              <div className="metric-card__content">
                <p>今日已专注</p>
                <strong>{focusTime.primary}<small>{focusTime.unit}</small></strong>
                <span>当前专注目标为{focusGoalMinutes}分钟</span>

                <div className="focus-goal-control">
                  <div className="focus-goal-control__head">
                    <span>今日目标</span>
                    <strong>{formatGoalDuration(focusGoalMinutes)}</strong>
                  </div>
                  <div className="focus-goal-control__adjust">
                    <button
                      type="button"
                      onClick={() => changeFocusGoal(focusGoalMinutes - 30)}
                      disabled={focusGoalMinutes === MIN_FOCUS_GOAL_MINUTES}
                      aria-label="目标减少30分钟"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min={MIN_FOCUS_GOAL_MINUTES}
                      max={MAX_FOCUS_GOAL_MINUTES}
                      step="30"
                      value={focusGoalMinutes}
                      style={{
                        '--goal-range-progress': `${focusGoalRangePercent}%`,
                      }}
                      aria-label="设置今日专注目标"
                      aria-valuetext={formatGoalDuration(focusGoalMinutes)}
                      onChange={(event) => changeFocusGoal(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => changeFocusGoal(focusGoalMinutes + 30)}
                      disabled={focusGoalMinutes === MAX_FOCUS_GOAL_MINUTES}
                      aria-label="目标增加30分钟"
                    >
                      ＋
                    </button>
                  </div>
                  <small>可设置 30 分钟至 12 小时，每次调整 30 分钟</small>
                </div>
              </div>
            </article>

            <article className="metric-card metric-card--tasks">
              <div
                className="task-progress-pie"
                style={{ '--task-progress': `${completionPercent}%` }}
                role="img"
                aria-label={`今日任务完成 ${completionPercent}%`}
              >
                <span aria-hidden="true">✓</span>
              </div>
              <div className="metric-card__content">
                <p>完成任务</p>
                <strong>{completedCount}<small>项</small></strong>
                <span>
                  {todayTasks.length
                    ? `今日计划完成 ${completionPercent}%`
                    : '今天还没有安排任务'}
                </span>
                {todayTasks.length > 0 && (
                  <div className="task-visual" aria-hidden="true">
                    {Array.from({ length: todayTasks.length }, (_, index) => (
                      <i className={index < completedFromTasks ? 'is-filled' : ''} key={index}>
                        {index < completedFromTasks ? '✓' : ''}
                      </i>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>
        </section>

        <section className="daily-review">
          <div className="review-card">
            {reviewStep === 'score' && (
              <div className="score-step">
                <div className="review-step-title review-step-title--score">
                  <span>01</span>
                  <div>
                    <h3>今天状态复盘</h3>
                  </div>
                </div>

                <div className="score-scale" role="radiogroup" aria-label="为今天评分">
                  {Array.from({ length: 10 }, (_, index) => {
                    const value = index + 1
                    return (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={score === value}
                        className={`score-scale__button score-scale__button--${tierForScore(value)}`}
                        onClick={() => chooseScore(value)}
                        key={value}
                      >
                        <strong>{value}</strong>
                        <span>{SCORE_GUIDE[value].label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="score-legend">
                  <span><i />需要被照顾</span>
                  <span><i />平静普通</span>
                  <span><i />美好明亮</span>
                </div>
              </div>
            )}

            {reviewStep === 'feedback' && <ScoreFeedback score={score} />}

            {reviewStep === 'write' && (
              <div className="write-step">
                <div className="review-step-title">
                  <span>02</span>
                  <div>
                    <h3>把今天写下来</h3>
                    <p>不需要完整，也不需要积极，只写下真实发生的。</p>
                  </div>
                  <button
                    type="button"
                    className={`write-step__score write-step__score--${tierForScore(score)}`}
                    onClick={() => setReviewStep('score')}
                  >
                    今日感受 <strong>{score}</strong>/10 · 修改
                  </button>
                </div>

                <div className="writing-prompts">
                  <span>今天发生了什么？</span>
                  <span>哪个瞬间值得记住？</span>
                  <span>明天想怎样对待自己？</span>
                </div>

                <label className="reflection-note">
                  <span>今日记录</span>
                  <textarea
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value)
                      setSaveState('idle')
                    }}
                    maxLength={1200}
                    placeholder="今天，我想记住的是……"
                  />
                  <small>{note.length} / 1200</small>
                </label>

                <footer className="write-step__footer">
                  <p aria-live="polite">
                    {saveState === 'saved' && '✓ 今日复盘已经妥善保存'}
                    {saveState === 'error' && '保存失败，请检查浏览器存储设置'}
                    {saveState === 'idle' && !note.trim() && '写下一点内容后即可保存'}
                  </p>
                  <button
                    type="button"
                    disabled={!note.trim()}
                    onClick={saveReflection}
                  >
                    {saveState === 'saved' ? '更新记录' : '保存今日复盘'}
                    <span>→</span>
                  </button>
                </footer>
              </div>
            )}
          </div>
        </section>

        <MonthReview
          reflections={reflections}
          dailyStats={stats}
          tasks={tasks}
          today={today}
        />

      </div>
    </main>
  )
}

export default AboutPage
