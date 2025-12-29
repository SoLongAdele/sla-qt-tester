"""
模板匹配器 - 找图功能

"""

import time
from dataclasses import dataclass, field
from typing import List, Optional, Union
from pathlib import Path
import numpy as np

try:
    import cv2
    CV_AVAILABLE = True
except ImportError:
    CV_AVAILABLE = False

from .types import Rect, RecoResult, MatchResult, OrderBy
from .base import VisionBase


@dataclass
class TemplateMatcherParam:
    """模板匹配参数
    
    参考 MAA 的 TemplateMatcherParam
    """
    # 模板图片路径或numpy数组
    templates: List[Union[str, np.ndarray]] = field(default_factory=list)
    
    # 匹配阈值 (0-1)，可以为每个模板设置不同阈值
    thresholds: List[float] = field(default_factory=lambda: [0.7])
    
    # 匹配算法 (cv2.TM_CCOEFF_NORMED = 5)
    method: int = 5
    
    # 绿色掩码（将模板中绿色部分排除匹配）
    green_mask: bool = False
    
    # 结果排序方式
    order_by: OrderBy = OrderBy.HORIZONTAL
    
    # 返回第几个结果（支持负数索引）
    result_index: int = 0


class TemplateMatcher(VisionBase):
    """模板匹配器
    
    使用 OpenCV 模板匹配算法在图像中查找模板
    
    示例:
        >>> param = TemplateMatcherParam(
        ...     templates=["button.png"],
        ...     thresholds=[0.8]
        ... )
        >>> matcher = TemplateMatcher(screen_image, param=param)
        >>> result = matcher.analyze()
        >>> if result.success:
        ...     print(f"找到目标: {result.box}")
    """
    
    # 反转分数基数（用于 TM_SQDIFF 系列方法）
    METHOD_INVERT_BASE = 10000
    
    def __init__(
        self,
        image: np.ndarray,
        param: TemplateMatcherParam,
        roi: Optional[Rect] = None,
        name: str = "TemplateMatcher"
    ):
        super().__init__(image, roi, name)
        self._param = param
        self._templates: List[np.ndarray] = []
        self._low_score_better = param.method in (
            cv2.TM_SQDIFF, 
            cv2.TM_SQDIFF_NORMED
        )
        
        # 加载模板
        self._load_templates()
    
    def _load_templates(self):
        """加载模板图片"""
        for tmpl in self._param.templates:
            if isinstance(tmpl, str):
                # 从文件加载
                path = Path(tmpl)
                if path.exists():
                    img = cv2.imread(str(path), cv2.IMREAD_COLOR)
                    if img is not None:
                        self._templates.append(img)
                        print(f"[TemplateMatcher] 模板加载成功: {path} ({img.shape[1]}x{img.shape[0]})")
                    else:
                        print(f"[TemplateMatcher] 模板加载失败 (无法读取): {path}")
                else:
                    print(f"[TemplateMatcher] 模板文件不存在: {path}")
            elif isinstance(tmpl, np.ndarray):
                self._templates.append(tmpl)
                print(f"[TemplateMatcher] 使用内存模板: {tmpl.shape[1]}x{tmpl.shape[0]}")
    
    def analyze(self) -> RecoResult:
        """执行模板匹配分析"""
        start_time = time.perf_counter()
        
        result = RecoResult(algorithm="TemplateMatch")
        
        if not self._templates:
            result.cost_ms = (time.perf_counter() - start_time) * 1000
            return result
        
        all_results: List[MatchResult] = []
        filtered_results: List[MatchResult] = []
        
        # 对每个模板执行匹配
        for i, template in enumerate(self._templates):
            threshold = self._get_threshold(i)
            matches = self._template_match(template)
            
            # 添加到全部结果
            all_results.extend(matches)
            
            # 过滤符合阈值的结果
            for match in matches:
                if self._check_threshold(match.score, threshold):
                    filtered_results.append(match)
        
        # NMS 去重
        filtered_results = self.nms(filtered_results, iou_threshold=0.5)
        
        # 排序
        all_results = self.sort_results(all_results, self._param.order_by)
        filtered_results = self.sort_results(filtered_results, self._param.order_by)
        
        # 选择最佳结果
        if filtered_results:
            idx = self.pythonic_index(len(filtered_results), self._param.result_index)
            if idx is not None:
                result.best_result = filtered_results[idx]
        
        result.all_results = all_results
        result.filtered_results = filtered_results
        result.cost_ms = (time.perf_counter() - start_time) * 1000
        
        # 调试绘图
        if self._debug_draw and result.best_result:
            result.debug_image = self._draw_result(filtered_results)
        
        return result
    
    def _template_match(self, template: np.ndarray) -> List[MatchResult]:
        """执行单个模板的匹配"""
        image_roi = self.image_with_roi()
        
        # 检查尺寸
        if template.shape[0] > image_roi.shape[0] or template.shape[1] > image_roi.shape[1]:
            return []
        
        # 处理匹配方法
        method = self._param.method
        invert_score = False
        if method >= self.METHOD_INVERT_BASE:
            invert_score = True
            method -= self.METHOD_INVERT_BASE
        
        # 创建掩码（可选）
        mask = self._create_mask(template) if self._param.green_mask else None
        
        # 执行模板匹配
        if mask is not None:
            matched = cv2.matchTemplate(image_roi, template, method, mask=mask)
        else:
            matched = cv2.matchTemplate(image_roi, template, method)
        
        # 反转分数
        if invert_score:
            matched = 1.0 - matched
        
        # 提取匹配结果
        results: List[MatchResult] = []
        h, w = template.shape[:2]
        
        # 使用阈值提取候选点
        # 对于 TM_SQDIFF，分数越低越好
        threshold = 0.5 if not self._low_score_better else 0.5
        
        for row in range(matched.shape[0]):
            for col in range(matched.shape[1]):
                score = float(matched[row, col])
                
                if np.isnan(score) or np.isinf(score):
                    continue
                
                # 初步筛选
                if self._low_score_better:
                    if score > threshold:
                        continue
                else:
                    if score < threshold:
                        continue
                
                box = Rect(
                    x=col + self._roi.x,
                    y=row + self._roi.y,
                    width=w,
                    height=h
                )
                results.append(MatchResult(box=box, score=score))
        
        # NMS 去重
        results = self.nms(results, iou_threshold=0.7)
        
        return results
    
    def _create_mask(self, template: np.ndarray) -> Optional[np.ndarray]:
        """创建绿色掩码
        
        将模板中纯绿色 RGB(0, 255, 0) 的区域设为掩码（不参与匹配）
        """
        if template.shape[2] < 3:
            return None
        
        # BGR 格式中绿色是 (0, 255, 0)
        green_lower = np.array([0, 250, 0])
        green_upper = np.array([10, 255, 10])
        
        # 找到绿色区域
        green_mask = cv2.inRange(template, green_lower, green_upper)
        
        # 反转（绿色区域为0，其他为255）
        mask = cv2.bitwise_not(green_mask)
        
        return mask
    
    def _get_threshold(self, index: int) -> float:
        """获取指定索引的阈值"""
        if index < len(self._param.thresholds):
            return self._param.thresholds[index]
        return self._param.thresholds[-1] if self._param.thresholds else 0.7
    
    def _check_threshold(self, score: float, threshold: float) -> bool:
        """检查分数是否满足阈值"""
        if self._low_score_better:
            return score <= threshold
        else:
            return score >= threshold
    
    def _draw_result(self, results: List[MatchResult]) -> np.ndarray:
        """绘制匹配结果（调试用）"""
        image_draw = self.draw_roi()
        color = (0, 0, 255)  # 红色
        
        for i, res in enumerate(results):
            # 绘制矩形框
            cv2.rectangle(
                image_draw,
                (res.box.x, res.box.y),
                (res.box.x + res.box.width, res.box.y + res.box.height),
                color, 
                2
            )
            
            # 绘制标签
            label = f"{i}: {res.score:.3f}"
            cv2.putText(
                image_draw, 
                label,
                (res.box.x, res.box.y - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                1
            )
        
        return image_draw


def find_template(
    image: np.ndarray,
    template: Union[str, np.ndarray],
    threshold: float = 0.7,
    roi: Optional[Rect] = None,
    method: int = cv2.TM_CCOEFF_NORMED
) -> RecoResult:
    """便捷函数：在图像中查找模板
    
    Args:
        image: 搜索图像
        template: 模板图片路径或numpy数组
        threshold: 匹配阈值
        roi: 搜索区域
        method: 匹配算法
        
    Returns:
        识别结果
    """
    param = TemplateMatcherParam(
        templates=[template],
        thresholds=[threshold],
        method=method
    )
    matcher = TemplateMatcher(image, param, roi)
    return matcher.analyze()

