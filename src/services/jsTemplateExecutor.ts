/**
 * JavaScript Template Executor
 *
 * Safely executes JavaScript templates using QuickJS WebAssembly sandbox.
 * Templates use EJS-style syntax:
 * - <% code %> for JavaScript code blocks
 * - <%= expression %> for expressions that output values
 *
 * Security features:
 * - WebAssembly sandbox (no Node.js API access)
 * - Execution timeout (default 5 seconds)
 * - Memory limits (default 32MB)
 * - Output size limits (default 1MB)
 */

import { getQuickJS, QuickJSRuntime, QuickJSContext } from 'quickjs-emscripten';
import {
    NoteContext,
    TemplateExecutionOptions,
    TemplateExecutionResult,
    ParsedTemplate,
    DateHelper,
    TimeHelper
} from '../types/jsTemplates';
import { formatDateForNote, formatTimeForNote } from '../utils/dateHelpers';
import { DAY_NAMES, MONTH_NAMES } from '../constants';
import * as os from 'os';
import * as vscode from 'vscode';

/**
 * Default execution options
 */
const DEFAULT_OPTIONS: Required<TemplateExecutionOptions> = {
    timeout: 5000,           // 5 seconds
    memoryLimit: 32 * 1024 * 1024,  // 32MB
    maxOutputSize: 1024 * 1024      // 1MB
};

/**
 * JSTemplateExecutor class
 * Handles parsing and execution of JavaScript templates
 */
export class JSTemplateExecutor {
    private runtime: QuickJSRuntime | null = null;
    private options: Required<TemplateExecutionOptions>;

    /**
     * Create a new JSTemplateExecutor instance
     */
    constructor(options?: TemplateExecutionOptions) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Initialize the QuickJS runtime
     */
    private async initializeRuntime(): Promise<QuickJSRuntime> {
        if (!this.runtime) {
            const QuickJS = await getQuickJS();
            this.runtime = QuickJS.newRuntime();

            // Set memory limit
            this.runtime.setMemoryLimit(this.options.memoryLimit);

            // Set max stack size (helps prevent infinite recursion)
            this.runtime.setMaxStackSize(1024 * 1024); // 1MB stack
        }
        return this.runtime;
    }

    /**
     * Parse template source code and extract JavaScript code blocks and expressions
     *
     * @param templateSource - Template source with <% %> and <%= %> tags
     * @returns Parsed template structure
     */
    parseTemplate(templateSource: string): ParsedTemplate {
        const staticParts: string[] = [];
        const expressions: string[] = [];
        let code = '';

        // Parse template and extract code blocks
        const regex = /<%=?\s*([\s\S]*?)\s*%>/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        // Build output buffer
        code += 'let __output = "";\n';

        while ((match = regex.exec(templateSource)) !== null) {
            // Add static text before this tag
            const staticText = templateSource.substring(lastIndex, match.index);
            if (staticText) {
                staticParts.push(staticText);
                code += `__output += ${JSON.stringify(staticText)};\n`;
            }

            // Check if it's an expression (<%= %>) or code block (<% %>)
            const isExpression = match[0].startsWith('<%=');
            const content = match[1].trim();

            if (isExpression) {
                // Expression: evaluate and append to output
                expressions.push(content);
                code += `__output += String(${content});\n`;
            } else {
                // Code block: execute as-is
                code += `${content}\n`;
            }

            lastIndex = regex.lastIndex;
        }

        // Add remaining static text
        const remainingText = templateSource.substring(lastIndex);
        if (remainingText) {
            staticParts.push(remainingText);
            code += `__output += ${JSON.stringify(remainingText)};\n`;
        }

        // Return the output buffer
        code += '__output;';

        return {
            code,
            staticParts,
            expressions
        };
    }

    /**
     * Build the context object available to template code
     *
     * @param filename - Note filename
     * @param date - Date for template context
     * @returns Context object
     */
    private buildContext(filename: string, date: Date): NoteContext {
        const dateHelper = new DateHelper(date);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const weekday = DAY_NAMES[date.getDay()];
        const monthName = MONTH_NAMES[date.getMonth()];
        const user = os.userInfo().username;
        const workspace = vscode.workspace.workspaceFolders?.[0]?.name || 'workspace';
        const dateString = formatDateForNote(date);
        const timeString = formatTimeForNote(date);

        return {
            filename,
            date,
            dateHelper,
            timeHelper: TimeHelper,
            year,
            month,
            day,
            weekday,
            monthName,
            user,
            workspace,
            dateString,
            timeString
        };
    }

