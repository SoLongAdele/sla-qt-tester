/**
 * 模块 A: 全栈质量管理
 * 静态代码分析 + 单元测试可视化
 */
import { useState } from 'react'
import { quality } from '../../api/py'
import type { StaticAnalysisResult, UnitTestScanResult, UnitTestResult, CodeMetrics } from '../../api/py'

export default function QualityManager() {
  const [activeSubTab, setActiveSubTab] = useState<'static' | 'unittest' | 'metrics'>('static')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 子标签页导航 */}
      <div className="glass-panel p-2 rounded-xl inline-flex gap-2">
        <button
          onClick={() => setActiveSubTab('static')}
          className={`tab-button ${activeSubTab === 'static' ? 'active from-blue-500 to-blue-600 text-white' : ''}`}
        >
          🔍 静态代码分析
        </button>
        <button
          onClick={() => setActiveSubTab('unittest')}
          className={`tab-button ${activeSubTab === 'unittest' ? 'active from-green-500 to-green-600 text-white' : ''}`}
        >
          🧪 单元测试
        </button>
        <button
          onClick={() => setActiveSubTab('metrics')}
          className={`tab-button ${activeSubTab === 'metrics' ? 'active from-purple-500 to-purple-600 text-white' : ''}`}
        >
          📊 代码度量
        </button>
      </div>

      {/* 内容区域 */}
      {activeSubTab === 'static' && <StaticAnalysisPanel />}
      {activeSubTab === 'unittest' && <UnitTestPanel />}
      {activeSubTab === 'metrics' && <CodeMetricsPanel />}
    </div>
  )
}

// ==================== 静态代码分析面板 ====================
function StaticAnalysisPanel() {
  const [result, setResult] = useState<StaticAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const res = await quality.runStaticAnalysis()
      setResult(res)
    } catch (error) {
      console.error('静态分析错误:', error)
      setResult({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">静态代码分析 (CppCheck)</h3>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="btn btn-primary disabled:opacity-50"
        >
          {loading ? '⏳ 分析中...' : '▶️ 开始扫描'}
        </button>
      </div>

      {result && (
        <>
          {result.success ? (
            <div className="space-y-4">
              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">总问题数</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.total_issues}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">扫描目录</p>
                  <p className="text-xs font-mono text-gray-800 dark:text-white truncate">{result.project_root}</p>
                </div>
              </div>

              {/* 问题列表 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">严重性</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">文件</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">行号</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">消息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.issues && result.issues.length > 0 ? (
                      result.issues.map((issue, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.severity === 'error' ? 'bg-red-100 text-red-700' :
                              issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {issue.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-800 dark:text-white">{issue.file}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{issue.line}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">{issue.message}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          ✅ 未发现问题
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-700 dark:text-red-400">❌ 错误: {result.error}</p>
            </div>
          )}
        </>
      )}

      {!result && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          点击"开始扫描"按钮运行静态代码分析
        </div>
      )}
    </div>
  )
}

// ==================== 单元测试面板 ====================
function UnitTestPanel() {
  const [tests, setTests] = useState<UnitTestScanResult | null>(null)
  const [testResult, setTestResult] = useState<UnitTestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)

  const scanTests = async () => {
    setLoading(true)
    try {
      const res = await quality.scanUnitTests()
      setTests(res)
    } catch (error) {
      console.error('扫描测试错误:', error)
      setTests({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const runTest = async (testPath: string) => {
    setRunning(true)
    try {
      const res = await quality.runUnitTest(testPath)
      setTestResult(res)
    } catch (error) {
      console.error('运行测试错误:', error)
      setTestResult({ success: false, error: String(error) })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">单元测试可视化 (QTest)</h3>
        <button
          onClick={scanTests}
          disabled={loading}
          className="btn btn-success disabled:opacity-50"
        >
          {loading ? '⏳ 扫描中...' : '🔍 扫描测试用例'}
        </button>
      </div>

      {/* 测试用例列表 */}
      {tests && tests.success && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            发现 <strong>{tests.total_tests}</strong> 个测试用例
          </p>
          <div className="space-y-2">
            {tests.tests && tests.tests.map((test, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{test.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{test.path}</p>
                </div>
                <button
                  onClick={() => runTest(test.path)}
                  disabled={running}
                  className="btn btn-primary text-sm disabled:opacity-50"
                >
                  ▶️ 运行
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 测试结果 */}
      {testResult && (
        <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">测试结果</h4>
          {testResult.success ? (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{testResult.passed}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">通过</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{testResult.failed}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">失败</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{testResult.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">总计</p>
                </div>
              </div>
              {testResult.cases && testResult.cases.length > 0 && (
                <div className="space-y-2">
                  {testResult.cases.map((testCase, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{testCase.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          testCase.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {testCase.status === 'passed' ? '✅ 通过' : '❌ 失败'}
                        </span>
                      </div>
                      {testCase.message && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{testCase.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-700 dark:text-red-400">❌ 错误: {testResult.error}</p>
          )}
        </div>
      )}

      {!tests && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          点击"扫描测试用例"按钮查找可用的单元测试
        </div>
      )}
    </div>
  )
}

// ==================== 代码度量面板 ====================
function CodeMetricsPanel() {
  const [metrics, setMetrics] = useState<CodeMetrics | null>(null)
  const [loading, setLoading] = useState(false)

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const res = await quality.getCodeMetrics()
      setMetrics(res)
    } catch (error) {
      console.error('获取度量错误:', error)
      setMetrics({ success: false, error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">代码度量统计</h3>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="btn px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 focus:ring-purple-500"
        >
          {loading ? '⏳ 计算中...' : '📊 获取度量'}
        </button>
      </div>

      {metrics && metrics.success && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard label="总文件数" value={metrics.total_files || 0} color="blue" />
          <MetricCard label="C++ 源文件" value={metrics.cpp_files || 0} color="green" />
          <MetricCard label="头文件" value={metrics.header_files || 0} color="purple" />
          <MetricCard label="总行数" value={metrics.total_lines || 0} color="indigo" />
          <MetricCard label="代码行数" value={metrics.code_lines || 0} color="cyan" />
          <MetricCard label="注释行数" value={metrics.comment_lines || 0} color="gray" />
        </div>
      )}

      {metrics && !metrics.success && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-700 dark:text-red-400">❌ 错误: {metrics.error}</p>
        </div>
      )}

      {!metrics && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          点击"获取度量"按钮统计代码信息
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    gray: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  }

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
      <p className="text-sm opacity-80 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

