# 视觉测试系统技术实现文档

本文档从代码和技术角度详细说明视觉匹配和 Pipeline 调用的实现原理。

---

## 目录

- [系统架构](#系统架构)
- [类型系统](#类型系统)
- [视觉识别基类](#视觉识别基类)
- [模板匹配器 TemplateMatcher](#模板匹配器-templatematcher)
- [特征匹配器 FeatureMatcher](#特征匹配器-featurematcher)
- [颜色匹配器 ColorMatcher](#颜色匹配器-colormatcher)
- [任务流水线 Pipeline](#任务流水线-pipeline)
- [服务层 VisualAgent](#服务层-visualagent)
- [数据流与执行流程](#数据流与执行流程)

---

## 系统架构

视觉测试系统采用分层架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                    服务层 (VisualAgent)                      │
│   提供高层 API，负责窗口管理、截图、Pipeline 调度            │
├─────────────────────────────────────────────────────────────┤
│                    流水线层 (Pipeline)                       │
│   JSON 配置驱动的任务编排器，管理节点执行和状态转换          │
├───────────────┬───────────────┬───────────────┬─────────────┤
│ TemplateMatcher│ FeatureMatcher│ ColorMatcher  │   ...扩展   │
│   模板匹配     │   特征匹配    │   颜色匹配    │             │
├───────────────┴───────────────┴───────────────┴─────────────┤
│                    基类层 (VisionBase)                       │
│   统一的 ROI 处理、结果排序、NMS 去重                        │
├─────────────────────────────────────────────────────────────┤
│                    类型系统 (types.py)                       │
│   Rect, Point, MatchResult, RecoResult 等数据结构            │
└─────────────────────────────────────────────────────────────┘
```

### 文件结构

```
core/vision/
├── __init__.py           # 模块导出
├── types.py              # 类型定义
├── base.py               # 视觉识别基类
├── template_matcher.py   # 模板匹配实现
├── feature_matcher.py    # 特征匹配实现
├── color_matcher.py      # 颜色匹配实现
├── pipeline.py           # 任务流水线
├── examples/             # 示例 Pipeline JSON
└── resources/            # 模板图片资源

core/services/
└── visual_agent.py       # 服务层封装
```

---

## 类型系统

位于 `types.py`，定义了视觉识别的核心数据结构。

### Point - 点坐标

```python
@dataclass
class Point:
    x: int
    y: int
```

用于表示屏幕坐标点，常用于点击位置计算。

### Rect - 矩形区域

```python
@dataclass
class Rect:
    x: int      # 左上角 X
    y: int      # 左上角 Y
    width: int  # 宽度
    height: int # 高度
```

核心方法：
- `center()` - 返回矩形中心点 `Point`
- `area()` - 计算面积
- `contains(point)` - 判断点是否在区域内
- `from_list([x, y, w, h])` - 从列表创建

### MatchResult - 单次匹配结果

```python
@dataclass
class MatchResult:
    box: Rect                    # 匹配区域
    score: float = 0.0           # 匹配分数 (0-1 或像素数)
    text: Optional[str] = None   # OCR 识别文本 (预留)
    label: Optional[str] = None  # 分类标签 (预留)
```

### RecoResult - 识别结果统一接口

```python
@dataclass
class RecoResult:
    all_results: List[MatchResult]       # 所有原始结果
    filtered_results: List[MatchResult]  # 过滤后的结果
    best_result: Optional[MatchResult]   # 最佳结果
    
    algorithm: str = ""                  # 算法名称
    cost_ms: float = 0.0                # 耗时 (毫秒)
    debug_image: Optional[np.ndarray]   # 调试图像
```

关键属性：
- `success` - `best_result is not None`
- `box` - 最佳结果的匹配框
- `score` - 最佳结果的分数

### OrderBy - 结果排序方式

```python
class OrderBy(Enum):
    HORIZONTAL = auto()  # 从左到右
    VERTICAL = auto()    # 从上到下
    SCORE = auto()       # 按分数
    AREA = auto()        # 按面积
    RANDOM = auto()      # 随机
```

---

## 视觉识别基类

位于 `base.py`，`VisionBase` 是所有识别器的抽象基类。

### 核心职责

1. **ROI 区域管理**：统一处理识别区域裁剪
2. **结果排序**：提供多种排序策略
3. **NMS 去重**：非极大值抑制，去除重叠检测框
4. **调试绘图**：支持可视化调试

### 关键方法

```python
class VisionBase(ABC):
    def __init__(self, image: np.ndarray, roi: Optional[Rect], name: str):
        self._image = image
        self._roi = roi or Rect(0, 0, image.shape[1], image.shape[0])
    
    def image_with_roi(self) -> np.ndarray:
        """提取 ROI 区域图像"""
        return self._image[
            self._roi.y : self._roi.y + self._roi.height,
            self._roi.x : self._roi.x + self._roi.width
        ]
    
    @abstractmethod
    def analyze(self) -> RecoResult:
        """子类实现具体识别逻辑"""
        pass
```

### NMS 非极大值抑制

```python
@staticmethod
def nms(results: List[MatchResult], iou_threshold: float = 0.5) -> List[MatchResult]:
    """
    去除重叠的检测框
    
    算法流程：
    1. 按分数降序排序
    2. 取最高分结果，加入保留列表
    3. 计算剩余框与最高分框的 IoU
    4. 移除 IoU > 阈值的框
    5. 重复直到列表为空
    """
```

IoU (交并比) 计算：

```python
@staticmethod
def _compute_iou(box1: Rect, box2: Rect) -> float:
    # 计算交集
    x1 = max(box1.x, box2.x)
    y1 = max(box1.y, box2.y)
    x2 = min(box1.x + box1.width, box2.x + box2.width)
    y2 = min(box1.y + box1.height, box2.y + box2.height)
    
    intersection = max(0, x2-x1) * max(0, y2-y1)
    union = box1.area() + box2.area() - intersection
    return intersection / union
```

---

## 模板匹配器 TemplateMatcher

位于 `template_matcher.py`，基于 OpenCV `cv2.matchTemplate` 实现。

### 参数配置

```python
@dataclass
class TemplateMatcherParam:
    templates: List[Union[str, np.ndarray]]  # 模板路径或图像
    thresholds: List[float] = [0.7]          # 匹配阈值
    method: int = 5                          # TM_CCOEFF_NORMED
    green_mask: bool = False                 # 绿色掩码
    order_by: OrderBy = OrderBy.HORIZONTAL
    
    # 多尺度匹配
    multi_scale: bool = True
    scale_range: List[float] = [0.5, 1.5]    # 缩放范围
    scale_step: float = 0.1                  # 缩放步长
```

### 匹配算法实现

```python
def _template_match(self, template: np.ndarray) -> List[MatchResult]:
    image_roi = self.image_with_roi()
    
    # 多尺度匹配
    if self._param.multi_scale:
        scales = np.arange(0.5, 1.5 + 0.1, 0.1)
    else:
        scales = [1.0]
    
    for scale in scales:
        # 1. 缩放模板
        if scale != 1.0:
            scaled_template = cv2.resize(template, (new_w, new_h))
        
        # 2. 创建绿色掩码（可选）
        mask = self._create_mask(scaled_template) if self._param.green_mask else None
        
        # 3. 执行模板匹配
        matched = cv2.matchTemplate(image_roi, scaled_template, method, mask=mask)
        
        # 4. 找到最佳匹配位置
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(matched)
        
        # 5. 提取候选点 (分数 >= 0.5)
        candidate_mask = matched >= 0.5
        candidate_coords = np.argwhere(candidate_mask)
```

### 阈值检查逻辑

模板匹配使用 **阈值越低越宽松** 的逻辑（对于 TM_CCOEFF_NORMED）：

```python
def _check_threshold(self, score: float, threshold: float) -> bool:
    if self._low_score_better:  # TM_SQDIFF 系列
        return score <= threshold
    else:  # TM_CCOEFF_NORMED 等
        return score >= threshold
```

> **注意**：在本项目中，threshold 语义是 "分数必须 >= threshold"，因此 threshold=0.2 表示接受 score≥0.2 的结果，相对宽松。

### 绿色掩码

用于排除模板中的特定区域（常用于透明背景处理）：

```python
def _create_mask(self, template: np.ndarray) -> np.ndarray:
    # BGR 格式中查找绿色 (0, 255, 0)
    green_lower = np.array([0, 250, 0])
    green_upper = np.array([10, 255, 10])
    green_mask = cv2.inRange(template, green_lower, green_upper)
    return cv2.bitwise_not(green_mask)  # 绿色区域为0，其他为255
```

---

## 特征匹配器 FeatureMatcher

位于 `feature_matcher.py`，基于特征点检测和描述符匹配。

### 支持的检测器

```python
class FeatureDetector(Enum):
    SIFT = auto()   # 精度高，速度慢
    ORB = auto()    # 速度快，精度一般
    BRISK = auto()  # 二值描述符
    KAZE = auto()   # 非线性尺度空间
    AKAZE = auto()  # 推荐：速度快，效果好
```

### 匹配流程

```python
def analyze(self) -> RecoResult:
    # 1. 创建特征检测器
    detector = self._create_detector()  # e.g., cv2.AKAZE_create()
    
    # 2. 创建匹配器
    matcher = self._create_matcher()    # FLANN 或 BFMatcher
    
    # 3. 提取图像特征
    kp_image, desc_image = detector.detectAndCompute(image_roi, mask)
    
    # 4. 对每个模板执行匹配
    for template in self._templates:
        kp_template, desc_template = detector.detectAndCompute(template, mask)
        
        # 5. KNN 匹配
        matches = matcher.knnMatch(desc_template, desc_image, k=2)
        
        # 6. Lowe's ratio test
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)
        
        # 7. 计算单应性矩阵
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        
        # 8. 透视变换获取边界框
        corners = np.float32([[0,0], [w,0], [w,h], [0,h]])
        transformed = cv2.perspectiveTransform(corners, H)
```

### 匹配器选择

```python
def _create_matcher(self):
    if self._param.detector in (FeatureDetector.SIFT, FeatureDetector.KAZE):
        # 浮点描述符使用 FLANN
        index_params = dict(algorithm=1, trees=5)  # FLANN_INDEX_KDTREE
        return cv2.FlannBasedMatcher(index_params, search_params)
    else:
        # 二值描述符使用 BFMatcher + Hamming 距离
        return cv2.BFMatcher(cv2.NORM_HAMMING)
```

### 适用场景

| 场景 | 推荐 |
|------|------|
| 简单图标/按钮 | TemplateMatcher |
| 复杂纹理 | FeatureMatcher (AKAZE) |
| 有旋转/透视 | FeatureMatcher |
| 简单几何图形 | TemplateMatcher (特征点少) |

---

## 颜色匹配器 ColorMatcher

位于 `color_matcher.py`，基于颜色范围过滤。

### 参数配置

```python
@dataclass
class ColorMatcherParam:
    ranges: List[Tuple[List[int], List[int]]]  # [(lower, upper), ...]
    method: int = 4                             # COLOR_BGR2RGB
    count: int = 1                              # 最少像素数
    connected: bool = False                     # 连通域分析
    order_by: OrderBy = OrderBy.HORIZONTAL
```

### 匹配流程

```python
def analyze(self) -> RecoResult:
    image_roi = self.image_with_roi()
    
    # 1. 颜色空间转换
    converted = cv2.cvtColor(image_roi, self._param.method)  # BGR -> HSV/RGB
    
    # 2. 颜色范围过滤
    combined_mask = None
    for lower, upper in self._param.ranges:
        mask = cv2.inRange(converted, lower_arr, upper_arr)
        combined_mask = cv2.bitwise_or(combined_mask, mask) if combined_mask else mask
    
    # 3. 查找区域
    if self._param.connected:
        # 连通域分析
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask)
    else:
        # 轮廓查找
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
```

### 颜色空间

| method 值 | 含义 |
|-----------|------|
| 0 | 不转换 (BGR) |
| 4 | BGR -> RGB |
| 40 | BGR -> HSV |

---

## 任务流水线 Pipeline

位于 `pipeline.py`，实现 JSON 配置驱动的自动化任务执行。

### 核心概念

- **Node（节点）**：单个 "识别 + 动作" 组合
- **Pipeline（流水线）**：多个节点组成的有向图
- **Entry（入口）**：执行起始节点

### 节点定义

```python
@dataclass
class PipelineNode:
    name: str
    
    # 识别配置
    recognition: RecognitionType = RecognitionType.DIRECT_HIT
    recognition_param: Dict[str, Any] = field(default_factory=dict)
    roi: Optional[List[int]] = None
    
    # 动作配置
    action: ActionType = ActionType.DO_NOTHING
    action_param: Dict[str, Any] = field(default_factory=dict)
    
    # 流程控制
    next: List[str] = field(default_factory=list)  # 后续节点
    timeout: int = 20000      # 超时 (ms)
    rate_limit: int = 1000    # 识别频率 (ms)
    
    # 延迟
    pre_delay: int = 200      # 动作前延迟
    post_delay: int = 200     # 动作后延迟
    
    inverse: bool = False     # 反转识别结果
    enabled: bool = True
```

### 识别类型

```python
class RecognitionType(Enum):
    DIRECT_HIT = auto()      # 直接命中（不识别）
    TEMPLATE_MATCH = auto()  # 模板匹配
    FEATURE_MATCH = auto()   # 特征匹配
    COLOR_MATCH = auto()     # 颜色匹配
```

### 动作类型

```python
class ActionType(Enum):
    DO_NOTHING = auto()   # 不执行
    CLICK = auto()        # 点击
    LONG_PRESS = auto()   # 长按
    SWIPE = auto()        # 滑动
    INPUT_TEXT = auto()   # 输入文本
    WAIT = auto()         # 等待
```

### JSON 配置解析

```python
@classmethod
def from_dict(cls, name: str, data: Dict[str, Any]) -> 'PipelineNode':
    # 解析识别类型
    reco_str = data.get('recognition', 'DirectHit')
    if reco_str == 'TemplateMatch':
        reco_type = RecognitionType.TEMPLATE_MATCH
        reco_param = {
            'template': data.get('template', []),
            'threshold': data.get('threshold', [0.7]),
            'method': data.get('method', 5),
            'multi_scale': data.get('multi_scale', True),
            ...
        }
    
    # 解析动作类型
    action_str = data.get('action', 'DoNothing')
    if action_str == 'Click':
        action_type = ActionType.CLICK
        action_param = {
            'target': data.get('target', True),
            'target_offset': data.get('target_offset', [0, 0, 0, 0]),
        }
```

### 执行流程

```python
def run(self, entry: str) -> PipelineResult:
    current_node = entry
    
    while self._running and current_node:
        node = self._nodes.get(current_node)
        if not node or not node.enabled:
            break
        
        # 1. 执行识别
        reco_result = self._recognize(node)
        
        # 2. 检查结果（支持反转）
        success = reco_result.success
        if node.inverse:
            success = not success
        
        # 3. 截图保存（调试用）
        self._save_screenshot(node, reco_result)
        
        if not success:
            # 识别失败，尝试下一个节点
            next_node = self._find_next_node(node)
            if next_node:
                current_node = next_node
                continue
            else:
                break  # 超时
        
        # 4. 动作前延迟
        time.sleep(node.pre_delay / 1000)
        
        # 5. 执行动作
        self._execute_action(node, reco_result)
        
        # 6. 动作后延迟
        time.sleep(node.post_delay / 1000)
        
        # 7. 进入下一个节点
        current_node = node.next[0] if node.next else None
```

### 识别分发

```python
def _recognize(self, node: PipelineNode) -> RecoResult:
    image = self._screen_capture()
    roi = Rect.from_list(node.roi) if node.roi else None
    
    if node.recognition == RecognitionType.DIRECT_HIT:
        # 直接返回成功
        return RecoResult(algorithm="DirectHit", best_result=MatchResult(...))
    
    elif node.recognition == RecognitionType.TEMPLATE_MATCH:
        return self._template_match(image, node, roi)
    
    elif node.recognition == RecognitionType.FEATURE_MATCH:
        return self._feature_match(image, node, roi)
    
    elif node.recognition == RecognitionType.COLOR_MATCH:
        return self._color_match(image, node, roi)
```

### 动作执行

```python
def _execute_action(self, node: PipelineNode, reco_result: RecoResult):
    if node.action == ActionType.CLICK:
        point = self._get_click_point(reco_result, node.action_param)
        pyautogui.click(point.x, point.y)
    
    elif node.action == ActionType.SWIPE:
        pyautogui.moveTo(start.x, start.y)
        pyautogui.drag(dx, dy, duration=duration)
    
    elif node.action == ActionType.INPUT_TEXT:
        pyautogui.write(text)
```

### 点击位置计算

```python
def _get_click_point(self, reco_result: RecoResult, param: Dict) -> Point:
    target = param.get('target', True)
    offset = param.get('target_offset', [0, 0, 0, 0])
    
    if target is True and reco_result.box:
        # 点击识别位置的中心
        center = reco_result.box.center()
        return Point(center.x + offset[0], center.y + offset[1])
    elif isinstance(target, list):
        # 固定坐标
        return Point(target[0] + offset[0], target[1] + offset[1])
```

---

## 服务层 VisualAgent

位于 `core/services/visual_agent.py`，提供高层 API 封装。

### 主要功能

1. **应用程序控制**：启动/关闭目标程序、窗口管理
2. **屏幕截图**：获取屏幕帧 (Base64)
3. **视觉识别 API**：模板匹配、颜色匹配、找图点击
4. **Pipeline 执行**：运行 JSON 配置的测试流水线
5. **AI 集成**：自然语言指令解析（可选）

### 关键方法

```python
class VisualAgent:
    def find_template(self, template_path, threshold=0.7, roi=None) -> Dict:
        """模板匹配"""
        image = self._capture_screen_cv()
        param = TemplateMatcherParam(templates=[template_path], thresholds=[threshold])
        matcher = TemplateMatcher(image, param, Rect.from_list(roi) if roi else None)
        return matcher.analyze().to_dict()
    
    def click_template(self, template_path, threshold=0.7, roi=None, offset=None) -> Dict:
        """找图并点击"""
        find_result = self.find_template(template_path, threshold, roi)
        if find_result['success']:
            box = find_result['box']
            click_x = box['x'] + box['width'] // 2
            click_y = box['y'] + box['height'] // 2
            pyautogui.click(click_x, click_y)
    
    def run_pipeline(self, config: Dict, entry: str, resource_dir=None) -> Dict:
        """运行 Pipeline"""
        pipeline = Pipeline(
            screen_capture_func=self._capture_screen_cv,
            resource_dir=resource_dir
        )
        pipeline.load_from_dict(config)
        return pipeline.run(entry).to_dict()
```

---

## 数据流与执行流程

### 单次识别流程

```
┌───────────┐     ┌─────────────┐     ┌─────────────┐
│ 截图/图像  │────▶│ ROI 区域裁剪 │────▶│  识别器处理  │
└───────────┘     └─────────────┘     └──────┬──────┘
                                             │
                      ┌──────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  识别器内部处理                      │
├─────────────────────────────────────────────────────┤
│ TemplateMatcher:                                    │
│   1. 加载模板 → 2. 多尺度缩放 → 3. cv2.matchTemplate│
│   4. minMaxLoc → 5. 候选点提取 → 6. NMS 去重       │
├─────────────────────────────────────────────────────┤
│ FeatureMatcher:                                     │
│   1. 特征提取 → 2. KNN 匹配 → 3. Lowe's ratio test │
│   4. findHomography → 5. perspectiveTransform      │
├─────────────────────────────────────────────────────┤
│ ColorMatcher:                                       │
│   1. 颜色空间转换 → 2. inRange → 3. 连通域/轮廓    │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                   RecoResult                        │
│ - all_results: 所有候选                              │
│ - filtered_results: 阈值过滤后                       │
│ - best_result: 最佳结果（用于动作执行）              │
└─────────────────────────────────────────────────────┘
```

### Pipeline 执行流程

```
┌──────────────┐
│ 加载 JSON    │
│ 配置文件     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 解析为       │
│ PipelineNode │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ 从 Entry     │────▶│ 执行当前节点  │◀────┐
│ 节点开始     │     └──────┬───────┘     │
└──────────────┘            │             │
                            ▼             │
                    ┌───────────────┐     │
                    │ 1. 截图       │     │
                    │ 2. 识别       │     │
                    │ 3. 判断结果   │     │
                    └───────┬───────┘     │
                            │             │
              ┌─────────────┴─────────────┐
              │ success?                   │
              ▼                           ▼
        ┌──────────┐              ┌───────────┐
        │ 执行动作  │              │ 尝试 next │
        │ pre_delay│              │ 节点      │
        │ action   │              └─────┬─────┘
        │ post_delay│                   │
        └────┬─────┘                    │
             │                          │
             ▼                          │
        ┌──────────┐                    │
        │ 进入 next│────────────────────┘
        │ 节点     │
        └────┬─────┘
             │
             ▼
    ┌────────────────┐
    │ next 为空？     │
    │ 是 → 结束      │
    │ 否 → 继续循环  │
    └────────────────┘
```

---

## 技术选型说明

| 组件 | 技术 | 说明 |
|------|------|------|
| 图像处理 | OpenCV (cv2) | 成熟的计算机视觉库 |
| 屏幕操作 | pyautogui | 跨平台鼠标键盘控制 |
| 窗口管理 | pygetwindow | Windows/macOS 窗口控制 |
| 数据结构 | dataclasses | Python 原生，类型安全 |
| 配置格式 | JSON | 人类可读，便于版本控制 |

---

*文档版本: 1.0 | 更新日期: 2025-12-31*

