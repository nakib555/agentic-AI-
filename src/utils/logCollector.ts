
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type LogLevel = 'LOG' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  messages: any[];
}

type LoggableConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

class LogCollector {
  private logs: LogEntry[] = [];
  private originalConsole: Partial<Console> = {};
  private isStarted = false;
  private readonly MAX_LOGS = 5000;

  public start(): void {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;

    const levels: Record<LogLevel, LoggableConsoleMethod> = {
      LOG: 'log',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      DEBUG: 'debug',
    };

    for (const [level, method] of Object.entries(levels)) {
      const m = method as LoggableConsoleMethod;
      this.originalConsole[m] = console[m];
      
      (console as any)[m] = (...args: any[]) => {
        // Keep original behavior intact so developers still see logs in DevTools
        this.originalConsole[m]?.apply(console, args);
        
        // Capture log
        this.addLog(level as LogLevel, args);
      };
    }
    
    console.log('[LogCollector] Logging started. Max logs:', this.MAX_LOGS);
  }

  private addLog(level: LogLevel, args: any[]) {
      const timestamp = new Date().toISOString();
      
      // Simple serialization to avoid holding onto heavy object references that might cause memory leaks
      const safeArgs = args.map(arg => {
          try {
              if (arg instanceof Error) {
                  return { message: arg.message, stack: arg.stack, name: arg.name };
              }
              // For performance, we don't fully clone/stringify deep objects during capture,
              // but we store them. The MAX_LOGS limit protects us from OOM.
              return arg;
          } catch {
              return '[Unsafe Object]';
          }
      });

      this.logs.push({ timestamp, level, messages: safeArgs });
      
      if (this.logs.length > this.MAX_LOGS) {
          this.logs.shift();
      }
  }

  public formatLogs(): string {
    const metaHeader = `User Agent: ${navigator.userAgent}\nScreen: ${window.screen.width}x${window.screen.height}\nDPR: ${window.devicePixelRatio}\nTime: ${new Date().toISOString()}\n\n`;

    const logLines = this.logs.map(entry => {
      const messages = entry.messages.map(m => {
        if (typeof m === 'object' && m !== null) {
            try {
                return JSON.stringify(m, null, 2);
            } catch {
                return '[Circular/Object]';
            }
        }
        return String(m);
      }).join(' ');
      return `[${entry.timestamp}] [${entry.level}] ${messages}`;
    }).join('\n');

    return metaHeader + logLines;
  }
  
  public clear() {
      this.logs = [];
  }
}

export const logCollector = new LogCollector();