    /**
     * Execute JavaScript code in QuickJS sandbox with context
     *
     * @param code - JavaScript code to execute
     * @param context - Context object available to the code
     * @returns Execution result
     */
    async executeCode(code: string, context: NoteContext): Promise<TemplateExecutionResult> {
        const startTime = Date.now();
        let vm: QuickJSContext | undefined;

        try {
            // Initialize runtime
            const runtime = await this.initializeRuntime();

            // Create a new context for this execution
            vm = runtime.newContext();

            // Set execution timeout using interrupt handler
            // This properly handles infinite synchronous loops unlike setTimeout
            let interrupted = false;
            const deadline = Date.now() + this.options.timeout;

            runtime.setInterruptHandler(() => {
                const now = Date.now();
                if (now > deadline) {
                    interrupted = true;
                    return true; // Interrupt execution
                }
                return false; // Continue execution
            });

            try {
                // Inject context variables into the VM
                // We need to serialize the context to JSON and inject it
                const contextCode = this.buildContextCode(context);

                // Evaluate context setup code
                const contextResult = vm.evalCode(contextCode);
                if (contextResult.error) {
                    const error = vm.dump(contextResult.error);
                    contextResult.error.dispose();
                    throw new Error(`Context setup error: ${error}`);
                }
                contextResult.value.dispose();

                // Execute the template code
                const result = vm.evalCode(code);

                // Check if execution was interrupted
                if (interrupted) {
                    return {
                        output: '',
                        executionTime: Date.now() - startTime,
                        error: 'Template execution timeout exceeded'
                    };
                }

                if (result.error) {
                    const errorMsg = vm.dump(result.error);
                    result.error.dispose();

                    return {
                        output: '',
                        executionTime: Date.now() - startTime,
                        error: `Template execution error: ${errorMsg}`
                    };
                }

                // Get the output
                const output = vm.dump(result.value);
                result.value.dispose();

                // Check output size
                if (typeof output === 'string' && output.length > this.options.maxOutputSize) {
                    return {
                        output: '',
                        executionTime: Date.now() - startTime,
                        error: `Output size exceeds maximum allowed (${this.options.maxOutputSize} bytes)`
                    };
                }

                return {
                    output: String(output),
                    executionTime: Date.now() - startTime
                };
            } finally {
                // Clear interrupt handler
                runtime.setInterruptHandler(null as any);
            }
        } catch (error) {
            return {
                output: '',
                executionTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        } finally {
            // Clean up the context
            if (vm) {
                vm.dispose();
            }
        }
    }

    /**
     * Build JavaScript code that sets up the context in the VM
     *
     * @param context - Context object to inject
     * @returns JavaScript code string
     */
    private buildContextCode(context: NoteContext): string {
        // Build context setup code that only provides a single 'note' object
        // No top-level variables to avoid redundancy and confusion
        let code = '';

        // Add complete date helper implementation matching DateHelper class
        code += `
const dateHelper = {
    _internalDate: new Date(${context.date.getTime()}),

    format: function(pattern) {
        const year = this._internalDate.getFullYear();
        const month = (this._internalDate.getMonth() + 1).toString().padStart(2, '0');
        const day = this._internalDate.getDate().toString().padStart(2, '0');
        const hours = this._internalDate.getHours().toString().padStart(2, '0');
        const minutes = this._internalDate.getMinutes().toString().padStart(2, '0');
        const seconds = this._internalDate.getSeconds().toString().padStart(2, '0');

        return pattern
            .replace('YYYY', year.toString())
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    addDays: function(days) {
        const newDate = new Date(this._internalDate);
        newDate.setDate(newDate.getDate() + days);
        this._internalDate = newDate;
        return this;
    },

    addMonths: function(months) {
        const newDate = new Date(this._internalDate);
        newDate.setMonth(newDate.getMonth() + months);
        this._internalDate = newDate;
        return this;
    },

    getDayOfWeek: function() {
        return this._internalDate.getDay();
    },

    getDayName: function() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[this._internalDate.getDay()];
    },

    getMonthName: function() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return months[this._internalDate.getMonth()];
    },

    toISOString: function() {
        return this._internalDate.toISOString();
    },

    toDate: function() {
        return new Date(this._internalDate);
    }
};

const timeHelper = {
    format12Hour: function() {
        const date = new Date(${context.date.getTime()});
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return hours + ':' + minutes + ' ' + ampm;
    },
    format24Hour: function() {
        const date = new Date(${context.date.getTime()});
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return hours + ':' + minutes;
    },
    now: function() {
        return new Date().toISOString();
    }
};

// Create the single note object with all context values and helpers
// This is the ONLY variable available to templates - no top-level consts
const note = {
    filename: ${JSON.stringify(context.filename)},
    year: ${JSON.stringify(context.year)},
    month: ${JSON.stringify(context.month)},
    day: ${JSON.stringify(context.day)},
    weekday: ${JSON.stringify(context.weekday)},
    monthName: ${JSON.stringify(context.monthName)},
    user: ${JSON.stringify(context.user)},
    workspace: ${JSON.stringify(context.workspace)},
    dateString: ${JSON.stringify(context.dateString)},
    timeString: ${JSON.stringify(context.timeString)},
    date: new Date(${context.date.getTime()}),
    dateHelper: dateHelper,
    timeHelper: timeHelper
};
`;

        return code;
    }

    /**
     * Parse and execute a template
     *
     * @param templateSource - Template source code with <% %> and <%= %> tags
     * @param filename - Note filename (without extension)
     * @param date - Date for template context (defaults to current date)
     * @returns Execution result
     */
    async parseAndExecute(
        templateSource: string,
        filename: string,
        date: Date = new Date()
    ): Promise<TemplateExecutionResult> {
        try {
            // Parse the template
            const parsed = this.parseTemplate(templateSource);

            // Build context
            const context = this.buildContext(filename, date);

            // Execute the code
            return await this.executeCode(parsed.code, context);
        } catch (error) {
            return {
                output: '',
                executionTime: 0,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Dispose of the runtime and free resources
     */
    dispose(): void {
        if (this.runtime) {
            this.runtime.dispose();
            this.runtime = null;
        }
    }
}

/**
 * Create a new executor instance
 *
 * @param options - Execution options
 * @returns New executor instance
 */
export function createExecutor(options?: TemplateExecutionOptions): JSTemplateExecutor {
    return new JSTemplateExecutor(options);
}

/**
 * Execute a template string with default options
 *
 * @param templateSource - Template source code
 * @param filename - Note filename
 * @param date - Date for template context
 * @returns Execution result
 */
export async function executeTemplate(
    templateSource: string,
    filename: string,
    date?: Date
): Promise<TemplateExecutionResult> {
    const executor = new JSTemplateExecutor();
    try {
        return await executor.parseAndExecute(templateSource, filename, date);
    } finally {
        executor.dispose();
    }
}
