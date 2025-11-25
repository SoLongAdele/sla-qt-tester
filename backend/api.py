"""
Python API 层
暴露给 JavaScript 的所有方法
"""
from typing import Dict, List, Any
from core.calculator import add, subtract, multiply, divide, power
from core.user_service import UserService
from core.services import QualityManager, VisualAgent
from core.utils.logger import logger


class API:
    """
    JS Bridge API
    所有方法都会自动暴露为 window.pywebview.api.xxx
    """

    def __init__(self):
        self.user_service = UserService()
        self.quality_manager = QualityManager()
        self.visual_agent = VisualAgent()
        logger.info("API 初始化完成")

    # ==================== 计算器 API ====================

    def add(self, a: float, b: float) -> float:
        """加法"""
        try:
            result = add(a, b)
            logger.info(f"计算: {a} + {b} = {result}")
            return result
        except Exception as e:
            logger.error(f"加法错误: {e}")
            raise

    def subtract(self, a: float, b: float) -> float:
        """减法"""
        try:
            return subtract(a, b)
        except Exception as e:
            logger.error(f"减法错误: {e}")
            raise

    def multiply(self, a: float, b: float) -> float:
        """乘法"""
        try:
            return multiply(a, b)
        except Exception as e:
            logger.error(f"乘法错误: {e}")
            raise

    def divide(self, a: float, b: float) -> float:
        """除法"""
        try:
            return divide(a, b)
        except Exception as e:
            logger.error(f"除法错误: {e}")
            return {"error": str(e)}

    def power(self, a: float, b: float) -> float:
        """幂运算"""
        try:
            return power(a, b)
        except Exception as e:
            logger.error(f"幂运算错误: {e}")
            raise

    # ==================== 用户管理 API ====================

    def create_user(self, name: str, email: str) -> Dict:
        """创建用户"""
        try:
            user = self.user_service.create_user(name, email)
            logger.info(f"创建用户: {user}")
            return user
        except Exception as e:
            logger.error(f"创建用户错误: {e}")
            return {"error": str(e)}

    def get_user(self, user_id: int) -> Dict:
        """获取用户"""
        try:
            user = self.user_service.get_user(user_id)
            if user:
                return user
            return {"error": "用户不存在"}
        except Exception as e:
            logger.error(f"获取用户错误: {e}")
            return {"error": str(e)}

    def list_users(self) -> List[Dict]:
        """列出所有用户"""
        try:
            return self.user_service.list_users()
        except Exception as e:
            logger.error(f"列出用户错误: {e}")
            return []

    def delete_user(self, user_id: int) -> Dict:
        """删除用户"""
        try:
            success = self.user_service.delete_user(user_id)
            return {"success": success}
        except Exception as e:
            logger.error(f"删除用户错误: {e}")
            return {"error": str(e)}

    # ==================== 系统 API ====================

    def get_version(self) -> str:
        """获取版本号"""
        return "1.0.0"

    def ping(self) -> str:
        """测试连接"""
        return "pong"

    def get_system_info(self) -> Dict[str, Any]:
        """获取系统信息"""
        import platform
        return {
            "platform": platform.system(),
            "platform_version": platform.version(),
            "python_version": platform.python_version(),
            "machine": platform.machine(),
        }

    # ==================== 模块 A: 质量管理 API ====================

    def run_static_analysis(self) -> Dict[str, Any]:
        """运行静态代码分析"""
        try:
            return self.quality_manager.run_static_analysis()
        except Exception as e:
            logger.error(f"静态分析错误: {e}")
            return {"success": False, "error": str(e)}

    def scan_unit_tests(self) -> Dict[str, Any]:
        """扫描单元测试用例"""
        try:
            return self.quality_manager.scan_unit_tests()
        except Exception as e:
            logger.error(f"扫描测试错误: {e}")
            return {"success": False, "error": str(e)}

    def run_unit_test(self, test_path: str) -> Dict[str, Any]:
        """运行指定的单元测试"""
        try:
            return self.quality_manager.run_unit_test(test_path)
        except Exception as e:
            logger.error(f"运行测试错误: {e}")
            return {"success": False, "error": str(e)}

    def get_code_metrics(self) -> Dict[str, Any]:
        """获取代码度量信息"""
        try:
            return self.quality_manager.get_code_metrics()
        except Exception as e:
            logger.error(f"获取度量错误: {e}")
            return {"success": False, "error": str(e)}

    # ==================== 模块 B: 视觉测试 API ====================

    def launch_target_app(self) -> Dict[str, Any]:
        """启动被测应用程序"""
        try:
            return self.visual_agent.launch_target_app()
        except Exception as e:
            logger.error(f"启动应用错误: {e}")
            return {"success": False, "error": str(e)}

    def close_target_app(self) -> Dict[str, Any]:
        """关闭被测应用程序"""
        try:
            return self.visual_agent.close_target_app()
        except Exception as e:
            logger.error(f"关闭应用错误: {e}")
            return {"success": False, "error": str(e)}

    def get_screen_frame(self) -> Dict[str, Any]:
        """获取屏幕截图帧"""
        try:
            return self.visual_agent.get_screen_frame()
        except Exception as e:
            logger.error(f"截屏错误: {e}")
            return {"success": False, "error": str(e)}

    def get_window_info(self) -> Dict[str, Any]:
        """获取窗口信息"""
        try:
            return self.visual_agent.get_window_info()
        except Exception as e:
            logger.error(f"获取窗口错误: {e}")
            return {"success": False, "error": str(e)}

    def focus_target_window(self, window_title: str = None) -> Dict[str, Any]:
        """聚焦目标窗口"""
        try:
            return self.visual_agent.focus_target_window(window_title)
        except Exception as e:
            logger.error(f"聚焦窗口错误: {e}")
            return {"success": False, "error": str(e)}

    def run_stress_test(self, iterations: int = 10) -> Dict[str, Any]:
        """运行压力测试"""
        try:
            return self.visual_agent.run_stress_test(iterations)
        except Exception as e:
            logger.error(f"压力测试错误: {e}")
            return {"success": False, "error": str(e)}

    def execute_ai_command(self, command: str) -> Dict[str, Any]:
        """执行 AI 自然语言指令"""
        try:
            return self.visual_agent.execute_ai_command(command)
        except Exception as e:
            logger.error(f"AI 指令错误: {e}")
            return {"success": False, "error": str(e)}

    def verify_visual_result(self, pattern: str) -> Dict[str, Any]:
        """验证视觉结果"""
        try:
            return self.visual_agent.verify_visual_result(pattern)
        except Exception as e:
            logger.error(f"视觉验证错误: {e}")
            return {"success": False, "error": str(e)}

    def set_deepseek_api_key(self, api_key: str) -> Dict[str, Any]:
        """设置 DeepSeek API Key"""
        try:
            from openai import OpenAI
            self.visual_agent.ai_client = OpenAI(
                api_key=api_key,
                base_url="https://api.deepseek.com"
            )
            logger.info("DeepSeek API Key 已设置")
            return {"success": True, "message": "API Key 设置成功"}
        except Exception as e:
            logger.error(f"设置 API Key 错误: {e}")
            return {"success": False, "error": str(e)}
