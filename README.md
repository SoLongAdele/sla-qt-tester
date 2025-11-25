# FlowTest Pro

> 本应用开发中！尚未完成所有功能，无法用于正式环境

🚀 **FlowTest Pro** - Qt 可视化测试工具，提供代码质量管理和视觉测试功能

## 🚀 快速开始

### 1️⃣ 安装依赖

#### Python 依赖

```bash
# 进入项目目录
cd qttester

# 安装 Python 依赖（会自动安装 pywin32）
pip install -r requirements.txt
```

**Windows 用户特别注意**：
- ✅ `pywin32` 会自动安装（已在 requirements.txt 中配置）
- ✅ 如果遇到权限问题，使用管理员权限运行命令提示符
- ✅ 如果 pip 安装失败，尝试：`python -m pip install -r requirements.txt`
- ✅ 确保使用 Python 3.10 或更高版本

#### 前端依赖

```bash
# 如果没有安装 pnpm，先安装它
npm install -g pnpm

# 或者使用 npm（如果 pnpm 安装失败）
cd frontend
npm install
cd ..

# 推荐使用 pnpm（更快）
cd frontend
pnpm install
cd ..
```

### 2️⃣ 启动应用

```bash
# 在 qttester 目录下运行
python run_dev.py
```

应用启动后会自动：
- ✅ 启动 Vite 前端开发服务器（默认端口 5173）
- ✅ 等待前端就绪（最多 30 秒）
- ✅ 启动 PyWebView 桌面窗口
- ✅ 支持前端热更新（HMR）

关闭应用时会自动停止 Vite 服务器并清理所有子进程。

### 3️⃣ 开始测试

应用启动后，你会看到 2 个核心测试模块：

#### 📋 **质量管理** (推荐首先使用)
- **静态代码分析**: 点击"开始扫描"检查 C++ 代码质量
- **单元测试**: 点击"扫描测试用例"查找并运行 QTest 测试
- **代码度量**: 点击"获取度量"查看项目统计信息

#### 🎯 **视觉测试** (AI 功能需要 API Key)
- **实时监控**: 
  1. 点击"启动应用"打开流程图编辑器
  2. 点击"开始监控"查看实时画面
- **压力测试**: 设置迭代次数后点击"开始测试"
- **AI 自动化**: 输入 DeepSeek API Key 后使用自然语言控制测试

### 4️⃣ 生产构建

```bash
cd frontend && pnpm build && cd ..
python app.py
```

## 🎨 界面概览

FlowTest Pro 采用现代化的 UI 设计，参考了 devtools-main 的设计理念。

### 界面布局

- **侧边导航栏（左侧固定）**：包含质量管理、视觉测试、设置等功能入口，以及主题切换按钮
- **顶部栏**：显示应用 Logo、名称和运行状态
- **主内容区**：根据侧边栏选择显示不同的功能模块
- **底部状态栏**：显示应用信息和版权信息

### 功能模块

#### 1. 质量管理模块

- **静态代码分析**：扫描 C++ 代码，检查代码质量问题
- **单元测试**：扫描并运行 QTest 测试用例
- **代码度量**：获取项目统计信息（文件数、行数等）

#### 2. 视觉测试模块

- **实时监控**：启动被测应用并实时捕获画面
- **压力测试**：设置迭代次数进行压力测试
- **AI 自动化**：使用自然语言指令控制测试（需要 DeepSeek API Key）

#### 3. 设置模块

查看应用版本信息、技术栈信息和关于说明。

### 深色模式

点击侧边栏底部的 **☀️/🌙** 图标在浅色和深色模式之间切换。

## 📁 项目结构

```
qttester/
├── run_dev.py              # 👈 启动脚本
├── app.py                  # 生产入口
├── backend/                # PyWebView + JS Bridge
│   ├── api.py              # API 接口定义
│   ├── config.py           # 配置管理
│   └── server.py           # 服务器启动
├── core/                   # 核心业务逻辑（纯 Python）
│   ├── services/           # 核心服务
│   │   ├── quality_mgr.py  # 质量管理
│   │   └── visual_agent.py # 视觉测试
│   └── utils/              # 工具函数
└── frontend/               # Vite + React 前端
    └── src/
        ├── App.tsx         # 主界面
        ├── modules/        # 功能模块
        │   ├── quality/    # 质量管理界面
        │   └── visual/     # 视觉测试界面
        └── api/py.ts       # Python API 封装
```

## ❓ 常见问题

### Q1: Windows 安装依赖失败？

**A**: 常见问题和解决方案：

1. **pywin32 安装失败**
   ```bash
   # 尝试使用管理员权限
   python -m pip install --upgrade pip
   python -m pip install pywin32
   ```

2. **pnpm 命令不存在**
   ```bash
   # 安装 pnpm
   npm install -g pnpm
   
   # 或者使用 npm 代替
   cd frontend
   npm install
   ```

