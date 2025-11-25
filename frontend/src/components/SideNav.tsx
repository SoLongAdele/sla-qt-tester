/**
 * 侧边导航组件 - 参考 devtools-main 设计
 */
import { useState } from 'react'

interface NavItem {
  icon: string
  title: string
  view: 'quality' | 'visual' | 'settings'
}

interface SideNavProps {
  activeView: string
  onViewChange: (view: 'quality' | 'visual' | 'settings') => void
}

export default function SideNav({ activeView, onViewChange }: SideNavProps) {
  const [isDark, setIsDark] = useState(false)

  const navItems: NavItem[] = [
    { icon: '📋', title: '质量管理', view: 'quality' },
    { icon: '🎯', title: '视觉测试', view: 'visual' },
    { icon: '⚙️', title: '设置', view: 'settings' },
  ]

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="side-nav-fixed">
      <div className="glass-panel rounded-r-2xl p-2 flex flex-col gap-2 shadow-lg">
        {/* 导航项 */}
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            title={item.title}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              transition-all duration-200
              ${
                activeView === item.view
                  ? 'bg-blue-500 text-white shadow-lg scale-110'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 opacity-60 hover:opacity-100'
              }
            `}
          >
            <span className="text-2xl">{item.icon}</span>
          </button>
        ))}

        {/* 分隔线 */}
        <div className="h-px bg-gray-300 dark:bg-gray-600 my-2" />

        {/* 深色模式切换 */}
        <button
          onClick={toggleDarkMode}
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
          className="w-12 h-12 rounded-xl flex items-center justify-center
                   hover:bg-gray-100 dark:hover:bg-gray-700 
                   opacity-60 hover:opacity-100 transition-all duration-200"
        >
          <span className="text-2xl">{isDark ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </div>
  )
}

