#!/bin/bash

echo "Android MCP 日志监控工具"
echo "========================"
echo ""

LOG_FILE="android-mcp.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "日志文件不存在，等待创建..."
    touch "$LOG_FILE"
fi

echo "开始监控日志文件: $LOG_FILE"
echo "按 Ctrl+C 停止监控"
echo ""

# 显示最后10行已有的日志
if [ -s "$LOG_FILE" ]; then
    echo "=== 最近的日志 ==="
    tail -10 "$LOG_FILE"
    echo "=================="
    echo ""
fi

# 实时监控新的日志输出
tail -f "$LOG_FILE"