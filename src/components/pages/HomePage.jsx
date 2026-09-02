import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDailyQuote } from '../../data/dailyQuotes'
import './HomePage.css'
import { setAccountStorageItem } from '../../services/accountData'
import { useAuth } from '../../context/AuthContext'
import beianIcon from '../../assets/beian.png'

const pad = (value) => String(value).padStart(2, '0')

const clockTicks = Array.from({ length: 60 }, (_, index) => index)
const focusDiceOptions = Array.from({ length: 10 }, (_, index) => 15 + index * 5)

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getDayNumber(date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  )
}

const GREETING_PERIODS = {
  morning: {
    id: 'morning',
    messages: [
      (name) => `早上好，${name}，新的一天，新的成长！`,
      (name) => `早上好，${name}，MANOONG已为你准备就绪！`,
      (name) => `早上好，${name}，MANOONG永远爱你，支持你！`,
      (name) => `早上好，${name}，一切都在变好！`,
    ],
  },
  noon: {
    id: 'noon',
    messages: [
      (name) => `中午好，${name}，MANOONG等你中午小憩归来`,
      (name) => `中午好，${name}，想好下一步怎么安排了吗？`,
    ],
  },
  afternoon: {
    id: 'afternoon',
    messages: [
      (name) => `下午好，${name}，MANOONG看到你正在成长！`,
      (name) => `下午好，${name}，时间会奖励坚持的人！`,
      (name) => `下午好，${name}，认真生活自有回响！`,
      (name) => `下午好，${name}，你的努力不会白费！`,
      (name) => `下午好，${name}，今天的你很不错！`,
    ],
  },
  evening: {
    id: 'evening',
    messages: [
      (name) => `晚上好，${name}，留点时间，照顾自己！`,
      (name) => `晚上好，${name}，回顾一天，也拥抱自己！`,
      (name) => `晚上好，${name}，给今天画一个句号吧。`,
      (name) => `晚上好，${name}，放下屏幕，让自己歇会。`,
      (name) => `晚上好，${name}，今天辛苦了！`,
      (name) => `晚上好，${name}，今天有什么值得记住？`,
    ],
  },
  night: {
    id: 'night',
    messages: [() => '夜深了，早点休息，祝好梦，MANOONG永远爱你！'],
  },
}

function getGreetingPeriod(hour) {
  if (hour >= 5 && hour < 11) return GREETING_PERIODS.morning
  if (hour >= 11 && hour < 13) return GREETING_PERIODS.noon
  if (hour >= 13 && hour < 18) return GREETING_PERIODS.afternoon
  if (hour >= 18 && hour < 23) return GREETING_PERIODS.evening
  return GREETING_PERIODS.night
}

function readCheckinTime(dateKey) {
  const storedValue = localStorage.getItem(`manoong-daily-checkin-${dateKey}`)
  if (!storedValue || storedValue === 'true') return null

  const checkinTime = new Date(storedValue)
  return Number.isNaN(checkinTime.getTime()) ? null : checkinTime
}

function hasDailyCheckin(dateKey) {
  return localStorage.getItem(`manoong-daily-checkin-${dateKey}`) !== null
}

function hasSevenDayEarlyCheckinStreak(now) {
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset)
    const checkinTime = readCheckinTime(getDateKey(date))
    if (
      !checkinTime ||
      getDateKey(checkinTime) !== getDateKey(date) ||
      checkinTime.getHours() < 6 ||
      checkinTime.getHours() >= 8
    ) {
      return false
    }
  }
  return true
}

function getStableGreeting(period, dateKey, ownerKey, displayName) {
  const storageKey = `manoong-home-greeting-${ownerKey}-${dateKey}-${period.id}`
  const storedIndex = Number(localStorage.getItem(storageKey))
  let messageIndex = storedIndex

  if (!Number.isInteger(storedIndex) || storedIndex < 0 || storedIndex >= period.messages.length) {
    messageIndex = Math.floor(Math.random() * period.messages.length)
    localStorage.setItem(storageKey, String(messageIndex))
  }

  return period.messages[messageIndex](displayName)
}

