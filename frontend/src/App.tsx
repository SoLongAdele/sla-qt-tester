import { useState } from 'react'
import QualityManager from './modules/quality/QualityManager'
import VisualAgent from './modules/visual/VisualAgent'
import SideNav from './components/SideNav'
import Logo from './components/Logo'
import Settings from './components/Settings'

function App() {
  const [activeView, setActiveView] = useState<'quality' | 'visual' | 'settings'>('quality')

  return (
    <div className="h-screen bg-dots overflow-hidden">
      {/* 侧边导航 */}
      <SideNav activeView={activeView} onViewChange={setActiveView} />

      {/* 主内容区域 */}
      <div className="h-full pl-20 flex flex-col">
        {/* 顶部栏 */}
        <header className="glass-panel p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="badge badge-success">运行中</span>
              <span>|</span>
              <span>SLA Qt Tester v1.0</span>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {activeView === 'quality' && <QualityManager />}
            {activeView === 'visual' && <VisualAgent />}
            {activeView === 'settings' && <Settings />}
          </div>
        </main>

        {/* 底部状态栏 */}
        <footer className="glass-panel p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>FlowTest Pro - 智能视觉驱动的流程图测试平台</span>
            <span>© 2025 SLA Team</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
