# FlowTest Pro - 智能视觉驱动的流程图编辑器测试平台

> 基于 PyWebView 的混合桌面应用，集成静态分析、单元测试、视觉监控和 AI 自动化测试

## 🎯 项目概述

FlowTest Pro 是一个专门为 Qt 流程图编辑器设计的自动化测试平台，采用现代化的混合架构：

- **前端**: React + TypeScript + Vite + TailwindCSS
- **后端**: Python 3.10+ 
- **桥接**: PyWebView (JS Bridge RPC 通信)
- **AI引擎**: DeepSeek API

## 🏗️ 项目架构

```
qttester/
├── backend/                 # PyWebView 桥接层
│   ├── api.py              # 暴露给前端的 API 接口
│   ├── server.py           # 开发服务器管理
│   └── window.py           # 窗口配置
├── core/                    # 核心业务逻辑（纯 Python）
│   ├── services/
│   │   ├── quality_mgr.py  # 模块A: 质量管理服务
│   │   └── visual_agent.py # 模块B: 视觉测试代理
│   └── utils/              # 工具类
├── frontend/                # React 前端
│   └── src/
│       ├── modules/
│       │   ├── quality/    # 质量管理界面
│       │   └── visual/     # 视觉测试界面
│       └── api/
│           └── py.ts       # Python API 封装
└── run_dev.py              # 开发启动脚本
```

## ✨ 核心功能

### 模块 A: 全栈质量管理

#### 1. 静态代码分析
- 集成 **CppCheck** 进行 C++ 代码扫描
- 以表格形式展示错误、警告和建议
- 支持按严重性筛选问题

#### 2. 单元测试可视化
- 自动扫描 QTest 测试用例 (`tst_*.exe`)
- 一键运行指定测试
- 实时展示测试通过率和失败详情

#### 3. 代码度量统计
- 统计源文件数量（.cpp / .h）
- 计算代码行数、注释行数
- 可视化展示项目规模

### 模块 B: 智能视觉测试 Agent

#### 1. 实时视觉监控
- 一键启动/关闭被测应用 (`diagramscene.exe`)
- 帧轮询模式（500ms/帧）实时显示屏幕画面
- 支持单帧截图功能

#### 2. 折线算法压力测试
- 自动生成随机坐标
- 使用 PyAutoGUI 模拟拖拽连线操作
- 记录成功/失败日志
- 可配置迭代次数（1-100）

#### 3. AI 自然语言驱动测试
- 集成 DeepSeek AI 模型
- 支持自然语言指令转换为测试操作
- 示例指令：
  - "画一个红色的矩形"
  - "创建三个节点并用连线连接它们"
  - "在画布中心画一个蓝色的圆形"

#### 4. OpenCV 视觉验证
- 使用边缘检测验证绘图结果
- 自动判断图形元素是否存在

## 🚀 快速开始

### 环境要求

- **Python**: 3.10+
- **Node.js**: 18+
- **包管理器**: pnpm (推荐) 或 npm
- **操作系统**: Windows 10/11 (主要支持), macOS, Linux

> 💡 **Windows 用户**: 请查看 [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) 获取详细的 Windows 安装指南

### 安装步骤

#### 1. 安装 Python 依赖

**Windows 用户**：
```powershell
# 进入项目目录
cd qttester

# 升级 pip（推荐）
python -m pip install --upgrade pip

# 安装所有依赖（会自动安装 pywin32）
pip install -r requirements.txt
```

**macOS/Linux 用户**：
```bash
cd qttester
pip install -r requirements.txt
```

> ⚠️ **注意**: Windows 会自动安装 `pywin32` 以提升性能。如果安装失败，请参考 [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)

核心依赖包括：
- `pywebview>=5.0.0` - 桌面应用容器
- `opencv-python>=4.8.0` - 视觉处理
- `pyautogui>=0.9.54` - GUI 自动化
- `pygetwindow>=0.0.9` - 窗口管理
- `openai>=1.0.0` - DeepSeek API 客户端

#### 2. 安装前端依赖

```bash
cd frontend
pnpm install
```

#### 3. 安装 CppCheck（可选，用于静态分析）

**Windows**:
```bash
# 使用 Chocolatey
choco install cppcheck

# 或下载安装包
# https://github.com/danmar/cppcheck/releases
```

**Linux**:
```bash
sudo apt install cppcheck  # Ubuntu/Debian
sudo yum install cppcheck  # CentOS/RHEL
```

**macOS**:
```bash
brew install cppcheck
```

### 运行应用

#### 开发模式

```bash
cd qttester
python run_dev.py
```

