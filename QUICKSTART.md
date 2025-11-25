# FlowTest Pro - 快速启动指南 🚀

## 一分钟启动

### 1. 安装依赖

#### Windows 用户特别注意

**Python 依赖**：
```bash
# 进入项目目录
cd qttester

# 安装 Python 依赖（会自动安装 pywin32）
pip install -r requirements.txt
```

**前端依赖**：
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

**Windows 特定说明**：
- ✅ `pywin32` 会自动安装（已在 requirements.txt 中配置）
- ✅ 如果遇到权限问题，使用管理员权限运行命令提示符
- ✅ 如果 pip 安装失败，尝试：`python -m pip install -r requirements.txt`

### 2. 启动应用

```bash
# 在 qttester 目录下运行
python run_dev.py
```

### 3. 开始测试

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

## 常见问题

### Q1: 找不到 CppCheck？
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

### Q0: Windows 安装依赖失败？
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

### Q2: 视觉测试启动失败？
**A**: 检查以下几点：
1. 确认 `targetcpp/runableexe/FreeCharts/diagramscene.exe` 路径正确
2. 确认安装了 `pyautogui`、`opencv-python` 等视觉库
3. 查看控制台错误日志

### Q3: AI 功能如何使用？
**A**: 
1. 访问 https://platform.deepseek.com 注册并获取 API Key
2. 在"AI 自动化"标签页输入 API Key
3. 输入自然语言指令，如"画一个红色的矩形"
4. 点击"执行 AI 指令"

### Q4: 如何修改测试目标路径？
**A**: 编辑以下文件：
- 被测应用路径: `core/services/visual_agent.py` 第 35 行
- 源码扫描路径: `core/services/quality_mgr.py` 第 31 行

## 测试流程建议

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

## 开发模式说明

运行 `python run_dev.py` 会：
1. ✅ 自动启动 Vite 前端开发服务器
2. ✅ 等待前端就绪（最多 30 秒）
3. ✅ 启动 PyWebView 桌面窗口
4. ✅ 支持前端热更新（HMR）

关闭应用时：
- 自动停止 Vite 服务器
- 清理所有子进程

## 目录结构速查

```
qttester/
├── run_dev.py              # 👈 启动脚本
├── backend/api.py          # 👈 API 接口定义
├── core/services/          # 👈 核心业务逻辑
│   ├── quality_mgr.py      # 质量管理
│   └── visual_agent.py     # 视觉测试
└── frontend/src/
    ├── App.tsx             # 主界面
    ├── modules/            # 功能模块
    │   ├── quality/        # 质量管理界面
    │   └── visual/         # 视觉测试界面
    └── api/py.ts           # Python API 封装
```

## 技术支持

遇到问题？
1. 查看控制台日志
2. 检查 `qttester/logs/` 目录
3. 阅读 `README_FLOWTEST.md` 详细文档

---

**祝测试愉快！** 🎉

