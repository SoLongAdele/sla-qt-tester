"""
模块 A: 全栈质量管理 (Integrated Quality Manager)
负责静态代码分析和单元测试可视化
"""
import subprocess
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Any
from core.utils.logger import logger


class QualityManager:
    """质量管理器：静态分析 + 单元测试"""

    def __init__(self, project_root: str = None):
        """
        初始化质量管理器
        
        Args:
            project_root: 项目根目录路径
        """
        if project_root:
            self.project_root = Path(project_root)
        else:
            # 默认使用 targetcpp/source 作为测试项目
            self.project_root = Path(__file__).parent.parent.parent.parent / "targetcpp" / "source"
        
        logger.info(f"质量管理器初始化完成，项目路径: {self.project_root}")

    # ==================== 静态代码分析 ====================

    def run_static_analysis(self, enable_checks: List[str] = None) -> Dict[str, Any]:
        """
        运行 cppcheck 静态代码分析
        
        Args:
            enable_checks: 启用的检查类型列表
            
        Returns:
            分析结果字典
        """
        logger.info("开始静态代码分析...")
        
        if not self.project_root.exists():
            return {
                "success": False,
                "error": f"项目目录不存在: {self.project_root}"
            }

        try:
            # 构建 cppcheck 命令
            cmd = [
                "cppcheck",
                "--enable=all",
                "--xml",
                "--xml-version=2",
                "--quiet",
                str(self.project_root)
            ]
            
            # 执行 cppcheck
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # 解析 XML 输出
            errors = self._parse_cppcheck_xml(result.stderr)
            
            logger.info(f"静态分析完成，发现 {len(errors)} 个问题")
            
            return {
                "success": True,
                "total_issues": len(errors),
                "issues": errors,
                "project_root": str(self.project_root)
            }
            
        except FileNotFoundError:
            return {
                "success": False,
                "error": "未找到 cppcheck，请先安装 cppcheck"
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "分析超时（60秒）"
            }
        except Exception as e:
            logger.error(f"静态分析错误: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _parse_cppcheck_xml(self, xml_str: str) -> List[Dict[str, Any]]:
        """解析 cppcheck XML 输出"""
        errors = []
        
        if not xml_str:
            return errors
            
        try:
            root = ET.fromstring(xml_str)
            
            for error in root.findall(".//error"):
                issue = {
                    "id": error.get("id", "unknown"),
                    "severity": error.get("severity", "style"),
                    "message": error.get("msg", ""),
                    "verbose": error.get("verbose", ""),
                }
                
                # 获取位置信息
                location = error.find("location")
                if location is not None:
                    issue["file"] = Path(location.get("file", "")).name
                    issue["line"] = int(location.get("line", 0))
                    issue["column"] = int(location.get("column", 0))
                else:
                    issue["file"] = "unknown"
                    issue["line"] = 0
                    issue["column"] = 0
                
                errors.append(issue)
                
        except ET.ParseError as e:
            logger.warning(f"解析 XML 失败: {e}")
            
        return errors

    # ==================== 单元测试可视化 ====================

    def scan_unit_tests(self) -> Dict[str, Any]:
        """
        扫描构建目录下的 QTest 测试用例
        
        Returns:
            测试用例列表
        """
        logger.info("扫描单元测试用例...")
        
        build_dirs = [
            self.project_root / "build" / "Desktop_Qt_6_7_2_MinGW_64_bit-Debug" / "debug",
            self.project_root / "build" / "Desktop_Qt_6_7_2_MinGW_64_bit-Release" / "release",
        ]
        
        test_files = []
        for build_dir in build_dirs:
            if build_dir.exists():
                for exe_file in build_dir.glob("tst_*.exe"):
                    test_files.append({
                        "name": exe_file.stem,
                        "path": str(exe_file),
                        "type": "QTest"
                    })
        
        logger.info(f"发现 {len(test_files)} 个测试用例")
        
        return {
            "success": True,
            "total_tests": len(test_files),
            "tests": test_files
        }

    def run_unit_test(self, test_path: str) -> Dict[str, Any]:
        """
        运行指定的单元测试
        
        Args:
            test_path: 测试文件路径
            
        Returns:
            测试结果
        """
        logger.info(f"运行测试: {test_path}")
        
        try:
            # 运行测试并输出 XML 格式
            result = subprocess.run(
                [test_path, "-o", "-,xml"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # 解析测试结果
            test_result = self._parse_qtest_xml(result.stdout)
            
            logger.info(f"测试完成: {test_result['passed']}/{test_result['total']} 通过")
            
            return {
                "success": True,
                "test_path": test_path,
                **test_result
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "测试超时（30秒）"
            }
        except Exception as e:
            logger.error(f"测试运行错误: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _parse_qtest_xml(self, xml_str: str) -> Dict[str, Any]:
        """解析 QTest XML 输出"""
        result = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "cases": []
        }
        
        if not xml_str:
            return result
            
        try:
            root = ET.fromstring(xml_str)
            
            for testcase in root.findall(".//TestFunction"):
                name = testcase.get("name", "unknown")
                
                # 检查是否有失败
                failure = testcase.find("Incident[@type='fail']")
                
                case = {
                    "name": name,
                    "status": "failed" if failure is not None else "passed",
                    "message": failure.get("message", "") if failure is not None else ""
                }
                
                result["cases"].append(case)
                result["total"] += 1
                
                if case["status"] == "passed":
                    result["passed"] += 1
                else:
                    result["failed"] += 1
                    
        except ET.ParseError as e:
            logger.warning(f"解析 QTest XML 失败: {e}")
            
        return result

    def get_code_metrics(self) -> Dict[str, Any]:
        """
        获取代码度量信息
        
        Returns:
            代码统计信息
        """
        logger.info("计算代码度量...")
        
        metrics = {
            "total_files": 0,
            "total_lines": 0,
            "cpp_files": 0,
            "header_files": 0,
            "code_lines": 0,
            "comment_lines": 0
        }
        
        try:
            # 统计源文件
            for ext in ["*.cpp", "*.h"]:
                for file in self.project_root.glob(f"**/{ext}"):
                    # 排除 build 目录
                    if "build" in str(file):
                        continue
                        
                    metrics["total_files"] += 1
                    
                    if ext == "*.cpp":
                        metrics["cpp_files"] += 1
                    else:
                        metrics["header_files"] += 1
                    
                    # 统计行数
                    try:
                        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = f.readlines()
                            metrics["total_lines"] += len(lines)
                            
                            for line in lines:
                                stripped = line.strip()
                                if stripped.startswith("//") or stripped.startswith("/*"):
                                    metrics["comment_lines"] += 1
                                elif stripped:
                                    metrics["code_lines"] += 1
                    except:
                        pass
            
            return {
                "success": True,
                **metrics
            }
            
        except Exception as e:
            logger.error(f"代码度量错误: {e}")
            return {
                "success": False,
                "error": str(e)
            }