这会自动：
1. 启动 Vite 开发服务器 (http://localhost:5173)
2. 启动 PyWebView 窗口并加载前端

#### 生产构建（待实现）

```bash
cd frontend
pnpm build

cd ..
python app.py
```

## 📖 使用指南

### 质量管理模块

#### 静态代码分析
1. 点击 **"质量管理"** 标签页
2. 选择 **"静态代码分析"** 子标签
3. 点击 **"开始扫描"** 按钮
4. 等待 CppCheck 完成分析
5. 查看问题列表，按严重性排序

#### 单元测试
1. 切换到 **"单元测试"** 子标签
2. 点击 **"扫描测试用例"** 查找所有 QTest 测试
3. 选择要运行的测试，点击 **"运行"** 按钮
4. 查看测试结果和通过率饼图

#### 代码度量
1. 切换到 **"代码度量"** 子标签
2. 点击 **"获取度量"** 按钮
3. 查看文件统计、代码行数等信息

### 视觉测试模块

#### 实时监控
1. 点击 **"视觉测试"** 标签页
2. 选择 **"实时监控"** 子标签
3. 点击 **"启动应用"** 启动流程图编辑器
4. 点击 **"开始监控"** 开启实时画面捕获
5. 使用 **"单帧截图"** 捕获当前画面

#### 压力测试
1. 切换到 **"压力测试"** 子标签
2. 设置迭代次数（建议 10-50）
3. 点击 **"开始测试"** 运行自动化拖拽测试
4. 查看成功率和详细日志

#### AI 自动化
1. 切换到 **"AI 自动化"** 子标签
2. 输入 DeepSeek API Key（获取地址: https://platform.deepseek.com）
3. 点击 **"设置"** 保存 API Key
4. 在文本框中输入自然语言指令
5. 点击 **"执行 AI 指令"** 查看 AI 理解结果

## 🔧 配置说明

### 修改被测应用路径

编辑 `core/services/visual_agent.py`:

```python
def __init__(self, target_exe_path: str = None, api_key: str = None):
    if target_exe_path:
        self.target_exe = Path(target_exe_path)
    else:
        # 修改此处路径
        self.target_exe = Path("你的应用路径/diagramscene.exe")
```

### 修改源码扫描路径

编辑 `core/services/quality_mgr.py`:

```python
def __init__(self, project_root: str = None):
    if project_root:
        self.project_root = Path(project_root)
    else:
        # 修改此处路径
        self.project_root = Path("你的源码路径")
```

## 🎨 技术亮点

### 1. 混合架构优势
- **前端舒适度**: 使用 React 现代化 UI 开发
- **后端能力**: 利用 Python 丰富的测试生态
- **无需 HTTP**: PyWebView JS Bridge 直接通信，降低延迟

### 2. 视觉测试创新
- **帧轮询模式**: 绕过 PyWebView 限制实现实时监控
- **AI 驱动**: 将自然语言转换为自动化操作
- **OpenCV 验证**: 自动化视觉结果校验

### 3. 质量管理集成
- **底层测试**: CppCheck 静态分析
- **中层测试**: QTest 单元测试可视化
- **上层测试**: 视觉 AI 端到端测试

## 📝 开发建议

### 扩展新功能

#### 添加后端 API
1. 在 `core/services/` 创建服务类
2. 在 `backend/api.py` 的 `API` 类中添加方法
3. 在 `frontend/src/api/py.ts` 添加类型和封装

#### 添加前端模块
1. 在 `frontend/src/modules/` 创建新目录
2. 创建 React 组件
3. 在 `App.tsx` 中引入并添加标签页

### 调试技巧

#### 查看 Python 日志
日志会输出到控制台，使用 `core/utils/logger.py`:
```python
from core.utils.logger import logger
logger.info("调试信息")
logger.error("错误信息")
```

#### 查看前端日志
在浏览器开发者工具中查看 Console（开发模式下可按 F12）

## 🚧 已知限制

1. **视觉监控延迟**: 帧轮询模式有 500ms 延迟
2. **AI 执行**: 目前 AI 只解析指令，实际执行逻辑需进一步开发
3. **CppCheck 依赖**: 需要系统安装 CppCheck 才能使用静态分析
4. **单元测试**: 仅支持 QTest 框架的测试用例

## 🔮 未来规划

- [ ] 实现 AI 指令的完整执行逻辑
- [ ] 添加测试报告导出功能（PDF/HTML）
- [ ] 支持更多静态分析工具（Clang-Tidy, PVS-Studio）
- [ ] 集成性能分析工具（Valgrind, perf）
- [ ] 添加测试用例录制回放功能
- [ ] 支持多窗口同时监控

## 📄 许可证

MIT License

## 👥 贡献者

- 开发者: SLA Team
- 架构设计: 基于 PyWebView 模板

## 🙏 致谢

- PyWebView - 跨平台桌面应用框架
- DeepSeek - 强大的 AI 语言模型
- OpenCV - 计算机视觉库
- Qt Framework - 被测应用框架

---

**享受智能化测试体验！** 🎉

