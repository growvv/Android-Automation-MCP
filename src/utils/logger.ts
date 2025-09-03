import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logFile: string;
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(logFile = 'android-mcp.log', logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug') {
    this.logFile = path.resolve(logFile);
    this.logLevel = logLevel;
    
    // Create log file if it doesn't exist
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
    
    this.info(`Logger initialized - Log file: ${this.logFile}`);
  }

  private writeLog(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}\n`;
    
    // Write to file first
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
    
    // Force flush and output to stderr for MCP
    process.stderr.write(logEntry);
  }

  debug(message: string, data?: any) {
    if (this.logLevel === 'debug') {
      this.writeLog('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    if (['debug', 'info'].includes(this.logLevel)) {
      this.writeLog('info', message, data);
    }
  }

  warn(message: string, data?: any) {
    if (['debug', 'info', 'warn'].includes(this.logLevel)) {
      this.writeLog('warn', message, data);
    }
  }

  error(message: string, data?: any) {
    this.writeLog('error', message, data);
  }

  clearLog() {
    try {
      fs.writeFileSync(this.logFile, '');
      this.info('Log file cleared');
    } catch (error) {
      this.error('Failed to clear log file', error);
    }
  }
}

// Create a singleton logger instance
export const logger = new Logger();