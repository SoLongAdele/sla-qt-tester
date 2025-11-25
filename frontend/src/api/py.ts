/**
 * PyWebView Bridge API
 * 封装所有 Python 调用
 */

// 扩展 Window 类型
declare global {
  interface Window {
    pywebview?: {
      api: {
        // 计算器 API
        add: (a: number, b: number) => Promise<number>
        subtract: (a: number, b: number) => Promise<number>
        multiply: (a: number, b: number) => Promise<number>
        divide: (a: number, b: number) => Promise<number | { error: string }>
        power: (a: number, b: number) => Promise<number>

        // 用户管理 API
        create_user: (name: string, email: string) => Promise<User | { error: string }>
        get_user: (userId: number) => Promise<User | { error: string }>
        list_users: () => Promise<User[]>
        delete_user: (userId: number) => Promise<{ success: boolean } | { error: string }>

        // 系统 API
        get_version: () => Promise<string>
        ping: () => Promise<string>
        get_system_info: () => Promise<SystemInfo>

        // 模块 A: 质量管理 API
        run_static_analysis: () => Promise<StaticAnalysisResult>
        scan_unit_tests: () => Promise<UnitTestScanResult>
        run_unit_test: (testPath: string) => Promise<UnitTestResult>
        get_code_metrics: () => Promise<CodeMetrics>

        // 模块 B: 视觉测试 API
        launch_target_app: () => Promise<AppLaunchResult>
        close_target_app: () => Promise<ApiResult>
        get_screen_frame: () => Promise<ScreenFrameResult>
        get_window_info: () => Promise<WindowInfoResult>
        focus_target_window: (windowTitle?: string) => Promise<ApiResult>
        run_stress_test: (iterations: number) => Promise<StressTestResult>
        execute_ai_command: (command: string) => Promise<AiCommandResult>
        verify_visual_result: (pattern: string) => Promise<VisualVerifyResult>
        set_deepseek_api_key: (apiKey: string) => Promise<ApiResult>
      }
    }
  }
}

// 类型定义
export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface SystemInfo {
  platform: string
  platform_version: string
  python_version: string
  machine: string
}

// ==================== 测试平台类型定义 ====================

export interface ApiResult {
  success: boolean
  error?: string
  message?: string
}

export interface CodeIssue {
  id: string
  severity: string
  message: string
  verbose: string
  file: string
  line: number
  column: number
}

export interface StaticAnalysisResult extends ApiResult {
  total_issues?: number
  issues?: CodeIssue[]
  project_root?: string
}

export interface TestCase {
  name: string
  path: string
  type: string
}

export interface UnitTestScanResult extends ApiResult {
  total_tests?: number
  tests?: TestCase[]
}

export interface TestCaseDetail {
  name: string
  status: string
  message: string
}

export interface UnitTestResult extends ApiResult {
  test_path?: string
  total?: number
  passed?: number
  failed?: number
  skipped?: number
  cases?: TestCaseDetail[]
}

export interface CodeMetrics extends ApiResult {
  total_files?: number
  total_lines?: number
  cpp_files?: number
  header_files?: number
  code_lines?: number
  comment_lines?: number
}

export interface AppLaunchResult extends ApiResult {
  pid?: number
  path?: string
}

export interface ScreenFrameResult extends ApiResult {
  image?: string
  width?: number
  height?: number
}

export interface WindowInfoResult extends ApiResult {
  all_windows?: string[]
  target_windows?: string[]
}

export interface StressTestResult extends ApiResult {
  total_iterations?: number
  successful?: number
  failed?: number
  logs?: string[]
}

export interface AiCommandResult extends ApiResult {
  command?: string
  ai_interpretation?: string
  executed?: boolean
  message?: string
}

export interface VisualVerifyResult extends ApiResult {
  pattern?: string
  edge_ratio?: number
  verified?: boolean
  message?: string
}

/**
 * 通用 Python 调用函数
 */
async function callPy<T>(fn: string, ...args: unknown[]): Promise<T> {
  if (!window.pywebview) {
    throw new Error('PyWebView API 未就绪')
  }

  const api = window.pywebview.api as unknown as Record<string, (...args: unknown[]) => Promise<T>>
  if (!api[fn]) {
    throw new Error(`Python 方法不存在: ${fn}`)
  }

  return await api[fn](...args)
}

// ==================== 计算器 API ====================

export const calculator = {
  add: (a: number, b: number) => callPy<number>('add', a, b),
  subtract: (a: number, b: number) => callPy<number>('subtract', a, b),
  multiply: (a: number, b: number) => callPy<number>('multiply', a, b),
  divide: (a: number, b: number) => callPy<number | { error: string }>('divide', a, b),
  power: (a: number, b: number) => callPy<number>('power', a, b),
}

// ==================== 用户管理 API ====================

export const users = {
  create: (name: string, email: string) => 
    callPy<User | { error: string }>('create_user', name, email),
  
  get: (userId: number) => 
    callPy<User | { error: string }>('get_user', userId),
  
  list: () => 
    callPy<User[]>('list_users'),
  
  delete: (userId: number) => 
    callPy<{ success: boolean } | { error: string }>('delete_user', userId),
}

// ==================== 系统 API ====================

export const system = {
  version: () => callPy<string>('get_version'),
  ping: () => callPy<string>('ping'),
  info: () => callPy<SystemInfo>('get_system_info'),
}

// ==================== 模块 A: 质量管理 API ====================

export const quality = {
  runStaticAnalysis: () => 
    callPy<StaticAnalysisResult>('run_static_analysis'),
  
  scanUnitTests: () => 
    callPy<UnitTestScanResult>('scan_unit_tests'),
  
  runUnitTest: (testPath: string) => 
    callPy<UnitTestResult>('run_unit_test', testPath),
  
  getCodeMetrics: () => 
    callPy<CodeMetrics>('get_code_metrics'),
}

// ==================== 模块 B: 视觉测试 API ====================

export const visual = {
  launchApp: () => 
    callPy<AppLaunchResult>('launch_target_app'),
  
  closeApp: () => 
    callPy<ApiResult>('close_target_app'),
  
  getScreenFrame: () => 
    callPy<ScreenFrameResult>('get_screen_frame'),
  
  getWindowInfo: () => 
    callPy<WindowInfoResult>('get_window_info'),
  
  focusWindow: (windowTitle?: string) => 
    callPy<ApiResult>('focus_target_window', windowTitle),
  
  runStressTest: (iterations: number) => 
    callPy<StressTestResult>('run_stress_test', iterations),
  
  executeAiCommand: (command: string) => 
    callPy<AiCommandResult>('execute_ai_command', command),
  
  verifyVisual: (pattern: string) => 
    callPy<VisualVerifyResult>('verify_visual_result', pattern),
  
  setApiKey: (apiKey: string) => 
    callPy<ApiResult>('set_deepseek_api_key', apiKey),
}

// 默认导出
export default {
  calculator,
  users,
  system,
  quality,
  visual,
}
