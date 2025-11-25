# FlowTest Pro - 项目结构详解

> 完整的文件组织和模块说明

---

## 📁 目录树

```
qttester/
├── 📄 run_dev.py                    # 开发启动脚本
├── 📄 app.py                        # 生产启动脚本
├── 📄 requirements.txt              # Python 依赖
├── 📄 pyproject.toml                # 项目配置
├── 📄 PyWebViewApp.spec             # PyInstaller 配置
│
├── 📘 README.md                     # 原模板说明
├── 📘 README_FLOWTEST.md            # FlowTest Pro 完整文档 ⭐
├── 📘 QUICKSTART.md                 # 快速启动指南 ⭐
├── 📘 DEVELOPMENT_SUMMARY.md        # 开发总结 ⭐
├── 📘 DEMO_GUIDE.md                 # 演示指南 ⭐
├── 📘 PROJECT_STRUCTURE.md          # 本文件 ⭐
├── 📘 AGENTS.md                     # AI Agent 说明
│
├── 📂 backend/                      # PyWebView 桥接层
│   ├── __init__.py
│   ├── api.py                       # ⭐ API 接口定义（已扩展）
│   ├── server.py                    # 开发服务器管理
│   ├── window.py                    # 窗口配置
│   └── config.py                    # 配置常量
│
├── 📂 core/                         # 核心业务逻辑（纯 Python）
│   ├── __init__.py
│   ├── calculator.py                # 计算器示例
│   ├── user_service.py              # 用户管理示例
│   │
│   ├── 📂 services/                 # ⭐ 核心服务模块（新增）
│   │   ├── __init__.py
│   │   ├── quality_mgr.py          # ⭐ 模块 A: 质量管理服务
│   │   └── visual_agent.py         # ⭐ 模块 B: 视觉测试代理
│   │
│   └── 📂 utils/                    # 工具类
│       ├── __init__.py
│       └── logger.py                # 日志工具
│
└── 📂 frontend/                     # React 前端
    ├── package.json                 # 前端依赖
    ├── vite.config.ts               # Vite 配置
    ├── tsconfig.json                # TypeScript 配置
    ├── eslint.config.js             # ESLint 配置
    ├── index.html                   # HTML 入口
    │
    └── 📂 src/
        ├── main.tsx                 # 前端入口
        ├── App.tsx                  # ⭐ 主应用组件（已更新）
        ├── index.css                # 全局样式
        │
        ├── 📂 api/
        │   └── py.ts                # ⭐ Python API 封装（已扩展）
        │
        └── 📂 modules/              # ⭐ 功能模块（新增）
            ├── 📂 quality/          # 模块 A
            │   └── QualityManager.tsx  # ⭐ 质量管理界面
            │
            └── 📂 visual/           # 模块 B
                └── VisualAgent.tsx     # ⭐ 视觉测试界面
```

**图例**：
- ⭐ = FlowTest Pro 新增或修改的文件
- 📄 = 脚本文件
- 📘 = 文档文件
- 📂 = 目录

---

## 🔍 核心文件详解

### 1. 后端核心文件

#### `backend/api.py` (已扩展)
**作用**: 定义所有暴露给前端的 Python API

**新增内容**:
```python
class API:
    def __init__(self):
        self.quality_manager = QualityManager()    # ⭐ 新增
        self.visual_agent = VisualAgent()          # ⭐ 新增
    
    # ==================== 模块 A: 质量管理 API ====================
    def run_static_analysis(self) -> Dict[str, Any]: ...
    def scan_unit_tests(self) -> Dict[str, Any]: ...
    def run_unit_test(self, test_path: str) -> Dict[str, Any]: ...
    def get_code_metrics(self) -> Dict[str, Any]: ...
    
    # ==================== 模块 B: 视觉测试 API ====================
    def launch_target_app(self) -> Dict[str, Any]: ...
    def get_screen_frame(self) -> Dict[str, Any]: ...
    def run_stress_test(self, iterations: int) -> Dict[str, Any]: ...
    def execute_ai_command(self, command: str) -> Dict[str, Any]: ...
    # ... 更多接口
```

**关键点**:
- 所有方法自动通过 JS Bridge 暴露为 `window.pywebview.api.xxx`
- 统一错误处理和日志记录
- 类型提示（Type Hints）

---

#### `core/services/quality_mgr.py` (新增)
**作用**: 实现质量管理核心逻辑

**主要类**:
```python
class QualityManager:
    def __init__(self, project_root: str = None)
    
    # 静态代码分析
    def run_static_analysis(self) -> Dict[str, Any]
    def _parse_cppcheck_xml(self, xml_str: str) -> List[Dict]
    
    # 单元测试
    def scan_unit_tests(self) -> Dict[str, Any]
    def run_unit_test(self, test_path: str) -> Dict[str, Any]
    def _parse_qtest_xml(self, xml_str: str) -> Dict[str, Any]
    
    # 代码度量
    def get_code_metrics(self) -> Dict[str, Any]
```

