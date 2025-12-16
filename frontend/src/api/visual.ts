/**
 * 视觉测试 API
 * 封装视觉测试相关的 Python 调用
 */

// 扩展 Window 类型
declare global {
  interface Window {
    pywebview?: {
      api: {
        launch_target_app: () => Promise<AppLaunchResult>
        close_target_app: () => Promise<ApiResult>
        get_screen_frame: () => Promise<ScreenFrameResult>
        get_window_info: () => Promise<WindowInfoResult>
        focus_target_window: (windowTitle?: string) => Promise<ApiResult>
        run_stress_test: (iterations: number) => Promise<StressTestResult>
        execute_ai_command: (command: string) => Promise<AiCommandResult>
        verify_visual_result: (pattern: string) => Promise<VisualVerifyResult>
        set_ai_api_key: (apiKey: string, baseUrl?: string) => Promise<ApiResult>
      }
    }
  }
}

// 类型定义
export interface ApiResult {
  success: boolean
  error?: string
  message?: string
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

// ==================== 视觉测试 API ====================

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
  
  setApiKey: (apiKey: string, baseUrl?: string) => 
    callPy<ApiResult>('set_ai_api_key', apiKey, baseUrl),
}

export default visual