3. **权限错误**
   - 右键命令提示符 → "以管理员身份运行"
   - 或者在 PowerShell 中运行

4. **Python 版本问题**
   - 确保使用 Python 3.10 或更高版本
   - 检查：`python --version`

### Q2: 找不到 CppCheck？

**A**: 静态分析功能需要安装 CppCheck:

**Windows**（推荐使用 Chocolatey）:
```bash
# 如果已安装 Chocolatey
choco install cppcheck

# 或者下载安装包
# https://github.com/danmar/cppcheck/releases
# 下载 .msi 安装包，安装后添加到系统 PATH
```

**其他平台**:
```bash
# Ubuntu/Debian
sudo apt install cppcheck

# macOS
brew install cppcheck
```

### Q3: 视觉测试启动失败？

**A**: 检查以下几点：
1. 确认 `targetcpp/runableexe/FreeCharts/diagramscene.exe` 路径正确
2. 确认安装了 `pyautogui`、`opencv-python` 等视觉库
3. 查看控制台错误日志

### Q4: AI 功能如何使用？

**A**: 
1. 访问 https://platform.deepseek.com 注册并获取 API Key
2. 在"AI 自动化"标签页输入 API Key
3. 输入自然语言指令，如"画一个红色的矩形"
4. 点击"执行 AI 指令"

### Q5: 如何修改测试目标路径？

**A**: 编辑以下文件：
- 被测应用路径: `core/services/visual_agent.py` 第 35 行
- 源码扫描路径: `core/services/quality_mgr.py` 第 31 行

### Q6: 为什么看不到玻璃态效果？

**A**: 请确保浏览器支持 `backdrop-filter` CSS 属性。最新版本的 Chrome、Firefox、Safari 都支持。

## 📋 测试流程建议

### 阶段 1: 代码质量检查（5分钟）
1. 打开"质量管理" → "静态代码分析"
2. 点击"开始扫描"，等待分析完成
3. 查看问题列表，记录错误和警告

### 阶段 2: 单元测试验证（3分钟）
1. 切换到"单元测试"子标签
2. 点击"扫描测试用例"
3. 逐个运行测试，查看通过率

### 阶段 3: 视觉监控测试（5分钟）
1. 打开"视觉测试" → "实时监控"
2. 启动应用并开始监控
3. 手动操作应用，观察实时画面

### 阶段 4: 压力测试（可选，10分钟）
1. 切换到"压力测试"子标签
2. 设置迭代次数为 20
3. 运行测试，查看成功率

### 阶段 5: AI 测试（可选，需要 API Key）
1. 切换到"AI 自动化"子标签
2. 设置 API Key
3. 尝试示例指令

## 🔧 技术栈

**前端**: Vite + React 19 + TypeScript + TailwindCSS 4  
**后端**: Python 3.10+ + PyWebView 5.0+

## 🎨 自定义开发

### 添加新 API

1. `core/` 实现业务逻辑
2. `backend/api.py` 暴露方法
3. `frontend/src/api/py.ts` 添加类型
4. 前端调用

> 请注意，接口过多时要有软件工程组织，建议按功能模块分组管理，避免全部堆积在单一文件中！

### 修改配置

`backend/config.py`:
```python
WINDOW_TITLE = "My App"
WINDOW_WIDTH = 1280
DEV_SERVER_PORT = 9033  # 开发端口
```

`frontend/vite.config.ts` 中的 `server.port` 也需要保持一致。

### 自定义样式

所有样式都定义在以下文件中：
- `frontend/src/styles/global.css` - 全局样式和 CSS 类
- `frontend/src/index.css` - 入口样式文件

你可以根据需要修改这些文件来调整样式。

## 📦 打包部署

```bash
# 安装打包工具
pip install pyinstaller

# 先构建前端
cd frontend && pnpm build && cd ..

# 打包应用
pyinstaller --name="PyWebViewApp" \
  --windowed \
  --add-data="frontend/dist:frontend/dist" \
  --hidden-import=webview \
  app.py

# 输出在 dist/PyWebViewApp.app (macOS) 或 dist/PyWebViewApp.exe (Windows)
```

## 📚 相关文档

- [QUICKSTART.md](./QUICKSTART.md) - 详细快速启动指南
- [UI_QUICKSTART.md](./UI_QUICKSTART.md) - 新 UI 快速入门指南
- [UI_IMPROVEMENTS.md](./UI_IMPROVEMENTS.md) - 详细的 UI 改进说明
- [DEMO_GUIDE.md](./DEMO_GUIDE.md) - 完整演示指南
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - 项目结构详细说明
- [README_FLOWTEST.md](./README_FLOWTEST.md) - 详细技术文档

## 📖 技术链接

[PyWebView](https://pywebview.flowrl.com/) · [Vite](https://vitejs.dev/) · [React](https://react.dev/)

---

**祝测试愉快！** 🎉