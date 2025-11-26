"""
单元测试扫描器
扫描 Qt 项目的单元测试文件
"""
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, asdict
import re


@dataclass
class UnitTestFile:
    """单元测试文件信息"""
    name: str                    # 测试名称 (test_diagramitem)
    file_path: str               # 源文件路径
    executable_path: str         # 可执行文件路径
    exists: bool                 # 可执行文件是否存在
    
    def to_dict(self):
        """转换为字典"""
        return asdict(self)


def scan_unit_tests(project_path: str) -> List[UnitTestFile]:
    """
    扫描项目的单元测试
    
    Args:
        project_path: 项目路径
        
    Returns:
        单元测试文件列表
    """
    project_dir = Path(project_path)
    tests_dir = project_dir / "tests"
    build_dir = project_dir / "build" / "tests"
    
    if not tests_dir.exists():
        return []
    
    test_files = []
    
    # 扫描 tests 目录下的 test_*.cpp 文件
    for test_file in tests_dir.glob("test_*.cpp"):
        test_name = test_file.stem  # 去掉 .cpp 后缀
        
        # 查找对应的可执行文件
        executable_path = build_dir / test_name
        
        # macOS 可能是 .app 包
        if not executable_path.exists():
            executable_path = build_dir / f"{test_name}.app" / "Contents" / "MacOS" / test_name
        
        test_info = UnitTestFile(
            name=test_name,
            file_path=str(test_file),
            executable_path=str(executable_path),
            exists=executable_path.exists()
        )
        test_files.append(test_info)
    
    return test_files


def parse_test_cases_from_source(source_file: str) -> List[str]:
    """
    从源文件解析测试用例名称
    
    Args:
        source_file: 测试源文件路径
        
    Returns:
        测试用例名称列表
    """
    try:
        content = Path(source_file).read_text(encoding='utf-8', errors='ignore')
        
        # 匹配 private slots: 下的 void testXxx() 方法
        pattern = r'void\s+(test\w+)\s*\('
        matches = re.findall(pattern, content)
        
        return matches
    except Exception:
        return []
