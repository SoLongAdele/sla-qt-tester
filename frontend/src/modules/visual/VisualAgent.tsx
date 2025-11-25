/**
 * 模块 B: 智能视觉测试 Agent
 * 实时视觉监控 + AI 自动化测试
 */
import { useState, useEffect, useRef } from 'react'
import { visual } from '../../api/py'
import type { ScreenFrameResult, StressTestResult, AiCommandResult, VisualVerifyResult } from '../../api/py'

export default function VisualAgent() {
  const [activeSubTab, setActiveSubTab] = useState<'monitor' | 'stress' | 'ai'>('monitor')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 子标签页导航 */}
      <div className="glass-panel p-2 rounded-xl inline-flex gap-2">
        <button
          onClick={() => setActiveSubTab('monitor')}
          className={`tab-button ${activeSubTab === 'monitor' ? 'active from-green-500 to-green-600 text-white' : ''}`}
        >
          📹 实时监控
        </button>
        <button
          onClick={() => setActiveSubTab('stress')}
          className={`tab-button ${activeSubTab === 'stress' ? 'active from-orange-500 to-orange-600 text-white' : ''}`}
        >
          ⚡ 压力测试
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`tab-button ${activeSubTab === 'ai' ? 'active from-purple-500 to-purple-600 text-white' : ''}`}
        >
          🤖 AI 自动化
        </button>
      </div>

      {/* 内容区域 */}
      {activeSubTab === 'monitor' && <MonitorPanel />}
      {activeSubTab === 'stress' && <StressTestPanel />}
      {activeSubTab === 'ai' && <AiAutomationPanel />}
    </div>
  )
}

