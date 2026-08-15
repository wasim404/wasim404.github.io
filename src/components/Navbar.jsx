import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    id: 'home',
    name: '首页',
    path: '/',
    description: '返回网站首页',
  },
  {
    id: 'calendar',
    name: '日程',
    path: '/schedule',
    description: '安排和查看每日任务',
  },
  {
    id: 'focus',
    name: '专注',
    path: '/focus',
    description: '进入沉浸式专注模式',
  },
  {
    id: 'about',
    name: '关于',
    path: '/about',
    description: '了解 MANOONG 网站',
  },
]

function Navbar() {
  const { user, isLoading } = useAuth()
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-[#18392f]/10 bg-[#f7f4ed]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-[1180px] items-center px-3 sm:h-22 sm:px-6" aria-label="主导航">
        <NavLink
          to="/"
          className="shrink-0 text-[12px] font-extrabold tracking-[0.16em] text-[#18392f] sm:text-[15px]"
          aria-label="MANOONG 首页"
        >
          MANOONG
        </NavLink>

        <div className="mx-2 flex min-w-0 flex-1 items-center justify-evenly sm:mx-8 lg:mx-16">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              title={item.description}
              className={({ isActive }) =>
                `inline-flex px-1 py-2 text-[13px] tracking-[0.03em] transition-colors sm:px-3 sm:text-[16px] ${
                  isActive
                    ? 'font-extrabold text-[#18392f]'
                    : 'font-semibold text-[#527066] hover:text-[#18392f]'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        <NavLink
          to={user ? '/profile' : '/login'}
          className="inline-flex shrink-0 items-center rounded-[10px] bg-[#18392f] px-3 py-2.5 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(24,57,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#245244] hover:shadow-[0_10px_24px_rgba(24,57,47,0.24)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18392f] sm:px-5 sm:text-[12px]"
        >
          {isLoading ? '账户' : user ? '我的账户' : '登录'} <span className="ml-1.5 text-[#77b99f]" aria-hidden="true">→</span>
        </NavLink>
      </nav>
    </header>
  )
}

export default Navbar
