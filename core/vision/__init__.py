"""
视觉识别模块 - 参考 MAA Framework 设计

提供以下识别能力:
- TemplateMatcher: 模板匹配（找图）
- ColorMatcher: 颜色匹配（找色）
- OCRer: 文字识别
- Pipeline: 任务流水线

设计原则:
- 统一的识别结果接口 (RecoResult)
- 支持 ROI 区域限定
- 支持多结果排序和筛选
- JSON 配置驱动的 Pipeline
"""

from .types import (
    RecoResult,
    MatchResult,
    Rect,
    Point,
    Target,
    TargetType,
    OrderBy,
)
from .base import VisionBase
from .template_matcher import TemplateMatcher, TemplateMatcherParam
from .color_matcher import ColorMatcher, ColorMatcherParam
from .pipeline import Pipeline, PipelineNode

__all__ = [
    # Types
    'RecoResult',
    'MatchResult', 
    'Rect',
    'Point',
    'Target',
    'TargetType',
    'OrderBy',
    # Base
    'VisionBase',
    # Matchers
    'TemplateMatcher',
    'TemplateMatcherParam',
    'ColorMatcher', 
    'ColorMatcherParam',
    # Pipeline
    'Pipeline',
    'PipelineNode',
]

