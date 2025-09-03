@echo off
echo Android MCP 日志监控工具
echo ========================
echo.

set LOG_FILE=android-mcp.log

if not exist "%LOG_FILE%" (
    echo 日志文件不存在，等待创建...
    echo. > "%LOG_FILE%"
)

echo 开始监控日志文件: %LOG_FILE%
echo 按 Ctrl+C 停止监控
echo.

echo === 最近的日志 ===
type "%LOG_FILE%" | findstr /E "" | tail -10 2>nul || type "%LOG_FILE%"
echo ==================
echo.

echo 实时监控日志输出...
echo 请在另一个终端运行你的 MCP 服务器
echo.

:monitor
timeout /t 1 /nobreak >nul
type "%LOG_FILE%" | findstr /E "" | tail -5 2>nul || type "%LOG_FILE%"
goto monitor