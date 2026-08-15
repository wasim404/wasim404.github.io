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
          <p><strong>登录，让进度跟着你</strong></p>
          <Link to="/login">去登录</Link>
        </aside>
      )}
      <Outlet key={dataRevision} />
    </>
  )
}

export default MainLayout