**依赖**:
- `subprocess` - 调用 CppCheck 和 QTest
- `xml.etree.ElementTree` - 解析 XML 结果
- `pathlib` - 文件路径处理

**配置点**:
- 第 31 行：项目源码路径
- 第 135 行：构建目录路径

---

#### `core/services/visual_agent.py` (新增)
**作用**: 实现视觉测试核心逻辑

**主要类**:
```python
class VisualAgent:
    def __init__(self, target_exe_path: str = None, api_key: str = None)
    
    # 应用控制
    def launch_target_app(self) -> Dict[str, Any]
    def close_target_app(self) -> Dict[str, Any]
    def focus_target_window(self, window_title: str = None) -> Dict[str, Any]
    
    # 视觉监控
    def get_screen_frame(self, region: Tuple = None) -> Dict[str, Any]
    
    # 自动化测试
    def run_stress_test(self, iterations: int = 10) -> Dict[str, Any]
    def execute_ai_command(self, natural_language: str) -> Dict[str, Any]
    def verify_visual_result(self, expected_pattern: str) -> Dict[str, Any]
```

**依赖**:
- `pyautogui` - GUI 自动化
- `opencv-python (cv2)` - 图像处理
- `pygetwindow` - 窗口管理
- `openai` - DeepSeek API

**配置点**:
- 第 35 行：被测应用路径
- DeepSeek API Key 运行时设置

---

### 2. 前端核心文件

#### `frontend/src/api/py.ts` (已扩展)
**作用**: 封装所有 Python API 调用，提供类型安全

**新增内容**:
```typescript
// ==================== 类型定义 ====================
export interface CodeIssue { ... }
export interface StaticAnalysisResult { ... }
export interface UnitTestResult { ... }
// ... 15+ 接口定义

// ==================== API 封装 ====================
export const quality = {
  runStaticAnalysis: () => callPy<StaticAnalysisResult>('run_static_analysis'),
  scanUnitTests: () => callPy<UnitTestScanResult>('scan_unit_tests'),
  runUnitTest: (testPath: string) => callPy<UnitTestResult>('run_unit_test', testPath),
  getCodeMetrics: () => callPy<CodeMetrics>('get_code_metrics'),
}

export const visual = {
  launchApp: () => callPy<AppLaunchResult>('launch_target_app'),
  getScreenFrame: () => callPy<ScreenFrameResult>('get_screen_frame'),
  runStressTest: (iterations: number) => callPy<StressTestResult>('run_stress_test', iterations),
  executeAiCommand: (command: string) => callPy<AiCommandResult>('execute_ai_command', command),
  // ... 更多方法
}
```

**关键点**:
- TypeScript 类型安全
- Promise-based 异步调用
- 统一错误处理

---

#### `frontend/src/App.tsx` (已更新)
**作用**: 主应用组件，路由和布局

**修改内容**:
```typescript
import QualityManager from './modules/quality/QualityManager'
import VisualAgent from './modules/visual/VisualAgent'

function App() {
  const [activeTab, setActiveTab] = useState<'quality' | 'visual' | ...>('quality')
  
  return (
    <div>
      {/* 5 标签页导航 */}
      <nav>...</nav>
      
      {/* 内容区域 */}
      {activeTab === 'quality' && <QualityManager />}
      {activeTab === 'visual' && <VisualAgent />}
      {/* ... 其他标签页 */}
    </div>
  )
}
```

**关键点**:
- TailwindCSS 样式
- 暗色模式支持
- 响应式布局

---

#### `frontend/src/modules/quality/QualityManager.tsx` (新增)
**作用**: 质量管理模块界面

**组件结构**:
```typescript
QualityManager (主组件)
├── StaticAnalysisPanel  (静态分析面板)
│   ├── 扫描按钮
│   ├── 统计卡片
│   └── 问题列表表格
│
├── UnitTestPanel        (单元测试面板)
│   ├── 扫描按钮
│   ├── 测试用例列表
│   └── 测试结果展示
│
└── CodeMetricsPanel     (代码度量面板)
    ├── 获取按钮
    └── 6 个度量卡片
```

**代码量**: ~300 行

---

#### `frontend/src/modules/visual/VisualAgent.tsx` (新增)
**作用**: 视觉测试模块界面

**组件结构**:
```typescript
VisualAgent (主组件)
├── MonitorPanel         (实时监控面板)
│   ├── 应用控制按钮（启动/关闭/聚焦）
│   ├── 监控控制按钮（开始/停止/截图）
│   └── 实时画面显示区
│
├── StressTestPanel      (压力测试面板)
│   ├── 迭代次数输入
│   ├── 开始测试按钮
│   ├── 统计卡片（成功/失败）
│   └── 详细日志列表
│
└── AiAutomationPanel    (AI 自动化面板)
    ├── API Key 设置
    ├── 指令输入框
    ├── 示例指令按钮
    └── AI 响应展示
```

