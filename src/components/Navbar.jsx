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
    path: '/calendar',
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
  return (
    <header className="fixed left-0 top-0 z-50 w-full bg-[#333333]">
      <nav className="grid h-22 w-full grid-cols-5 items-center px-4">
        <a
          href="/"
          className="hover:text-green-500 text-center text-xl font-bold tracking-wider text-white"
        >
          MANOONG
        </a>

        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.path}
            title={item.description}
            className="text-center text-sm text-gray-300 transition-colors hover:text-green-400"
          >
            {item.name}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;