// ==================== 实时监控面板 ====================
function MonitorPanel() {
  const [isAppRunning, setIsAppRunning] = useState(false)
  const [screenFrame, setScreenFrame] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const launchApp = async () => {
    setLoading(true)
    try {
      const res = await visual.launchApp()
      if (res.success) {
        setIsAppRunning(true)
        alert(`✅ 应用已启动 (PID: ${res.pid})`)
      } else {
        alert(`❌ 启动失败: ${res.error}`)
      }
    } catch (error) {
      alert(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const closeApp = async () => {
    setLoading(true)
    try {
      const res = await visual.closeApp()
      if (res.success) {
        setIsAppRunning(false)
        setIsMonitoring(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        alert('✅ 应用已关闭')
      } else {
        alert(`❌ 关闭失败: ${res.error}`)
      }
    } catch (error) {
      alert(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleMonitoring = () => {
    if (isMonitoring) {
      // 停止监控
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsMonitoring(false)
    } else {
      // 开始监控
      setIsMonitoring(true)
      captureFrame() // 立即捕获一帧
      
      // 每 500ms 捕获一帧
      intervalRef.current = window.setInterval(() => {
        captureFrame()
      }, 500)
    }
  }

  const captureFrame = async () => {
    try {
      const res: ScreenFrameResult = await visual.getScreenFrame()
      if (res.success && res.image) {
        setScreenFrame(res.image)
      }
    } catch (error) {
      console.error('捕获帧失败:', error)
    }
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">实时视觉监控</h3>

      {/* 控制按钮 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={launchApp}
          disabled={loading || isAppRunning}
          className="btn btn-success disabled:opacity-50"
        >
          🚀 启动应用
        </button>
        <button
          onClick={closeApp}
          disabled={loading || !isAppRunning}
          className="btn btn-danger disabled:opacity-50"
        >
          ⏹️ 关闭应用
        </button>
        <button
          onClick={toggleMonitoring}
          disabled={!isAppRunning}
          className={`btn disabled:opacity-50 ${
            isMonitoring
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500'
              : 'btn-primary'
          }`}
        >
          {isMonitoring ? '⏸️ 停止监控' : '▶️ 开始监控'}
        </button>
        <button
          onClick={captureFrame}
          disabled={!isAppRunning}
          className="btn bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 focus:ring-purple-500"
        >
          📸 单帧截图
        </button>
      </div>

      {/* 视频监控区域 */}
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
        {screenFrame ? (
          <img 
            src={screenFrame} 
            alt="Screen Frame" 
            className="w-full h-auto"
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500 dark:text-gray-400">
              {isAppRunning ? '点击"开始监控"或"单帧截图"查看画面' : '请先启动应用'}
            </p>
          </div>
        )}
      </div>

      {isMonitoring && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            🟢 实时监控中... (500ms/帧)
          </p>
        </div>
      )}
    </div>
  )
}

// ==================== 压力测试面板 ====================
function StressTestPanel() {
  const [iterations, setIterations] = useState(10)
  const [result, setResult] = useState<StressTestResult | null>(null)
  const [running, setRunning] = useState(false)

  const runStressTest = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await visual.runStressTest(iterations)
      setResult(res)
    } catch (error) {
      console.error('压力测试错误:', error)
      setResult({ success: false, error: String(error) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">折线算法压力测试</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          迭代次数
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={iterations}
            onChange={(e) => setIterations(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
            min="1"
            max="100"
            className="input flex-1"
          />
          <button
            onClick={runStressTest}
            disabled={running}
            className="btn px-8 py-2 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 focus:ring-orange-500"
          >
            {running ? '⏳ 运行中...' : '⚡ 开始测试'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          将自动生成随机坐标并模拟拖拽连线操作
        </p>
      </div>

      {result && (
        <div className="space-y-4">
          {result.success ? (
            <>
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">总迭代</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.total_iterations}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">成功</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.successful}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">失败</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{result.failed}</p>
                </div>
              </div>

              {/* 日志 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-h-96 overflow-y-auto">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">测试日志</h4>
                <div className="space-y-1 font-mono text-xs">
                  {result.logs && result.logs.map((log, idx) => (
                    <div key={idx} className={
                      log.includes('成功') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-700 dark:text-red-400">❌ 错误: {result.error}</p>
            </div>
          )}
        </div>
      )}

      {!result && !running && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          设置迭代次数后点击"开始测试"
        </div>
      )}
    </div>
  )
}

// ==================== AI 自动化面板 ====================
function AiAutomationPanel() {
  const [apiKey, setApiKey] = useState('')
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  const [command, setCommand] = useState('')
  const [result, setResult] = useState<AiCommandResult | null>(null)
  const [loading, setLoading] = useState(false)

  const setApiKeyHandler = async () => {
    if (!apiKey.trim()) {
      alert('❌ 请输入 API Key')
      return
    }

    setLoading(true)
    try {
      const res = await visual.setApiKey(apiKey)
      if (res.success) {
        setIsApiKeySet(true)
        alert('✅ API Key 设置成功')
      } else {
        alert(`❌ 设置失败: ${res.error}`)
      }
    } catch (error) {
      alert(`❌ 错误: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const executeCommand = async () => {
    if (!command.trim()) {
      alert('❌ 请输入指令')
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const res = await visual.executeAiCommand(command)
      setResult(res)
    } catch (error) {
      console.error('执行指令错误:', error)
      setResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">AI 自然语言驱动测试</h3>

      {/* API Key 设置 */}
      {!isApiKeySet && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">🔑 设置 DeepSeek API Key</h4>
          <div className="flex gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="input flex-1"
            />
            <button
              onClick={setApiKeyHandler}
              disabled={loading}
              className="btn btn-primary disabled:opacity-50"
            >
              设置
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            获取 API Key: <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://platform.deepseek.com</a>
          </p>
        </div>
      )}

      {isApiKeySet && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">✅ API Key 已设置</p>
        </div>
      )}

      {/* AI 指令输入 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          自然语言指令
        </label>
        <div className="space-y-3">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="例如：画一个红色的矩形&#10;例如：创建三个节点并连接它们&#10;例如：在画布中心画一个圆形"
            rows={4}
            className="input"
          />
          <button
            onClick={executeCommand}
            disabled={loading || !isApiKeySet}
            className="btn w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 focus:ring-purple-500"
          >
            {loading ? '⏳ AI 处理中...' : '🤖 执行 AI 指令'}
          </button>
        </div>
      </div>

      {/* 示例指令 */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">💡 示例指令</h4>
        <div className="space-y-2 text-sm">
          <button
            onClick={() => setCommand('画一个红色的矩形')}
            className="block w-full text-left px-3 py-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            • 画一个红色的矩形
          </button>
          <button
            onClick={() => setCommand('创建三个节点并用连线连接它们')}
            className="block w-full text-left px-3 py-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            • 创建三个节点并用连线连接它们
          </button>
          <button
            onClick={() => setCommand('在画布中心画一个蓝色的圆形')}
            className="block w-full text-left px-3 py-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            • 在画布中心画一个蓝色的圆形
          </button>
        </div>
      </div>

      {/* AI 响应结果 */}
      {result && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">AI 响应</h4>
          {result.success ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">原始指令:</p>
                <p className="p-2 bg-white dark:bg-gray-800 rounded text-sm">{result.command}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">AI 理解:</p>
                <p className="p-2 bg-white dark:bg-gray-800 rounded text-sm whitespace-pre-wrap">
                  {result.ai_interpretation}
                </p>
              </div>
              {result.message && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <p className="text-sm text-blue-700 dark:text-blue-400">{result.message}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-700 dark:text-red-400">❌ 错误: {result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}

