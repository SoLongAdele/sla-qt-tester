/**
 * 视觉测试面板组件
 * 包含实时监控、压力测试和AI自动化三个子功能
 */
import { useState, useEffect, useRef } from 'react'
import { visual } from '../api/visual'
import type { ScreenFrameResult, StressTestResult, AiCommandResult, VisualVerifyResult } from '../api/visual'

type SubTab = 'monitor' | 'stress' | 'ai'

export function VisualTestPanel() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('monitor')

  return (
    <div className="space-y-4">
      {/* 子标签页导航 */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
        <button
          onClick={() => setActiveSubTab('monitor')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            activeSubTab === 'monitor'
              ? 'bg-green-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          📹 实时监控
        </button>
        <button
          onClick={() => setActiveSubTab('stress')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            activeSubTab === 'stress'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          ⚡ 压力测试
        </button>
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
            activeSubTab === 'ai'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          🤖 AI 自动化
        </button>
      </div>

      {/* 内容区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        {activeSubTab === 'monitor' && <MonitorPanel />}
        {activeSubTab === 'stress' && <StressTestPanel />}
        {activeSubTab === 'ai' && <AiAutomationPanel />}
      </div>
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">实时视觉监控</h3>

      {/* 控制按钮 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={launchApp}
          disabled={loading || isAppRunning}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          🚀 启动应用
        </button>
        <button
          onClick={closeApp}
          disabled={loading || !isAppRunning}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          ⏹️ 关闭应用
        </button>
        <button
          onClick={toggleMonitoring}
          disabled={!isAppRunning}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isMonitoring
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isMonitoring ? '⏸️ 停止监控' : '▶️ 开始监控'}
        </button>
        <button
          onClick={captureFrame}
          disabled={!isAppRunning}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          📸 单帧截图
        </button>
      </div>

      {/* 视频监控区域 */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
        {screenFrame ? (
          <img 
            src={screenFrame} 
            alt="屏幕监控" 
            className="w-full h-auto"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">点击"启动应用"开始监控</p>
            </div>
          </div>
        )}
      </div>
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">折线算法压力测试</h3>

      <div className="space-y-3">
        <div>
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
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={runStressTest}
              disabled={running}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {running ? '⏳ 运行中...' : '⚡ 开始测试'}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            将自动生成随机坐标并模拟拖拽连线操作（范围：1-100）
          </p>
        </div>

        {result && (
          <div className="space-y-3">
            {/* 结果统计 */}
            <div className={`p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <h4 className={`font-semibold mb-2 ${
                result.success
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {result.success ? '✅ 测试完成' : '❌ 测试失败'}
              </h4>
              {result.success && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">总数：</span>
                    <span className="font-bold text-gray-900 dark:text-white">{result.total_iterations}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">成功：</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{result.successful}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">失败：</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{result.failed}</span>
                  </div>
                </div>
              )}
              {result.error && (
                <p className="text-sm text-red-800 dark:text-red-200">{result.error}</p>
              )}
            </div>

            {/* 测试日志 */}
            {result.logs && result.logs.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">测试日志</h4>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {result.logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-xs font-mono text-gray-700 dark:text-gray-300 py-1"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== AI 自动化面板 ====================
function AiAutomationPanel() {
  const [apiKey, setApiKey] = useState('')
  const [command, setCommand] = useState('')
  const [pattern, setPattern] = useState('line')
  const [aiResult, setAiResult] = useState<AiCommandResult | null>(null)
  const [verifyResult, setVerifyResult] = useState<VisualVerifyResult | null>(null)
  const [loading, setLoading] = useState(false)

  const setApiKeyHandler = async () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key')
      return
    }
    setLoading(true)
    try {
      const res = await visual.setApiKey(apiKey.trim())
      if (res.success) {
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
      alert('请输入测试指令')
      return
    }
    setLoading(true)
    setAiResult(null)
    try {
      const res = await visual.executeAiCommand(command.trim())
      setAiResult(res)
    } catch (error) {
      console.error('执行指令错误:', error)
      setAiResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const verifyVisual = async () => {
    setLoading(true)
    setVerifyResult(null)
    try {
      const res = await visual.verifyVisual(pattern)
      setVerifyResult(res)
    } catch (error) {
      console.error('视觉验证错误:', error)
      setVerifyResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI 自动化测试</h3>

      {/* API Key 设置 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">讯飞星火 API Key</h4>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入讯飞星火 API Key"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={setApiKeyHandler}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            设置
          </button>
        </div>
      </div>

      {/* AI 指令执行 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            自然语言测试指令
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='例如："画一个红色的矩形"'
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={executeCommand}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              执行
            </button>
          </div>
        </div>

        {aiResult && (
          <div className={`p-4 rounded-lg border ${
            aiResult.success
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <h4 className={`font-semibold mb-2 text-sm ${
              aiResult.success
                ? 'text-purple-900 dark:text-purple-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              {aiResult.success ? '🤖 AI 响应' : '❌ 执行失败'}
            </h4>
            {aiResult.ai_interpretation && (
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-gray-800 p-2 rounded">
                {aiResult.ai_interpretation}
              </pre>
            )}
            {aiResult.message && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{aiResult.message}</p>
            )}
            {aiResult.error && (
              <p className="text-sm text-red-800 dark:text-red-200">{aiResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* 视觉验证 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            视觉结果验证
          </label>
          <div className="flex gap-2">
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="line">线条</option>
              <option value="rectangle">矩形</option>
              <option value="circle">圆形</option>
            </select>
            <button
              onClick={verifyVisual}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              验证
            </button>
          </div>
        </div>

        {verifyResult && (
          <div className={`p-4 rounded-lg border ${
            verifyResult.success && verifyResult.verified
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <h4 className={`font-semibold mb-2 text-sm ${
              verifyResult.success && verifyResult.verified
                ? 'text-green-900 dark:text-green-100'
                : 'text-yellow-900 dark:text-yellow-100'
            }`}>
              {verifyResult.success && verifyResult.verified ? '✅ 验证通过' : '⚠️ 验证结果'}
            </h4>
            <div className="text-sm space-y-1">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">边缘比例：</span>{verifyResult.edge_ratio}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">消息：</span>{verifyResult.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

