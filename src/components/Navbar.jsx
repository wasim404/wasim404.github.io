import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
    id: 'notes',
    name: '随手记',
    path: '/notes',
    description: '记录临时想法',
  },
  {
    id: 'focus',
    name: '专注',
    path: '/focus',
    description: '进入沉浸式专注模式',
  },
]

const aboutItems = [
  {
    id: 'settings',
    name: '设置',
    path: '/about',
    description: '账号与使用偏好',
    end: true,
  },
  {
    id: 'statistics',
    name: '数据统计',
    path: '/about/statistics',
    description: '查看状态复盘与使用数据',
  },
]

const getNavigationItemClass = (isActive) =>
  `inline-flex px-1 py-2 text-[13px] leading-none tracking-[0.03em] transition-colors sm:px-3 sm:text-[20px] ${
    isActive
      ? 'font-extrabold text-[#18392f]'
      : 'font-semibold text-[#527066] hover:text-[#18392f]'
  }`

function Navbar() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const aboutMenuRef = useRef(null)

  useEffect(() => {
    if (!isAboutOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!aboutMenuRef.current?.contains(event.target)) {
        setIsAboutOpen(false)
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsAboutOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isAboutOpen])

  const isAboutActive = location.pathname.startsWith('/about')

  return (
    <header className="site-navbar fixed left-0 top-0 z-50 w-full border-b border-[#18392f]/10 bg-[#f7f4ed]/90 backdrop-blur-xl">
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
              className={({ isActive }) => getNavigationItemClass(isActive)}
            >
              {item.name}
            </NavLink>
          ))}

          <div className="relative" ref={aboutMenuRef}>
            <NavLink
              to="/about"
              className={`${getNavigationItemClass(isAboutActive)} items-center gap-1`}
              aria-expanded={isAboutOpen}
              aria-haspopup="menu"
              aria-controls="about-navigation-menu"
              onClick={(event) => {
                event.preventDefault()
                setIsAboutOpen((isOpen) => !isOpen)
              }}
            >
              关于
              <span
                className={`text-[9px] transition-transform sm:text-[10px] ${isAboutOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                ▾
              </span>
            </NavLink>

            {isAboutOpen && (
              <div
                id="about-navigation-menu"
                className="absolute left-1/2 top-[calc(100%+12px)] w-[196px] -translate-x-1/2 overflow-hidden rounded-[16px] border border-[#18392f]/10 bg-[#fffdf8]/98 p-1.5 shadow-[0_18px_48px_rgba(24,57,47,0.16)] backdrop-blur-xl"
                role="menu"
              >
                {aboutItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.end}
                    role="menuitem"
                    onClick={() => setIsAboutOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-[11px] px-3 py-2.5 transition-colors ${
                        isActive
                          ? 'bg-[#dcece4] text-[#18392f]'
                          : 'text-[#527066] hover:bg-[#f7f4ed] hover:text-[#18392f]'
                      }`
                    }
                  >
                    <strong className="block text-[13px]">{item.name}</strong>
                    <span className="mt-0.5 block text-[10px] font-medium opacity-75">
                      {item.description}
                    </span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
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