const unlockParticles = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2
  const distance = 58 + (index % 5) * 11

  return {
    x: `${Math.cos(angle) * distance}px`,
    y: `${Math.sin(angle) * distance}px`,
    delay: `${(index % 6) * 35}ms`,
    color: index % 3 === 0 ? '#e8785f' : index % 3 === 1 ? '#77b99f' : '#e6b85c',
  }
})

function getTimeProgress(now) {
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const startOfNextYear = new Date(year + 1, 0, 1)
  const startOfMonth = new Date(year, now.getMonth(), 1)
  const startOfNextMonth = new Date(year, now.getMonth() + 1, 1)
  const startOfDay = new Date(year, now.getMonth(), now.getDate())
  const startOfNextDay = new Date(year, now.getMonth(), now.getDate() + 1)

  const percent = (value, start, end) =>
    Math.min(100, Math.max(0, ((value - start) / (end - start)) * 100))

  return {
    year: percent(now, startOfYear, startOfNextYear),
    month: percent(now, startOfMonth, startOfNextMonth),
    day: percent(now, startOfDay, startOfNextDay),
    dayOfYear: Math.floor((now - startOfYear) / 86400000) + 1,
    daysInYear: Math.round((startOfNextYear - startOfYear) / 86400000),
    dayOfMonth: now.getDate(),
    daysInMonth: new Date(year, now.getMonth() + 1, 0).getDate(),
    hour: now.getHours(),
  }
}

function Icon({ children }) {
  return <span className="ui-icon" aria-hidden="true">{children}</span>
}

function ProgressRing({ value, label, detail, tone = 'mint' }) {
  return (
    <article className={`progress-card progress-card--${tone}`}>
      <span className="progress-card__title">本年进度</span>
      <div
        className="progress-ring"
        style={{ '--progress': `${value * 3.6}deg` }}
        role="img"
        aria-label={`${label}进度 ${value.toFixed(1)}%`}
      >
        <div className="progress-ring__inner">
          <strong>{value.toFixed(1)}<small>%</small></strong>
          <span>{label}</span>
        </div>
      </div>
      <div className="progress-card__copy">
        <span>{detail}</span>
      </div>
    </article>
  )
}

