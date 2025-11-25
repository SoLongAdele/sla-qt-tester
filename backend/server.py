"""
开发服务器管理
"""
import subprocess
import time
import socket
from pathlib import Path
from .config import FRONTEND_DIR, DEV_SERVER_PORT
from core.utils.logger import logger


def is_port_open(port: int, host: str = "127.0.0.1") -> bool:
    """检查端口是否开放"""
    # 尝试 IPv4
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        if result == 0:
            return True
    except:
        pass
    
    # 尝试 IPv6
    try:
        sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(("::1", port))
        sock.close()
        if result == 0:
            return True
    except:
        pass
    
    return False


def start_vite() -> subprocess.Popen:
    """
    启动 Vite 开发服务器

    Returns:
        Vite 进程对象
    """
    logger.info("正在启动 Vite 开发服务器...")

    # 检查 frontend 目录
    if not FRONTEND_DIR.exists():
        raise FileNotFoundError(f"找不到前端目录: {FRONTEND_DIR}")

    # 检查 package.json
    package_json = FRONTEND_DIR / "package.json"
    if not package_json.exists():
        raise FileNotFoundError(f"找不到 package.json: {package_json}")

    # 启动 Vite
    try:
        # 尝试使用 pnpm，如果失败则使用 npm
        import shutil
        pnpm_cmd = shutil.which("pnpm")
        npm_cmd = shutil.which("npm")
        
        if pnpm_cmd:
            cmd = ["pnpm", "run", "dev"]
            logger.info("使用 pnpm 启动 Vite")
        elif npm_cmd:
            cmd = ["npm", "run", "dev"]
            logger.info("使用 npm 启动 Vite")
        else:
            raise FileNotFoundError("未找到 pnpm 或 npm，请先安装 Node.js")
        
        process = subprocess.Popen(
            cmd,
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=True,  # Windows 需要 shell=True 来执行 .cmd 文件
        )
        logger.info(f"Vite 进程已启动 (PID: {process.pid})")
        return process
    except Exception as e:
        logger.error(f"启动 Vite 失败: {e}")
        raise


def wait_vite_ready(timeout: int = 30) -> bool:
    """
    等待 Vite 服务器就绪

    Args:
        timeout: 超时时间（秒）

    Returns:
        是否成功启动
    """
    logger.info(f"等待 Vite 服务器启动 (端口 {DEV_SERVER_PORT} ...)...")

    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_open(DEV_SERVER_PORT):
            logger.info("✅ Vite 服务器已就绪")
            return True
        time.sleep(0.5)

    logger.error(f"❌ Vite 服务器启动超时 ({timeout}秒)")
    return False


def stop_vite(process: subprocess.Popen):
    """停止 Vite 服务器"""
    if process and process.poll() is None:
        logger.info("正在停止 Vite 服务器...")
        process.terminate()
        try:
            process.wait(timeout=5)
            logger.info("Vite 服务器已停止")
        except subprocess.TimeoutExpired:
            logger.warning("Vite 服务器未响应，强制终止")
            process.kill()