**代码量**: ~400 行

**关键功能**:
- 帧轮询（`setInterval` 500ms）
- Base64 图片显示
- 实时日志更新

---

## 📊 代码统计

### 按文件类型

| 类型       | 文件数 | 代码行数 |
|-----------|-------|---------|
| Python    | 5     | ~800    |
| TypeScript| 4     | ~700    |
| Markdown  | 6     | ~1500   |
| **总计**  | **15**| **3000+**|

### 按功能模块

| 模块              | 后端代码 | 前端代码 |
|-------------------|---------|---------|
| 质量管理          | ~400    | ~300    |
| 视觉测试          | ~400    | ~400    |
| API 层            | ~120    | ~200    |
| **总计**          | **~920**| **~900**|

---

## 🔗 模块依赖关系

```
┌─────────────────────────────────────────────┐
│            前端 (React Components)           │
│  QualityManager.tsx   VisualAgent.tsx       │
└─────────────┬───────────────────────────────┘
              │
              ↓ (调用)
┌─────────────────────────────────────────────┐
│         前端 API 封装 (py.ts)                │
│  quality.xxx()   visual.xxx()               │
└─────────────┬───────────────────────────────┘
              │
              ↓ (JS Bridge RPC)
┌─────────────────────────────────────────────┐
│           后端 API 层 (api.py)               │
│  API.run_static_analysis()                  │
│  API.launch_target_app()                    │
└─────────────┬───────────────────────────────┘
              │
              ↓ (调用)
┌─────────────────────────────────────────────┐
│      后端服务层 (core/services/)             │
│  QualityManager   VisualAgent               │
└─────────────┬───────────────────────────────┘
              │
              ↓ (调用)
┌─────────────────────────────────────────────┐
│       第三方工具和库                          │
│  CppCheck, QTest, PyAutoGUI, OpenCV, DeepSeek│
└─────────────────────────────────────────────┘
```

---

## 🛠️ 配置文件说明

### `requirements.txt`
Python 依赖包列表：
- **PyWebView**: 桌面容器
- **OpenCV**: 图像处理
- **PyAutoGUI**: GUI 自动化
- **PyGetWindow**: 窗口管理
- **OpenAI**: DeepSeek SDK
- **NumPy**: 数值计算

### `frontend/package.json`
前端依赖包列表：
- **React**: UI 框架
- **TypeScript**: 类型系统
- **Vite**: 构建工具
- **TailwindCSS**: 样式框架

### `vite.config.ts`
前端构建配置：
```typescript
export default defineConfig({
  server: { port: 9033 },  // 开发服务器端口
  plugins: [react()],
})
```

---

## 📝 开发规范

### 命名约定
- **Python**:
  - 文件名: `snake_case.py`
  - 类名: `PascalCase`
  - 方法名: `snake_case`
  - 常量: `UPPER_CASE`

- **TypeScript**:
  - 文件名: `PascalCase.tsx`
  - 组件名: `PascalCase`
  - 函数名: `camelCase`
  - 接口名: `PascalCase`

### 代码组织
- 每个模块独立目录
- 相关功能放在一起
- 公共工具放在 `utils/`
- 类型定义统一管理

### 注释规范
- Python: Docstring (Google Style)
- TypeScript: JSDoc

---

## 🚀 扩展指南

### 添加新的测试功能

#### 1. 后端服务
在 `core/services/` 创建新服务类：
```python
class NewTestService:
    def __init__(self): ...
    def run_test(self) -> Dict[str, Any]: ...
```

#### 2. API 层
在 `backend/api.py` 添加接口：
```python
class API:
    def __init__(self):
        self.new_service = NewTestService()
    
    def new_test_method(self) -> Dict[str, Any]:
        return self.new_service.run_test()
```

#### 3. 前端 API 封装
在 `frontend/src/api/py.ts` 添加：
```typescript
export interface NewTestResult extends ApiResult { ... }

export const newTest = {
  runTest: () => callPy<NewTestResult>('new_test_method'),
}
```

#### 4. 前端界面
在 `frontend/src/modules/` 创建组件：
```typescript
export default function NewTestModule() {
  // 组件逻辑
}
```

#### 5. 集成到主界面
在 `App.tsx` 添加标签页。

---

## 📚 参考资源

### 官方文档
- PyWebView: https://pywebview.flowrl.com
- React: https://react.dev
- Vite: https://vitejs.dev
- TailwindCSS: https://tailwindcss.com

### 相关工具
- CppCheck: https://cppcheck.sourceforge.io
- Qt Test: https://doc.qt.io/qt-6/qtest.html
- DeepSeek: https://platform.deepseek.com

---

**项目结构清晰，易于理解和扩展！** 🎉

