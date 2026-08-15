import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDailyQuote } from '../../data/dailyQuotes'
import './HomePage.css'
import { setAccountStorageItem } from '../../services/accountData'
import { useAuth } from '../../context/AuthContext'

const pad = (value) => String(value).padStart(2, '0')

const HERO_LEADS = [
  '先把脚步放稳，',
  '不用急着证明什么，',
  '把纷扰轻轻放下，',
  '从眼前的一小步开始，',
  '让今天留一点空白，',
  '把注意力收回此刻，',
  '允许自己慢慢进入状态，',
  '比速度更重要的是方向，',
  '给好奇心多一点位置，',
  '把目标缩小到可以开始，',
  '带着耐心继续练习，',
  '让每一次停顿都有意义，',
  '选择自己的节奏，',
]

const HERO_HIGHLIGHTS = [
  '重要的事会慢慢清晰。',
  '专注会替你找到答案。',
  '今天值得认真对待。',
  '进步正在安静发生。',
  '你已经在靠近想去的地方。',
  '此刻就是最好的起点。',
  '小小一步也有分量。',
  '完成会带来新的力量。',
  '时间会记住这份认真。',
  '清醒比忙碌更珍贵。',
  '方向会在行动中出现。',
  '今天可以温柔而坚定。',
  '积累终会给出回声。',
  '平静也是一种效率。',
  '自己的节奏最可靠。',
  '做深一件事就很好。',
  '认真生活本身就是答案。',
]

const HERO_SUPPORT_LEADS = [
  '不必赶着填满每一分钟。',
  '先看清真正重要的事情。',
  '今天不需要完成所有答案。',
  '给思绪一点安静的空间。',
  '把遥远的目标放回眼前。',
  '允许学习保留自己的呼吸。',
  '从一个愿意开始的动作出发。',
  '别让忙碌替你决定方向。',
  '把复杂的事情慢慢拆开。',
  '今天只与昨天的自己比较。',
  '先照顾好能量，再谈效率。',
  '把注意力放在可以改变的地方。',
  '一次只认真面对一个问题。',
  '让计划服务于生活，而不是相反。',
  '无需等待所谓的完美状态。',
  '把犹豫变成一次轻量的尝试。',
  '为真正的思考留下一点余地。',
  '慢下来并不意味着停止。',
  '每一个普通日子都可以被认真使用。',
]

const HERO_SUPPORT_DETAILS = [
  '给重要的事情留出完整的一段。',
  '从可以完成的小事里建立确定感。',
  '把今天过好，本身就是一种积累。',
  '让一次专注成为今天的清晰坐标。',
  '你需要的下一步，通常就在手边。',
  '做少一点，也可以做得更深入。',
  '先行动，方向会在途中逐渐清楚。',
  '真正的效率来自清醒的取舍。',
  '把理解变深，比把页面翻快更重要。',
  '留下一点余力，才能走得更长久。',
  '对自己诚实，是稳定前进的开始。',
  '学习不是追赶，而是在建立自己的地图。',
  '今天的认真，会成为明天的底气。',
  '把一次练习做完整，就已经很了不起。',
  '当注意力回来，时间也会重新变得宽阔。',
  '每次重新开始，都算一次有效的前进。',
  '让任务变小，让行动真正发生。',
  '用耐心回应暂时还不会的事情。',
  '完成眼前这一页，再决定下一段路。',
  '给好奇心一个继续追问的机会。',
  '不被打扰的片刻，往往最有力量。',
  '稳定地出现，比偶尔完美更可靠。',
  '今天的节奏，由你亲自决定。',
]

function getDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getDayNumber(date) {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000,
  )
}

function getDailyHero(date, dailyQuoteText) {
  const dayNumber = getDayNumber(date)
  const lead = HERO_LEADS[(dayNumber * 5 + 7) % HERO_LEADS.length]
  const highlight =
    HERO_HIGHLIGHTS[(dayNumber * 7 + 3) % HERO_HIGHLIGHTS.length]
  const supportLead =
    HERO_SUPPORT_LEADS[(dayNumber * 11 + 5) % HERO_SUPPORT_LEADS.length]
  let supportDetailIndex =
    (dayNumber * 13 + 9) % HERO_SUPPORT_DETAILS.length
  let supportDetail = HERO_SUPPORT_DETAILS[supportDetailIndex]

  if (`${supportLead}${supportDetail}` === dailyQuoteText) {
    supportDetailIndex = (supportDetailIndex + 1) % HERO_SUPPORT_DETAILS.length
    supportDetail = HERO_SUPPORT_DETAILS[supportDetailIndex]
  }

  return { lead, highlight, supportLead, supportDetail }
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
        <b>{label === '今年' ? '长期主义，也可以看得见' : '每一小步都算数'}</b>
      </div>
    </article>
  )
}