function HomePage() {
  const { user } = useAuth()
  const [now, setNow] = useState(() => new Date())
  const dateKey = getDateKey(now)
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [checkinState, setCheckinState] = useState(() => ({
    dateKey,
    status: hasDailyCheckin(dateKey) ? 'unlocked' : 'locked',
  }))
  const checkinStatus =
    checkinState.dateKey === dateKey
      ? checkinState.status
      : hasDailyCheckin(dateKey) ? 'unlocked' : 'locked'

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (checkinStatus !== 'unlocking') return undefined

    const timer = window.setTimeout(
      () => setCheckinState({ dateKey, status: 'unlocked' }),
      900,
    )
    return () => window.clearTimeout(timer)
  }, [checkinStatus, dateKey])

  const progress = useMemo(() => getTimeProgress(now), [now])
  const dailyQuote = useMemo(() => getDailyQuote(getDayNumber(now)), [now])
  const greetingPeriod = getGreetingPeriod(now.getHours())
  const hasEarlyCheckinStreak = useMemo(() => {
    if (checkinStatus === 'locked') return false
    return hasSevenDayEarlyCheckinStreak(new Date(`${dateKey}T12:00:00`))
  }, [dateKey, checkinStatus])
  const greeting = useMemo(() => {
    if (greetingPeriod.id === 'morning' && hasEarlyCheckinStreak) {
      return `早上好，${user?.username || '朋友'}，连续7天早起打卡，棒棒哒！`
    }

    return getStableGreeting(
      greetingPeriod,
      dateKey,
      user?.id || 'guest',
      user?.username || '朋友',
    )
  }, [dateKey, greetingPeriod, hasEarlyCheckinStreak, user?.id, user?.username])
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  const monthCells = Array.from({ length: progress.daysInMonth }, (_, index) => index + 1)
  const minuteRotation = now.getMinutes() * 6
  const hourRotation = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5

  const rollFocus = () => {
    setFocusMinutes(
      focusDiceOptions[Math.floor(Math.random() * focusDiceOptions.length)],
    )
  }

  const handleDailyCheckin = () => {
    if (checkinStatus !== 'locked') return
    setAccountStorageItem(`manoong-daily-checkin-${dateKey}`, now.toISOString())
    setCheckinState({ dateKey, status: 'unlocking' })
  }

  return (
    <main className="home-shell">
      <section className="hero-section">
        <div className="time-stage">
          <div
            className="analog-clock"
            role="img"
            aria-label={`当前时间 ${pad(now.getHours())}:${pad(now.getMinutes())}`}
          >
            <div className="analog-clock__face" aria-hidden="true">
              {clockTicks.map((tick) => (
                <i
                  key={tick}
                  className={`clock-tick${tick % 5 === 0 ? ' clock-tick--hour' : ''}${tick % 15 === 0 ? ' clock-tick--cardinal' : ''}`}
                  style={{ '--tick-rotation': `${tick * 6}deg` }}
                />
              ))}
              <span className="clock-number clock-number--12">12</span>
              <span className="clock-number clock-number--3">3</span>
              <span className="clock-number clock-number--6">6</span>
              <span className="clock-number clock-number--9">9</span>
              <span
                className="clock-hand clock-hand--hour"
                style={{ '--hand-rotation': `${hourRotation}deg` }}
              />
              <span
                className="clock-hand clock-hand--minute"
                style={{ '--hand-rotation': `${minuteRotation}deg` }}
              />
              <span className="clock-pin" />
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <Link className="primary-button" to="/focus">
            <Icon>▶</Icon> 开始专注
          </Link>
          <Link className="text-button" to="/schedule">
            查看今日计划 <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <aside className="today-card" aria-label="今日概览">
          <div className="today-card__top">
            <span>TODAY</span>
          </div>
          <div className="today-card__date">
            <strong>{pad(now.getDate())}</strong>
            <div>
              <b>{now.toLocaleDateString('zh-CN', { month: 'long' })}</b>
              <span>{weekday} · {now.getFullYear()}</span>
            </div>
          </div>
          <div
            className={`daily-checkin is-${checkinStatus}`}
            aria-live="polite"
          >
            {checkinStatus === 'unlocking' && (
              <div className="unlock-particles" aria-hidden="true">
                {unlockParticles.map((particle, index) => (
                  <i
                    key={index}
                    style={{
                      '--particle-x': particle.x,
                      '--particle-y': particle.y,
                      '--particle-delay': particle.delay,
                      '--particle-color': particle.color,
                    }}
                  />
                ))}
              </div>
            )}
            <div
              className="daily-quote"
              aria-hidden={checkinStatus !== 'unlocked'}
            >
              <span className="quote-mark">“</span>
              <p>{dailyQuote.text}</p>
              <small>
                <span>— {dailyQuote.source}</span>
                <b>{dailyQuote.theme}</b>
              </small>
            </div>
            {checkinStatus !== 'unlocked' && (
              <div className="checkin-lock">
                <span>{checkinStatus === 'unlocking' ? '正在解锁今日一句…' : '完成今日打卡，解锁一句话'}</span>
                <button
                  type="button"
                  onClick={handleDailyCheckin}
                  disabled={checkinStatus === 'unlocking'}
                >
                  <i aria-hidden="true">{checkinStatus === 'unlocking' ? '✦' : '✓'}</i>
                  {checkinStatus === 'unlocking' ? '解锁中' : '今日打卡'}
                </button>
              </div>
            )}
          </div>
          <div className="today-card__footer">
            <b>{pad(now.getHours())}:{pad(now.getMinutes())}</b>
          </div>
        </aside>
      </section>

      <section className="progress-section" aria-labelledby="progress-title">
        <div className="time-heading">
          <h2 id="progress-title">
            <span>流</span>
            <i aria-hidden="true">·</i>
            <span>时</span>
          </h2>
        </div>

        <div className="progress-grid">
          <article className="day-progress-card">
            <div className="day-progress-card__head">
              <div>
                <span>今日进度</span>
                <strong>{progress.day.toFixed(1)}<small>%</small></strong>
              </div>
              <Icon>☼</Icon>
            </div>
            <div className="day-track">
              <span style={{ width: `${progress.day}%` }} />
              <i style={{ left: `${progress.day}%` }} />
            </div>
            <div className="day-labels"><span>00:00</span><span>12:00</span><span>24:00</span></div>
            <p aria-live="polite">{greeting}</p>
          </article>
          <article className="month-progress-card">
            <div className="month-progress-card__head">
              <div>
                <span>本月进度</span>
                <strong>{progress.month.toFixed(1)}<small>%</small></strong>
              </div>
              <b>{now.getMonth() + 1} 月</b>
            </div>
            <div className="month-days" aria-label={`本月已过 ${progress.dayOfMonth} 天`}>
              {monthCells.map((day) => (
                <span
                  key={day}
                  className={day < progress.dayOfMonth ? 'is-past' : day === progress.dayOfMonth ? 'is-today' : ''}
                  title={`${day} 日`}
                />
              ))}
            </div>
            <div className="month-progress-card__foot">
              <span>{progress.dayOfMonth} 天已走过</span>
              <span>还有 {progress.daysInMonth - progress.dayOfMonth} 天</span>
            </div>
          </article>
          <ProgressRing
            value={progress.year}
            label="今年"
            detail={`第 ${progress.dayOfYear} / ${progress.daysInYear} 天`}
          />
        </div>
      </section>

      <section className="studio-section" aria-label="快捷功能">
        <div className="studio-grid">
          <article className="focus-dice-card">
            <div className="focus-dice-card__head">
              <span>专注骰子</span>
              <button type="button" onClick={rollFocus} aria-label="重新随机专注时长">↻</button>
            </div>
            <button className="dice-display" type="button" onClick={rollFocus} aria-label="随机一个专注时长">
              <strong>{focusMinutes}</strong><span>分钟</span>
            </button>
            <Link
              className="dice-start-button"
              to="/focus"
              state={{ focusLaunch: { durationMinutes: focusMinutes } }}
            >
              开始专注 <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="note-quick-card">
            <div className="note-quick-card__head">
              <span>随手记</span>
              <i aria-hidden="true">✎</i>
            </div>
            <div className="note-quick-card__preview" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Link className="note-quick-button" to="/notes">
              即刻记录 <span aria-hidden="true">→</span>
            </Link>
          </article>
          {Array.from({ length: 2 }, (_, index) => (
            <article className="studio-placeholder" aria-label={`预留功能位 ${index + 1}`} key={index}>
              <span aria-hidden="true">＋</span>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <span className="home-footer__legal">
          MANOONG · 慢一点，也是在前进。 ·{' '}
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">
            闽ICP备2026032311号
          </a>
          <a
            className="home-footer__beian"
            href="https://beian.mps.gov.cn/#/query/webSearch?code=35011102351277"
            target="_blank"
            rel="noreferrer"
          >
            <img src={beianIcon} alt="" aria-hidden="true" />
            闽公网安备35011102351277号
          </a>
        </span>
        <span>Made for focused minds <i>♥</i></span>
      </footer>
    </main>
  )
}

export default HomePage
