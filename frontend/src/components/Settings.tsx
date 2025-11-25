/**
 * 设置页面组件
 */
export default function Settings() {
  return (
    <div className="card p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        ⚙️ 系统设置
      </h2>

      <div className="space-y-6">
        {/* 应用信息 */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            应用信息
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">版本</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">1.0.0</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">环境</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">开发版</p>
            </div>
          </div>
        </section>

        {/* 关于 */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            关于
          </h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              FlowTest Pro 是一款智能视觉驱动的流程图编辑器测试平台。
              结合静态代码分析、单元测试可视化、实时视觉监控和 AI 自动化测试，
              为 Qt 应用程序提供全方位的质量保障。
            </p>
          </div>
        </section>

        {/* 技术栈 */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            技术栈
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="badge badge-info p-3">React 19</div>
            <div className="badge badge-info p-3">Vite 6</div>
            <div className="badge badge-info p-3">TypeScript</div>
            <div className="badge badge-info p-3">Tailwind CSS</div>
            <div className="badge badge-info p-3">Python</div>
            <div className="badge badge-info p-3">Qt 6</div>
          </div>
        </section>
      </div>
    </div>
  )
}