function HomePage() {
  const { user } = useAuth()
  const [now, setNow] = useState(() => new Date())
  const dateKey = getDateKey(now)
  const [energy, setEnergy] = useState(
    () => Number(localStorage.getItem('manoong-energy') || 2),
  )
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [checkinState, setCheckinState] = useState(() => ({
    dateKey,
    status:
      localStorage.getItem(`manoong-daily-checkin-${dateKey}`) === 'true'
        ? 'unlocked'
        : 'locked',
  }))
  const checkinStatus =
    checkinState.dateKey === dateKey
      ? checkinState.status
      : localStorage.getItem(`manoong-daily-checkin-${dateKey}`) === 'true'
        ? 'unlocked'
        : 'locked'

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
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
  const heroCopy = useMemo(
    () => getDailyHero(now, dailyQuote.text),
    [now, dailyQuote.text],
  )
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
  const greeting = now.getHours() < 11 ? '早上好' : now.getHours() < 18 ? '下午好' : '晚上好'
  const monthCells = Array.from({ length: progress.daysInMonth }, (_, index) => index + 1)

  const rollFocus = () => {
    const options = [15, 25, 35, 45, 60]
    setFocusMinutes(options[Math.floor(Math.random() * options.length)])
  }

  const handleDailyCheckin = () => {
    if (checkinStatus !== 'locked') return
    setAccountStorageItem(`manoong-daily-checkin-${dateKey}`, 'true')
    setCheckinState({ dateKey, status: 'unlocking' })
  }

  return (
    <main className="home-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span /> YOUR LEARNING COMPANION</div>
          <h1>{greeting}，<br />{heroCopy.lead}<span>{heroCopy.highlight}</span></h1>
          <p>
            {heroCopy.supportLead}
            <br className="desktop-break" />{heroCopy.supportDetail}
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/focus">
              <Icon>▶</Icon> 开始专注
            </Link>
            <Link className="text-button" to="/schedule">
              查看今日计划 <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <aside className="today-card" aria-label="今日概览">
          <div className="today-card__top">
            <span>TODAY</span>
            <span className="today-card__pulse" />
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
            <span><i className="weather-dot" /> 适合深度思考</span>
            <b>{pad(now.getHours())}:{pad(now.getMinutes())}</b>
          </div>
        </aside>
      </section>

      <section className="progress-section" aria-labelledby="progress-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">TIME, VISUALIZED</span>
            <h2 id="progress-title">时间正在发生</h2>
          </div>
          <p>不是为了制造焦虑，<br />只是提醒你：此刻很珍贵。</p>
        </div>

        <div className="progress-grid">
          <ProgressRing
            value={progress.year}
            label="今年"
            detail={`第 ${progress.dayOfYear} / ${progress.daysInYear} 天`}
          />
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
            <p>今天还有 <b>{24 - progress.hour} 小时</b>，留一点给真正重要的事。</p>
          </article>
        </div>
      </section>

      <section className="studio-section" aria-labelledby="studio-title">
        <div className="section-heading section-heading--compact">
          <div>
            <span className="section-kicker">YOUR LITTLE STUDIO</span>
            <h2 id="studio-title">今天，想把注意力放在哪里？</h2>
          </div>
          <span className="live-note">
            <i /> {user ? '已安全同步到账户' : '登录后可跨设备同步'}
          </span>
        </div>

        <div className="studio-grid">
          <article className="energy-card">
            <div className="card-label"><Icon>⌁</Icon><span>此刻能量</span></div>
            <div className="energy-picker" role="group" aria-label="选择此刻能量">
              {['低电量', '刚刚好', '满格'].map((label, index) => (
                <button
                  key={label}
                  className={energy === index + 1 ? 'is-active' : ''}
                  onClick={() => {
                    setEnergy(index + 1)
                    setAccountStorageItem('manoong-energy', String(index + 1))
                  }}
                  type="button"
                >
                  <span>{['◔', '◑', '●'][index]}</span>{label}
                </button>
              ))}
            </div>
            <p>{energy === 1 ? '低能量日，也值得温柔地前进。' : energy === 3 ? '状态在线，适合啃下最难的骨头。' : '稳定，就是今天最好的节奏。'}</p>
          </article>

          <article className="focus-dice-card">
            <div className="card-label"><Icon>✦</Icon><span>专注骰子</span></div>
            <button className="dice-display" type="button" onClick={rollFocus} aria-label="随机一个专注时长">
              <strong>{focusMinutes}</strong><span>MIN</span>
            </button>
            <div className="focus-dice-card__content">
              <p>选择困难？让运气替你决定一轮。</p>
              <div className="dice-actions">
                <button type="button" className="small-button" onClick={rollFocus}>
                  再摇一次 ↻
                </button>
                <Link
                  className="dice-start-button"
                  to="/focus"
                  state={{ focusLaunch: { durationMinutes: focusMinutes } }}
                >
                  开始专注 <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      <footer className="home-footer">
        <span>MANOONG · 慢一点，也是在前进。</span>
        <span>Made for focused minds <i>♥</i></span>
      </footer>
    </main>
  )
}

export default HomePage
