import * as vscode from 'vscode';

/**
 * Log levels for the output channel
 */
export enum LogLevel {
	Debug = 'DEBUG',
	Info = 'INFO',
	Warning = 'WARN',
	Error = 'ERROR'
}

/**
 * Service for logging messages to the Noted output channel
 * Provides a centralized logging mechanism visible in VS Code's Output panel
 */
export class LogService {
	private static instance: LogService;
	private outputChannel: vscode.OutputChannel;
	private minLogLevel: LogLevel = LogLevel.Info;

	private constructor() {
		this.outputChannel = vscode.window.createOutputChannel('Noted');
	}

	/**
	 * Get the singleton instance of LogService
	 */
	public static getInstance(): LogService {
		if (!LogService.instance) {
			LogService.instance = new LogService();
		}
		return LogService.instance;
	}

	/**
	 * Set the minimum log level to display
	 */
	public setMinLogLevel(level: LogLevel): void {
		this.minLogLevel = level;
	}

	/**
	 * Get the current minimum log level
	 */
	public getMinLogLevel(): LogLevel {
		return this.minLogLevel;
	}

	/**
	 * Check if a log level should be logged based on current min level
	 */
	private shouldLog(level: LogLevel): boolean {
		const levelOrder: Record<LogLevel, number> = {
			[LogLevel.Debug]: 0, [LogLevel.Info]: 1,
			[LogLevel.Warning]: 2, [LogLevel.Error]: 3
		};
		return levelOrder[level] >= levelOrder[this.minLogLevel];
	}

	/**
	 * Format a log message with timestamp and level
	 */
	private formatMessage(level: LogLevel, message: string, data?: any): string {
		const timestamp = new Date().toISOString().slice(11, 23); // Extracts HH:mm:ss.sss from YYYY-MM-DDTHH:mm:ss.sssZ
		let formatted = `[${timestamp}] [${level}] ${message}`;

		if (data !== undefined) {
			if (data instanceof Error) {
				formatted += `\n  Error: ${data.message}\n  Stack: ${data.stack}`;
			} else if (typeof data === 'object') {
				try {
					formatted += `\n  ${JSON.stringify(data, null, 2)}`;
				} catch (e) {
					formatted += `\n  [Unable to stringify object]`;
				}
			} else {
				formatted += `\n  ${data}`;
			}
		}

		return formatted;
	}

	/**
	 * Log a message to the output channel
	 */
	private log(level: LogLevel, message: string, data?: any): void {
		if (!this.shouldLog(level)) {
			return;
		}

		const formatted = this.formatMessage(level, message, data);
		this.outputChannel.appendLine(formatted);
	}

	/**
	 * Log a debug message (lowest priority)
	 */
	public debug(message: string, data?: any): void {
		this.log(LogLevel.Debug, message, data);
	}

	/**
	 * Log an info message
	 */
	public info(message: string, data?: any): void {
		this.log(LogLevel.Info, message, data);
	}

	/**
	 * Log a warning message
	 */
	public warn(message: string, data?: any): void {
		this.log(LogLevel.Warning, message, data);
	}

	/**
	 * Log an error message (highest priority)
	 */
	public error(message: string, error?: Error | any): void {
		this.log(LogLevel.Error, message, error);
	}

	/**
	 * Show the output channel in the UI
	 */
	public show(preserveFocus: boolean = true): void {
		this.outputChannel.show(preserveFocus);
	}

	/**
	 * Clear all messages from the output channel
	 */
	public clear(): void {
		this.outputChannel.clear();
	}

	/**
	 * Dispose of the output channel
	 */
	public dispose(): void {
		this.outputChannel.dispose();
	}
}

// Export a singleton instance for easy access
export const logger = LogService.getInstance();
