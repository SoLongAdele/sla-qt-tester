"""
颜色匹配器 - 找色功能

"""

import time
from dataclasses import dataclass, field
from typing import List, Optional, Tuple
import numpy as np

try:
    import cv2
    CV_AVAILABLE = True
except ImportError:
    CV_AVAILABLE = False

from .types import Rect, RecoResult, MatchResult, OrderBy
from .base import VisionBase


@dataclass
class ColorMatcherParam:
    """颜色匹配参数
    
    参考 MAA 的 ColorMatcherParam
    """
    # 颜色范围列表 [(lower, upper), ...]
    # lower/upper 为颜色通道值列表，如 [B, G, R] 或 [H, S, V]
    ranges: List[Tuple[List[int], List[int]]] = field(default_factory=list)
    
    # 颜色空间转换方法 (cv2.COLOR_BGR2RGB = 4, cv2.COLOR_BGR2HSV = 40)
    method: int = 4  # 默认 RGB
    
    # 符合条件的最少像素数
    count: int = 1
    
    # 是否只计算连通域
    connected: bool = False
    
    # 结果排序方式
    order_by: OrderBy = OrderBy.HORIZONTAL
    
    # 返回第几个结果
    result_index: int = 0


class ColorMatcher(VisionBase):
    """颜色匹配器
    
    在图像中查找符合指定颜色范围的区域
    
    示例:
        >>> # 查找红色区域 (HSV)
        >>> param = ColorMatcherParam(
        ...     ranges=[([0, 100, 100], [10, 255, 255])],
        ...     method=cv2.COLOR_BGR2HSV,
        ...     count=100
        ... )
        >>> matcher = ColorMatcher(screen_image, param=param)
        >>> result = matcher.analyze()
    """
    
    def __init__(
        self,
        image: np.ndarray,
        param: ColorMatcherParam,
        roi: Optional[Rect] = None,
        name: str = "ColorMatcher"
    ):
        super().__init__(image, roi, name)
        self._param = param
    
    def analyze(self) -> RecoResult:
        """执行颜色匹配分析"""
        start_time = time.perf_counter()
        
        result = RecoResult(algorithm="ColorMatch")
        
        if not self._param.ranges:
            result.cost_ms = (time.perf_counter() - start_time) * 1000
            return result
        
        image_roi = self.image_with_roi()
        
        # 颜色空间转换
        if self._param.method != 0:  # 0 表示不转换
            converted = cv2.cvtColor(image_roi, self._param.method)
        else:
            converted = image_roi.copy()
        
        # 合并所有颜色范围的掩码
        combined_mask = None
        for lower, upper in self._param.ranges:
            lower_arr = np.array(lower, dtype=np.uint8)
            upper_arr = np.array(upper, dtype=np.uint8)
            mask = cv2.inRange(converted, lower_arr, upper_arr)
            
            if combined_mask is None:
                combined_mask = mask
            else:
                combined_mask = cv2.bitwise_or(combined_mask, mask)
        
        if combined_mask is None:
            result.cost_ms = (time.perf_counter() - start_time) * 1000
            return result
        
        # 查找符合条件的区域
        all_results: List[MatchResult] = []
        
        if self._param.connected:
            # 连通域分析
            all_results = self._find_connected_regions(combined_mask)
        else:
            # 简单边界框
            all_results = self._find_bounding_boxes(combined_mask)
        
        # 过滤符合像素数量要求的结果
        filtered_results = [
            r for r in all_results 
            if r.score >= self._param.count
        ]
        
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
        if self._debug_draw:
            result.debug_image = self._draw_result(combined_mask, filtered_results)
        
        return result
    
    def _find_connected_regions(self, mask: np.ndarray) -> List[MatchResult]:
        """查找连通域"""
        results = []
        
        # 连通域标记
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            mask, connectivity=8
        )
        
        # 跳过背景（label=0）
        for i in range(1, num_labels):
            x = stats[i, cv2.CC_STAT_LEFT]
            y = stats[i, cv2.CC_STAT_TOP]
            w = stats[i, cv2.CC_STAT_WIDTH]
            h = stats[i, cv2.CC_STAT_HEIGHT]
            area = stats[i, cv2.CC_STAT_AREA]
            
            box = Rect(
                x=x + self._roi.x,
                y=y + self._roi.y,
                width=w,
                height=h
            )
            
            # 使用像素数量作为分数
            results.append(MatchResult(box=box, score=float(area)))
        
        return results
    
    def _find_bounding_boxes(self, mask: np.ndarray) -> List[MatchResult]:
        """查找边界框（基于轮廓）"""
        results = []
        
        # 查找轮廓
        contours, _ = cv2.findContours(
            mask, 
            cv2.RETR_EXTERNAL, 
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = cv2.contourArea(contour)
            
            if area < 1:
                continue
            
            box = Rect(
                x=x + self._roi.x,
                y=y + self._roi.y,
                width=w,
                height=h
            )
            
            results.append(MatchResult(box=box, score=float(area)))
        
        return results
    
    def _draw_result(
        self, 
        mask: np.ndarray, 
        results: List[MatchResult]
    ) -> np.ndarray:
        """绘制匹配结果"""
        image_draw = self.draw_roi()
        
        # 将掩码叠加到原图
        mask_colored = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        mask_colored[:, :, 0] = 0  # 去掉蓝色
        mask_colored[:, :, 2] = 0  # 去掉红色，只保留绿色
        
        # 在 ROI 区域叠加掩码
        roi_region = image_draw[
            self._roi.y : self._roi.y + self._roi.height,
            self._roi.x : self._roi.x + self._roi.width
        ]
        cv2.addWeighted(roi_region, 0.7, mask_colored, 0.3, 0, roi_region)
        
        # 绘制匹配框
        for i, res in enumerate(results):
            cv2.rectangle(
                image_draw,
                (res.box.x, res.box.y),
                (res.box.x + res.box.width, res.box.y + res.box.height),
                (0, 255, 0),
                2
            )
            
            label = f"{i}: {int(res.score)}px"
            cv2.putText(
                image_draw,
                label,
                (res.box.x, res.box.y - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                1
            )
        
        return image_draw


def find_color(
    image: np.ndarray,
    lower: List[int],
    upper: List[int],
    roi: Optional[Rect] = None,
    method: int = cv2.COLOR_BGR2HSV,
    min_count: int = 100
) -> RecoResult:
    """便捷函数：在图像中查找颜色
    
    Args:
        image: 搜索图像
        lower: 颜色下限
        upper: 颜色上限
        roi: 搜索区域
        method: 颜色空间转换方法
        min_count: 最少像素数
        
    Returns:
        识别结果
    """
    param = ColorMatcherParam(
        ranges=[(lower, upper)],
        method=method,
        count=min_count
    )
    matcher = ColorMatcher(image, param, roi)
    return matcher.analyze()

