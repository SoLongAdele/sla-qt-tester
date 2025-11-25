/**
 * Logo 组件
 */
export default function Logo() {
  return (
    <div className="flex items-center gap-3 animate-slide-in">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-2xl">🧪</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          FlowTest Pro
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          智能视觉驱动的流程图测试平台
        </p>
      </div>
    </div>
  )
}

