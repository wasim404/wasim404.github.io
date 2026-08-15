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
      <nav className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-3 sm:h-22 sm:px-6">
        <NavLink
          to="/"
          className="flex items-center gap-3 text-[15px] font-extrabold tracking-[0.15em] text-[#18392f]"
        >
          <span className="grid size-8 place-items-center rounded-[10px] bg-[#18392f] text-[12px] text-[#77b99f]">M</span>
          <span className="hidden sm:inline">MANOONG</span>
        </NavLink>

        <div className="flex items-center gap-0.5 rounded-2xl bg-white/55 p-1 sm:gap-1 sm:p-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              title={item.description}
              className={({ isActive }) =>
                `${item.id === 'home' ? 'hidden sm:inline-flex' : 'inline-flex'} rounded-xl px-2 py-2 text-[11px] font-medium transition sm:px-4 sm:text-[12px] ${
                  isActive
                    ? 'bg-[#18392f] text-white shadow-sm'
                    : 'text-[#527066] hover:bg-white hover:text-[#18392f]'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        <NavLink
          to={user ? '/profile' : '/login'}
          className="hidden rounded-xl border border-[#18392f]/15 px-4 py-2 text-[11px] font-semibold text-[#18392f] transition hover:border-[#77b99f] hover:bg-[#dcece4] sm:block"
        >
          {isLoading ? '账户' : user ? '我的账户' : '登录'} <span className="ml-1 text-[#e8785f]">→</span>
        </NavLink>
      </nav>
    </header>
  )
}

export default Navbar
