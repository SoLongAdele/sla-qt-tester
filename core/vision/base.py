"""
视觉识别基类
"""

import time
from abc import ABC, abstractmethod
from typing import Optional, List, Tuple
from dataclasses import dataclass
import numpy as np

try:
    import cv2
    CV_AVAILABLE = True
except ImportError:
    CV_AVAILABLE = False

from .types import Rect, RecoResult, MatchResult, OrderBy


class VisionBase(ABC):
    """视觉识别基类
    
    所有识别器继承此类，提供:
    - 统一的图像和ROI处理
    - 结果排序和筛选
    - 调试绘图支持
    """
    
    def __init__(
        self, 
        image: np.ndarray,
        roi: Optional[Rect] = None,
        name: str = ""
    ):
        """
        Args:
            image: 输入图像 (BGR格式)
            roi: 识别区域，None表示全图
            name: 识别器名称（用于调试）
        """
        if not CV_AVAILABLE:
            raise ImportError("OpenCV (cv2) is required for vision module")
        
        self._image = image
        self._roi = roi or Rect(0, 0, image.shape[1], image.shape[0])
        self._name = name
        self._debug_draw = False
        self._draw_image: Optional[np.ndarray] = None
    
    @property
    def image(self) -> np.ndarray:
        """原始图像"""
        return self._image
    
    @property
    def roi(self) -> Rect:
        """识别区域"""
        return self._roi
    
    @property
    def name(self) -> str:
        """识别器名称"""
        return self._name
    
    def enable_debug_draw(self, enable: bool = True):
        """启用调试绘图"""
        self._debug_draw = enable
    
    def image_with_roi(self) -> np.ndarray:
        """获取ROI区域的图像"""
        return self._image[
            self._roi.y : self._roi.y + self._roi.height,
            self._roi.x : self._roi.x + self._roi.width
        ]
    
    def draw_roi(self, base_image: Optional[np.ndarray] = None) -> np.ndarray:
        """绘制ROI区域（调试用）"""
        if base_image is None:
            base_image = self._image.copy()
        
        cv2.rectangle(
            base_image,
            (self._roi.x, self._roi.y),
            (self._roi.x + self._roi.width, self._roi.y + self._roi.height),
            (0, 255, 255),  # 黄色
            2
        )
        return base_image
    
    @abstractmethod
    def analyze(self) -> RecoResult:
        """执行识别分析（子类实现）"""
        pass
    
    # ==================== 结果排序工具方法 ====================
    
    @staticmethod
    def sort_by_horizontal(results: List[MatchResult]) -> List[MatchResult]:
        """按水平方向排序（从左到右，同列则从上到下）"""
        return sorted(results, key=lambda r: (r.box.x, r.box.y))
    
    @staticmethod
    def sort_by_vertical(results: List[MatchResult]) -> List[MatchResult]:
        """按垂直方向排序（从上到下，同行则从左到右）"""
        return sorted(results, key=lambda r: (r.box.y, r.box.x))
    
    @staticmethod
    def sort_by_score(results: List[MatchResult], descending: bool = True) -> List[MatchResult]:
        """按分数排序"""
        return sorted(results, key=lambda r: r.score, reverse=descending)
    
    @staticmethod
    def sort_by_area(results: List[MatchResult], descending: bool = True) -> List[MatchResult]:
        """按面积排序"""
        return sorted(results, key=lambda r: r.box.area(), reverse=descending)
    
    @staticmethod
    def sort_by_random(results: List[MatchResult]) -> List[MatchResult]:
        """随机排序"""
        import random
        result = results.copy()
        random.shuffle(result)
        return result
    
    def sort_results(
        self, 
        results: List[MatchResult], 
        order_by: OrderBy
    ) -> List[MatchResult]:
        """根据指定方式排序结果"""
        if order_by == OrderBy.HORIZONTAL:
            return self.sort_by_horizontal(results)
        elif order_by == OrderBy.VERTICAL:
            return self.sort_by_vertical(results)
        elif order_by == OrderBy.SCORE:
            return self.sort_by_score(results)
        elif order_by == OrderBy.AREA:
            return self.sort_by_area(results)
        elif order_by == OrderBy.RANDOM:
            return self.sort_by_random(results)
        else:
            return results
    
    @staticmethod
    def pythonic_index(length: int, index: int) -> Optional[int]:
        """Python 风格的索引转换
        
        支持负数索引，超出范围返回 None
        """
        if length == 0:
            return None
        if index < 0:
            index = length + index
        if 0 <= index < length:
            return index
        return None
    
    # ==================== NMS 非极大值抑制 ====================
    
    @staticmethod
    def nms(
        results: List[MatchResult], 
        iou_threshold: float = 0.5,
        score_threshold: float = 0.0
    ) -> List[MatchResult]:
        """非极大值抑制，去除重叠的检测框
        
        Args:
            results: 匹配结果列表
            iou_threshold: IoU阈值，超过此值认为重叠
            score_threshold: 分数阈值，低于此值的结果被过滤
        """
        if not results:
            return []
        
        # 按分数过滤
        results = [r for r in results if r.score >= score_threshold]
        if not results:
            return []
        
        # 按分数降序排序
        results = sorted(results, key=lambda r: r.score, reverse=True)
        
        keep = []
        while results:
            best = results.pop(0)
            keep.append(best)
            
            # 计算剩余框与最佳框的IoU
            remaining = []
            for r in results:
                iou = VisionBase._compute_iou(best.box, r.box)
                if iou < iou_threshold:
                    remaining.append(r)
            results = remaining
        
        return keep
    
    @staticmethod
    def _compute_iou(box1: Rect, box2: Rect) -> float:
        """计算两个矩形的IoU（交并比）"""
        x1 = max(box1.x, box2.x)
        y1 = max(box1.y, box2.y)
        x2 = min(box1.x + box1.width, box2.x + box2.width)
        y2 = min(box1.y + box1.height, box2.y + box2.height)
        
        if x2 <= x1 or y2 <= y1:
            return 0.0
        
        intersection = (x2 - x1) * (y2 - y1)
        area1 = box1.area()
        area2 = box2.area()
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0

