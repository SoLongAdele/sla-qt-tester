"""
模块 B: 智能视觉测试 Agent (Visual AI Agent)
负责实时视觉监控和 AI 自动化测试
"""
import base64
import time
import subprocess
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from core.utils.logger import logger

try:
    import pyautogui
    import cv2
    import numpy as np
    VISUAL_LIBS_AVAILABLE = True
except ImportError:
    VISUAL_LIBS_AVAILABLE = False
    logger.warning("视觉库未安装，部分功能将不可用")

try:
    import pygetwindow as gw
    WINDOW_LIB_AVAILABLE = True
except ImportError:
    WINDOW_LIB_AVAILABLE = False
    logger.warning("窗口管理库未安装")

try:
    from openai import OpenAI
    AI_LIB_AVAILABLE = True
except ImportError:
    AI_LIB_AVAILABLE = False
    logger.warning("OpenAI SDK 未安装，AI 功能将不可用")


class VisualAgent:
    """智能视觉测试代理"""

    def __init__(self, target_exe_path: str = None, api_key: str = None):
        """
        初始化视觉测试代理
        
        Args:
            target_exe_path: 被测程序路径
            api_key: DeepSeek API Key
        """
        if target_exe_path:
            self.target_exe = Path(target_exe_path)
        else:
            # 默认使用 diagramscene.exe
            self.target_exe = Path(__file__).parent.parent.parent.parent / "targetcpp" / "runableexe" / "FreeCharts" / "diagramscene.exe"
        
        self.target_process = None
        self.ai_client = None
        
        # 初始化 AI 客户端
        if api_key and AI_LIB_AVAILABLE:
            try:
                self.ai_client = OpenAI(
                    api_key=api_key,
                    base_url="https://api.deepseek.com"
                )
                logger.info("AI 客户端初始化成功")
            except Exception as e:
                logger.error(f"AI 客户端初始化失败: {e}")
        
        logger.info(f"视觉测试代理初始化完成，目标程序: {self.target_exe}")

    # ==================== 应用程序控制 ====================

    def launch_target_app(self) -> Dict[str, Any]:
        """启动被测应用程序"""
        logger.info("启动被测应用程序...")
        
        if not self.target_exe.exists():
            return {
                "success": False,
                "error": f"目标程序不存在: {self.target_exe}"
            }
        
        try:
            self.target_process = subprocess.Popen([str(self.target_exe)])
            time.sleep(2)  # 等待应用启动
            
            logger.info(f"应用已启动，PID: {self.target_process.pid}")
            
            return {
                "success": True,
                "pid": self.target_process.pid,
                "path": str(self.target_exe)
            }
            
        except Exception as e:
            logger.error(f"启动应用失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def close_target_app(self) -> Dict[str, Any]:
        """关闭被测应用程序"""
        logger.info("关闭被测应用程序...")
        
        try:
            if self.target_process and self.target_process.poll() is None:
                self.target_process.terminate()
                self.target_process.wait(timeout=5)
                logger.info("应用已关闭")
                return {"success": True}
            else:
                return {"success": False, "error": "应用未运行"}
        except Exception as e:
            logger.error(f"关闭应用失败: {e}")
            return {"success": False, "error": str(e)}

    def get_window_info(self) -> Dict[str, Any]:
        """获取窗口信息"""
        if not WINDOW_LIB_AVAILABLE:
            return {"success": False, "error": "窗口管理库未安装"}
        
        try:
            windows = gw.getAllTitles()
            target_windows = [w for w in windows if "diagram" in w.lower() or "freecharts" in w.lower()]
            
            return {
                "success": True,
                "all_windows": windows[:10],  # 只返回前10个
                "target_windows": target_windows
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def focus_target_window(self, window_title: str = None) -> Dict[str, Any]:
        """聚焦目标窗口"""
        if not WINDOW_LIB_AVAILABLE:
            return {"success": False, "error": "窗口管理库未安装"}
        
        try:
            if window_title:
                window = gw.getWindowsWithTitle(window_title)[0]
            else:
                # 自动查找目标窗口
                windows = gw.getWindowsWithTitle("diagram")
                if not windows:
                    windows = gw.getWindowsWithTitle("FreeCharts")
                if not windows:
                    return {"success": False, "error": "未找到目标窗口"}
                window = windows[0]
            
            window.activate()
            time.sleep(0.5)
            
            return {
                "success": True,
                "window_title": window.title,
                "position": (window.left, window.top, window.width, window.height)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==================== 实时视觉监控 ====================

    def get_screen_frame(self, region: Tuple[int, int, int, int] = None) -> Dict[str, Any]:
        """
        获取屏幕截图帧（Base64编码）
        
        Args:
            region: (x, y, width, height) 截图区域
            
        Returns:
            包含 Base64 图片的字典
        """
        if not VISUAL_LIBS_AVAILABLE:
            return {
                "success": False,
                "error": "视觉库未安装"
            }
        
        try:
            # 截取屏幕
            if region:
                screenshot = pyautogui.screenshot(region=region)
            else:
                screenshot = pyautogui.screenshot()
            
            # 转换为 Base64
            buffer = BytesIO()
            screenshot.save(buffer, format='PNG')
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                "success": True,
                "image": f"data:image/png;base64,{img_base64}",
                "width": screenshot.width,
                "height": screenshot.height
            }
            
        except Exception as e:
            logger.error(f"截屏失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    # ==================== AI 自动化测试 ====================

    def run_stress_test(self, iterations: int = 10) -> Dict[str, Any]:
        """
        运行折线算法压力测试
        
        Args:
            iterations: 测试迭代次数
            
        Returns:
            测试结果
        """
        if not VISUAL_LIBS_AVAILABLE:
            return {"success": False, "error": "视觉库未安装"}
        
        logger.info(f"开始压力测试，迭代次数: {iterations}")
        
        results = {
            "success": True,
            "total_iterations": iterations,
            "successful": 0,
            "failed": 0,
            "logs": []
        }
        
        try:
            # 获取屏幕中心区域
            screen_width, screen_height = pyautogui.size()
            center_x, center_y = screen_width // 2, screen_height // 2
            
            for i in range(iterations):
                try:
                    # 生成随机坐标
                    import random
                    x1 = center_x + random.randint(-200, 200)
                    y1 = center_y + random.randint(-200, 200)
                    x2 = center_x + random.randint(-200, 200)
                    y2 = center_y + random.randint(-200, 200)
                    
                    # 模拟拖拽连线
                    pyautogui.moveTo(x1, y1, duration=0.2)
                    pyautogui.click()
                    time.sleep(0.1)
                    pyautogui.dragTo(x2, y2, duration=0.3)
                    
                    results["successful"] += 1
                    results["logs"].append(f"迭代 {i+1}: 成功 ({x1},{y1}) -> ({x2},{y2})")
                    
                except Exception as e:
                    results["failed"] += 1
                    results["logs"].append(f"迭代 {i+1}: 失败 - {str(e)}")
                
                time.sleep(0.2)
            
            logger.info(f"压力测试完成: {results['successful']}/{iterations} 成功")
            
        except Exception as e:
            results["success"] = False
            results["error"] = str(e)
        
        return results

    def execute_ai_command(self, natural_language: str) -> Dict[str, Any]:
        """
        执行自然语言驱动的测试指令
        
        Args:
            natural_language: 自然语言指令，如 "画一个红色的矩形"
            
        Returns:
            执行结果
        """
        if not self.ai_client:
            return {
                "success": False,
                "error": "AI 客户端未初始化，请提供 API Key"
            }
        
        logger.info(f"执行 AI 指令: {natural_language}")
        
        try:
            # 调用 DeepSeek 解析指令
            response = self.ai_client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个流程图编辑器自动化测试助手。用户会用自然语言描述操作，你需要将其转换为具体的鼠标操作指令。返回 JSON 格式，包含 action（如 'draw_rect', 'draw_circle', 'draw_line'）和参数（如坐标、颜色等）。"
                    },
                    {
                        "role": "user",
                        "content": natural_language
                    }
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"AI 响应: {ai_response}")
            
            # 这里应该解析 AI 响应并执行相应操作
            # 简化版本：直接返回 AI 的理解
            return {
                "success": True,
                "command": natural_language,
                "ai_interpretation": ai_response,
                "executed": False,
                "message": "AI 指令解析完成，实际执行功能待实现"
            }
            
        except Exception as e:
            logger.error(f"AI 指令执行失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def verify_visual_result(self, expected_pattern: str) -> Dict[str, Any]:
        """
        使用 OpenCV 验证视觉结果
        
        Args:
            expected_pattern: 期望的视觉模式（如 "line", "rectangle"）
            
        Returns:
            验证结果
        """
        if not VISUAL_LIBS_AVAILABLE:
            return {"success": False, "error": "视觉库未安装"}
        
        logger.info(f"验证视觉结果: {expected_pattern}")
        
        try:
            # 截取当前屏幕
            screenshot = pyautogui.screenshot()
            img_array = np.array(screenshot)
            img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # 简单的边缘检测
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            
            # 统计边缘像素
            edge_pixels = np.sum(edges > 0)
            total_pixels = edges.size
            edge_ratio = edge_pixels / total_pixels
            
            return {
                "success": True,
                "pattern": expected_pattern,
                "edge_ratio": round(edge_ratio, 4),
                "verified": edge_ratio > 0.01,  # 简单阈值判断
                "message": "检测到图形元素" if edge_ratio > 0.01 else "未检测到明显图形"
            }
            
        except Exception as e:
            logger.error(f"视觉验证失败: {e}")
            return {
                "success": False,
                "error": str(e)
            }

