import { Link, Outlet, useLocation } from 'react-router-dom'
import Navbar from '../Navbar'
import { useAuth } from '../../context/AuthContext'

function MainLayout() {
  const { user, isLoading, dataRevision } = useAuth()
  const location = useLocation()
  const showLoginHint = !isLoading && !user && location.pathname === '/'

  return (
    <>
      <Navbar />
      {showLoginHint && (
        <aside className="guest-login-hint" aria-label="登录同步提示">
          <span aria-hidden="true">↻</span>
          <p><strong>登录，让进度跟着你</strong><small>任务和专注记录可在不同设备同步</small></p>
          <Link to="/login">去登录</Link>
        </aside>
      )}
      <Outlet key={dataRevision} />
    </>
  )
}

export default MainLayout
