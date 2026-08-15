import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './NotFoundPage.css'

function NotFoundPage() {
  const location = useLocation()

  useEffect(() => {
    const previousTitle = document.title
    document.title = '页面走丢了 · MANOONG'
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <main className="not-found-page">
      <div className="not-found-orb not-found-orb--mint" aria-hidden="true" />
      <div className="not-found-orb not-found-orb--coral" aria-hidden="true" />

      <section className="not-found-shell" aria-labelledby="not-found-title">
        <div className="not-found-copy">
          <p className="not-found-kicker">
            <span aria-hidden="true" />
            404 · 这条路暂时没铺
          </p>
          <h1 id="not-found-title">
            嗯？这页好像
            <br />
            <em>偷偷去专注了。</em>
          </h1>
          <p className="not-found-description">
            你访问的资源不存在，也可能已经搬去了更安静的地方。
            地址栏没有任务完成奖励，不如先回到熟悉的页面吧。
          </p>

          <div className="not-found-actions">
            <Link className="not-found-primary" to="/">
              返回首页
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="not-found-secondary" to="/schedule">
              去看看日程
            </Link>
          </div>

          <p className="not-found-path">
            <span>走丢的地址</span>
            <code>{location.pathname}</code>
          </p>
        </div>

        <div className="not-found-visual" aria-hidden="true">
          <span className="not-found-spark not-found-spark--one">✦</span>
          <span className="not-found-spark not-found-spark--two">·</span>
          <div className="not-found-number">
            <span>4</span>
            <i>
              <b>?</b>
            </i>
            <span>4</span>
          </div>
          <div className="not-found-note">
            <span>资源状态</span>
            <strong>溜号中 · 暂未找到</strong>
          </div>
          <p>别担心，你的任务和专注记录都还在。</p>
        </div>
      </section>
    </main>
  )
}

export default NotFoundPage
