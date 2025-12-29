"""
视觉识别类型定义

参考 MAA Framework 的类型设计，提供统一的数据结构
"""

from dataclasses import dataclass, field, asdict
from typing import List, Optional, Any, Tuple, Union
from enum import Enum, auto
import numpy as np


class TargetType(Enum):
    """目标类型"""
    SELF = auto()       # 识别到的位置本身
    REGION = auto()     # 固定区域
    PRE_TASK = auto()   # 之前任务的识别位置


class OrderBy(Enum):
    """结果排序方式"""
    HORIZONTAL = auto()  # 水平方向（从左到右）
    VERTICAL = auto()    # 垂直方向（从上到下）
    SCORE = auto()       # 按匹配分数
    AREA = auto()        # 按面积
    RANDOM = auto()      # 随机


@dataclass
class Point:
    """点坐标"""
    x: int
    y: int
    
    def to_tuple(self) -> Tuple[int, int]:
        return (self.x, self.y)
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Rect:
    """矩形区域 [x, y, width, height]"""
    x: int
    y: int
    width: int
    height: int
    
    @classmethod
    def from_tuple(cls, t: Tuple[int, int, int, int]) -> 'Rect':
        return cls(x=t[0], y=t[1], width=t[2], height=t[3])
    
    @classmethod
    def from_list(cls, lst: List[int]) -> 'Rect':
        if len(lst) != 4:
            raise ValueError("Rect requires 4 values: [x, y, width, height]")
        return cls(x=lst[0], y=lst[1], width=lst[2], height=lst[3])
    
    def to_tuple(self) -> Tuple[int, int, int, int]:
        return (self.x, self.y, self.width, self.height)
    
    def to_list(self) -> List[int]:
        return [self.x, self.y, self.width, self.height]
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    def center(self) -> Point:
        """获取中心点"""
        return Point(
            x=self.x + self.width // 2,
            y=self.y + self.height // 2
        )
    
    def area(self) -> int:
        """获取面积"""
        return self.width * self.height
    
    def contains(self, point: Point) -> bool:
        """判断点是否在区域内"""
        return (self.x <= point.x < self.x + self.width and
                self.y <= point.y < self.y + self.height)
    
    def is_valid(self) -> bool:
        """判断是否为有效区域"""
        return self.width > 0 and self.height > 0
    
    def __bool__(self) -> bool:
        return self.is_valid()


@dataclass
class Target:
    """识别/动作目标"""
    type: TargetType = TargetType.SELF
    region: Optional[Rect] = None       # 当 type=REGION 时使用
    task_name: Optional[str] = None     # 当 type=PRE_TASK 时使用
    offset: Rect = field(default_factory=lambda: Rect(0, 0, 0, 0))  # 偏移量
    
    def to_dict(self) -> dict:
        return {
            'type': self.type.name,
            'region': self.region.to_dict() if self.region else None,
            'task_name': self.task_name,
            'offset': self.offset.to_dict()
        }


@dataclass
class MatchResult:
    """单个匹配结果"""
    box: Rect                           # 匹配框
    score: float = 0.0                  # 匹配分数 (0-1)
    text: Optional[str] = None          # OCR 识别的文本
    label: Optional[str] = None         # 分类标签
    
    def to_dict(self) -> dict:
        return {
            'box': self.box.to_dict(),
            'score': self.score,
            'text': self.text,
            'label': self.label
        }
    
    def center(self) -> Point:
        """获取匹配框中心点"""
        return self.box.center()


@dataclass
class RecoResult:
    """识别结果（统一接口）
    
    参考 MAA 的 RecoResultAPI 设计:
    - all_results: 所有原始结果
    - filtered_results: 过滤后的结果  
    - best_result: 最佳结果（用于执行动作）
    """
    all_results: List[MatchResult] = field(default_factory=list)
    filtered_results: List[MatchResult] = field(default_factory=list)
    best_result: Optional[MatchResult] = None
    
    # 调试信息
    algorithm: str = ""                 # 使用的算法
    cost_ms: float = 0.0               # 耗时（毫秒）
    debug_image: Optional[np.ndarray] = None  # 调试绘图
    
    @property
    def success(self) -> bool:
        """是否识别成功"""
        return self.best_result is not None
    
    @property
    def box(self) -> Optional[Rect]:
        """获取最佳结果的匹配框"""
        return self.best_result.box if self.best_result else None
    
    @property
    def score(self) -> float:
        """获取最佳结果的分数"""
        return self.best_result.score if self.best_result else 0.0
    
    def to_dict(self) -> dict:
        return {
            'success': self.success,
            'algorithm': self.algorithm,
            'cost_ms': self.cost_ms,
            'all_results': [r.to_dict() for r in self.all_results],
            'filtered_results': [r.to_dict() for r in self.filtered_results],
            'best_result': self.best_result.to_dict() if self.best_result else None
        }

