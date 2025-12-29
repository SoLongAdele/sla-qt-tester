# Vision Module

## 📦 模块结构

```
core/vision/
├── __init__.py          # 模块入口
├── types.py             # 类型定义 (Rect, Point, RecoResult, MatchResult)
├── base.py              # VisionBase 基类
├── template_matcher.py  # 模板匹配器 (找图)
├── color_matcher.py     # 颜色匹配器 (找色)
├── pipeline.py          # 任务流水线
├── examples/            # 示例配置
│   └── demo_pipeline.json
└── README.md
```

## 🎯 核心功能

### 1. 模板匹配 (TemplateMatcher)

在屏幕上查找模板图片：

```python
from core.vision import TemplateMatcher, TemplateMatcherParam, Rect

# 截取屏幕
import pyautogui
import cv2
import numpy as np
screenshot = pyautogui.screenshot()
image = cv2.cvtColor(np.array(screenshot), cv2.COLOR_RGB2BGR)

# 执行匹配
param = TemplateMatcherParam(
    templates=["button.png"],
    thresholds=[0.8],
    method=5,  # cv2.TM_CCOEFF_NORMED
    green_mask=False
)
matcher = TemplateMatcher(image, param, roi=Rect(0, 0, 500, 500))
result = matcher.analyze()

if result.success:
    print(f"找到目标: {result.box}, 分数: {result.score:.3f}")
```

### 2. 颜色匹配 (ColorMatcher)

在屏幕上查找指定颜色区域：

```python
from core.vision import ColorMatcher, ColorMatcherParam
import cv2

# 查找红色区域 (HSV 颜色空间)
param = ColorMatcherParam(
    ranges=[([0, 100, 100], [10, 255, 255])],
    method=cv2.COLOR_BGR2HSV,
    count=100,       # 最少 100 个像素
    connected=True   # 只计算连通域
)
matcher = ColorMatcher(image, param)
result = matcher.analyze()

if result.success:
    print(f"找到颜色区域: {result.box}, 像素数: {int(result.score)}")
```

### 3. 任务流水线 (Pipeline)

通过 JSON 配置驱动的自动化任务：

```python
from core.vision import Pipeline

# 创建 Pipeline
pipeline = Pipeline(resource_dir="./images")

# 加载配置
pipeline.load_from_dict({
    "开始": {
        "recognition": "TemplateMatch",
        "template": ["start.png"],
        "threshold": [0.8],
        "action": "Click",
        "next": ["下一步"]
    },
    "下一步": {
        "recognition": "ColorMatch",
        "lower": [0, 100, 100],
        "upper": [10, 255, 255],
        "action": "Click"
    }
})

# 运行
result = pipeline.run("开始")
print(f"执行成功: {result.success}")
print(f"执行的节点: {result.executed_nodes}")
```

## 📋 Pipeline 配置说明

### 识别类型 (recognition)

| 类型 | 说明 | 必需参数 |
|------|------|----------|
| `DirectHit` | 直接命中，不识别 | - |
| `TemplateMatch` | 模板匹配 | `template`, `threshold` |
| `ColorMatch` | 颜色匹配 | `lower`, `upper` |

### 动作类型 (action)

| 类型 | 说明 | 参数 |
|------|------|------|
| `DoNothing` | 不执行动作 | - |
| `Click` | 点击 | `target`, `target_offset` |
| `LongPress` | 长按 | `duration` |
| `Swipe` | 滑动 | `begin`, `end`, `duration` |
| `InputText` | 输入文本 | `input_text` |
| `Wait` | 等待 | `duration` |

### 节点属性

```json
{
    "节点名": {
        "recognition": "TemplateMatch",
        "template": ["button.png"],
        "threshold": [0.7],
        "roi": [100, 100, 500, 400],
        
        "action": "Click",
        "target": true,
        "target_offset": [0, 0, 0, 0],
        
        "next": ["下一个节点"],
        "timeout": 20000,
        "rate_limit": 1000,
        "pre_delay": 200,
        "post_delay": 200,
        
        "inverse": false,
        "enabled": true
    }
}
```

## 🔧 通过 VisualAgent 使用

VisualAgent 集成了视觉识别能力：

```python
from core.services import VisualAgent

agent = VisualAgent()

# 模板匹配
result = agent.find_template("button.png", threshold=0.8)

# 颜色匹配
result = agent.find_color([0, 100, 100], [10, 255, 255], color_space="HSV")

# 找图点击
result = agent.click_template("button.png", threshold=0.8)

# 等待模板出现
result = agent.wait_for_template("loading.png", timeout=10000)

# 运行 Pipeline
result = agent.run_pipeline(config, entry="开始")
```

## 🚀 扩展指南

### 添加新的识别器

1. 继承 `VisionBase` 类
2. 实现 `analyze()` 方法
3. 返回 `RecoResult` 对象

```python
from core.vision.base import VisionBase
from core.vision.types import RecoResult, MatchResult, Rect

class MyMatcher(VisionBase):
    def analyze(self) -> RecoResult:
        result = RecoResult(algorithm="MyMatcher")
        # 实现识别逻辑...
        return result
```

### 添加新的动作类型

1. 在 `pipeline.py` 的 `ActionType` 枚举中添加新类型
2. 在 `PipelineNode.from_dict()` 中解析新动作
3. 在 `Pipeline._execute_action()` 中实现动作逻辑

