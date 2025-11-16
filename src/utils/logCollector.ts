/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type LogLevel = 'LOG' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  messages: any[];
}

// FIX: Define a type for the specific console methods we are patching to avoid type conflicts.
type LoggableConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

class LogCollector {
  private logs: LogEntry[] = [];
  private originalConsole: Partial<Console> = {};
  private isStarted = false;

  public start(): void {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;

    // FIX: Use the more specific type for the methods being patched. `keyof Console` is too broad
    // and includes methods with incompatible signatures (e.g., `assert`, `time`), causing a type error.
    const levels: Record<LogLevel, LoggableConsoleMethod> = {
      LOG: 'log',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      DEBUG: 'debug',
    };

    for (const [level, method] of Object.entries(levels)) {
      // The original code fails because `method` is inferred as a generic `string`,
      // causing TypeScript to try and reconcile all possible function signatures on `console`.
      // We know `method` is one of our loggable methods, so we can safely patch it.
      const m = method as LoggableConsoleMethod;
      this.originalConsole[m] = console[m];
      (console as any)[m] = (...args: any[]) => {
        this.logs.push({
          timestamp: new Date(),
          level: level as LogLevel,
          messages: args,
        });
        // We know `this.originalConsole[m]` is a function with the correct signature.
        this.originalConsole[m]?.apply(console, args);
      };
    }
  }

  private formatMessage(message: any): string {
    if (typeof message === 'object' && message !== null) {
      try {
        return JSON.stringify(message, null, 2);
      } catch (e) {
        return '[Unserializable Object]';
      }
    }
    return String(message);
  }

  public formatLogs(): string {
    return this.logs.map(entry => {
      const timestamp = entry.timestamp.toISOString();
      const messages = entry.messages.map(this.formatMessage).join(' ');
      return `[${timestamp}] [${entry.level}] ${messages}`;
    }).join('\n');
  }
}

export const logCollector = new LogCollector();
