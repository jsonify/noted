/**
 * AI Summarization command handlers
 * All commands are designed to be registered in extension.ts
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SummarizationService, SummaryOptions } from '../services/summarizationService';
import { AutoTagService } from '../services/autoTagService';
import { NoteItem } from '../providers/treeItems';
import { NotesTreeProvider } from '../providers/notesTreeProvider';
import { getNotesPath, getFileFormat } from '../services/configService';
import { readDirectoryWithTypes, writeFile, createDirectory } from '../services/fileSystemService';
import { formatTagForDisplay } from '../utils/tagHelpers';
import { PromptTemplateService } from '../services/promptTemplateService';
import { SPECIAL_FOLDERS } from '../constants';

/**
 * Class-based command handlers for AI Summarization
 * Encapsulates dependencies to avoid parameter drilling
 */
export class SummarizationCommands {
    constructor(
        private summarizationService: SummarizationService,
        private context: vscode.ExtensionContext,
        private notesProvider?: NotesTreeProvider
    ) {}

    /**
     * Handle summarizing a single note from tree view
     */
    public async handleSummarizeNote(noteItem: NoteItem): Promise<void> {
        if (noteItem.type !== 'note') {
            vscode.window.showErrorMessage('Please select a note to summarize');
            return;
        }

        try {
            // Prompt for template selection
            const options = await this.promptForTemplate();
            if (!options) {
                return; // User cancelled template selection
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Generating summary...',
                    cancellable: true
                },
                async (progress, token) => {
                    if (token.isCancellationRequested) {
                        return;
                    }

                    progress.report({ message: path.basename(noteItem.filePath) });
                    const summary = await this.summarizationService.summarizeNote(noteItem.filePath, options);

                    if (!token.isCancellationRequested) {
                        await this.displaySummary(summary, path.basename(noteItem.filePath), [noteItem.filePath]);
                    }
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle summarizing the currently open note
     */
    public async handleSummarizeCurrentNote(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No note is currently open');
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const notesPath = getNotesPath();

        // Check if the file is within the notes folder
        if (!notesPath || !filePath.startsWith(notesPath)) {
            vscode.window.showErrorMessage('Current file is not in the Notes folder');
            return;
        }

        // Check if it's a note file (.txt or .md)
        if (!filePath.endsWith('.txt') && !filePath.endsWith('.md')) {
            vscode.window.showErrorMessage('Current file is not a note file');
            return;
        }

        try {
            // Prompt for template selection
            const options = await this.promptForTemplate();
            if (!options) {
                return; // User cancelled template selection
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Generating summary...',
                    cancellable: true
                },
                async (progress, token) => {
                    if (token.isCancellationRequested) {
                        return;
                    }

                    progress.report({ message: path.basename(filePath) });
                    const summary = await this.summarizationService.summarizeNote(filePath, options);

                    if (!token.isCancellationRequested) {
                        await this.displaySummary(summary, path.basename(filePath), [filePath]);
                    }
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle summarizing recent notes (last 7 days)
     */
    public async handleSummarizeRecent(): Promise<void> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }

        try {
            // Get notes from last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentNotes = await this.getRecentNotes(notesPath, sevenDaysAgo);

            if (recentNotes.length === 0) {
                vscode.window.showInformationMessage('No notes found in the last 7 days');
                return;
            }

            // Prompt for template selection
            const options = await this.promptForTemplate();
            if (!options) {
                return; // User cancelled template selection
            }

            await this.summarizeWithProgress(
                recentNotes,
                `Recent Notes (Last 7 Days)`,
                `Analyzing ${recentNotes.length} notes from the last 7 days...`,
                options
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle summarizing notes from this week
     */
    public async handleSummarizeWeek(): Promise<void> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }

        try {
            // Get start of this week (Sunday)
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const weekNotes = await this.getRecentNotes(notesPath, startOfWeek);

            if (weekNotes.length === 0) {
                vscode.window.showInformationMessage('No notes found this week');
                return;
            }

            // Prompt for template selection
            const options = await this.promptForTemplate();
            if (!options) {
                return; // User cancelled template selection
            }

            await this.summarizeWithProgress(
                weekNotes,
                `This Week (${startOfWeek.toLocaleDateString()})`,
                `Analyzing ${weekNotes.length} notes from this week...`,
                options
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle summarizing notes from this month
     */
    public async handleSummarizeMonth(): Promise<void> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }

        try {
            // Get start of this month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const monthNotes = await this.getRecentNotes(notesPath, startOfMonth);

            if (monthNotes.length === 0) {
                vscode.window.showInformationMessage('No notes found this month');
                return;
            }

            // Prompt for template selection
            const options = await this.promptForTemplate();
            if (!options) {
                return; // User cancelled template selection
            }

            await this.summarizeWithProgress(
                monthNotes,
                `This Month (${startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`,
                `Analyzing ${monthNotes.length} notes from this month...`,
                options
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle summarizing notes from a custom date range
     */
    public async handleSummarizeCustomRange(): Promise<void> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }

        try {
            // Prompt for start date
            const startDateStr = await vscode.window.showInputBox({
                prompt: 'Enter start date (YYYY-MM-DD)',
                placeHolder: '2025-01-01',
                validateInput: (value) => {
                    if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        return 'Please enter a valid date in YYYY-MM-DD format';
                    }
                    return undefined;
                }
            });

            if (!startDateStr) {
                return; // User cancelled
            }

            // Prompt for end date
            const endDateStr = await vscode.window.showInputBox({
                prompt: 'Enter end date (YYYY-MM-DD)',
                placeHolder: '2025-01-31',
                validateInput: (value) => {
                    if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        return 'Please enter a valid date in YYYY-MM-DD format';
                    }
                    return undefined;
                }
            });

            if (!endDateStr) {
                return; // User cancelled
            }

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999); // End of day

            if (startDate > endDate) {
                vscode.window.showErrorMessage('Start date must be before end date');
                return;
            }

            const rangeNotes = await this.getNotesInRange(notesPath, startDate, endDate);

            if (rangeNotes.length === 0) {
                vscode.window.showInformationMessage(`No notes found between ${startDateStr} and ${endDateStr}`);
                return;
            }

            // Prompt for template selection
            const options = await this.promptForTemplate();
            if (!options) {
                return; // User cancelled template selection
            }

            await this.summarizeWithProgress(
                rangeNotes,
                `Custom Range (${startDateStr} to ${endDateStr})`,
                `Analyzing ${rangeNotes.length} notes from custom range...`,
                options
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle clearing the summary cache
     */
    public async handleClearSummaryCache(): Promise<void> {
        const answer = await vscode.window.showWarningMessage(
            'Clear all cached summaries?',
            { modal: true },
            'Clear Cache',
            'Cancel'
        );

        if (answer !== 'Clear Cache') {
            return;
        }

        try {
            await this.summarizationService.clearCache();
            const stats = this.summarizationService.getCacheStats();
            vscode.window.showInformationMessage(`Summary cache cleared. Cache size: ${stats.size}/${stats.maxSize}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Handle summarizing selected text and inserting summary below the selection
     */
    public async handleSummarizeSelection(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No editor is currently open');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('No text is selected. Please select some text to summarize.');
            return;
        }

        const selectedText = editor.document.getText(selection);
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('Selected text is empty or contains only whitespace');
            return;
        }

        try {
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Summarizing selection...',
                    cancellable: true
                },
                async (progress, token) => {
                    if (token.isCancellationRequested) {
                        return;
                    }

                    const summary = await this.summarizationService.summarizeSelection(selectedText);

                    if (token.isCancellationRequested) {
                        return;
                    }

                    // Insert summary below the selection
                    const endPosition = selection.end;
                    const insertPosition = new vscode.Position(endPosition.line + 1, 0);

                    // Format the summary with header (extra blank line before header)
                    const summaryText = `\n\n## Summary of Selection\n\n${summary}\n`;

                    await editor.edit(editBuilder => {
                        // If we're at the end of a line, add a newline first
                        const lineText = editor.document.lineAt(endPosition.line).text;
                        if (endPosition.character === lineText.length) {
                            editBuilder.insert(new vscode.Position(endPosition.line, lineText.length), summaryText);
                        } else {
                            // Insert at the beginning of the next line
                            editBuilder.insert(insertPosition, summaryText);
                        }
                    });

                    vscode.window.showInformationMessage('Summary inserted below selection');
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    /**
     * Prompt user to select a template for summarization
     */
    private async promptForTemplate(): Promise<SummaryOptions | null> {
        const promptTemplateService = new PromptTemplateService(this.context);

        const template = await promptTemplateService.pickTemplate();

        if (!template) {
            return null; // User cancelled
        }

        return {
            promptTemplate: template
        };
    }

    /**
     * Display summary in a new editor tab with optional auto-tagging prompt
     * Saves the summary directly to the Inbox folder with proper naming
     */
    private async displaySummary(
        summary: string,
        title: string,
        sourcePaths: string[],
        autoTagService?: AutoTagService,
        offerAutoTag: boolean = false
    ): Promise<void> {
        const notesPath = getNotesPath();
        if (!notesPath) {
            vscode.window.showErrorMessage('Notes folder not configured');
            return;
        }

        // Create Inbox folder if it doesn't exist
        const inboxPath = path.join(notesPath, SPECIAL_FOLDERS.INBOX);
        await createDirectory(inboxPath);

        // Generate filename: "summary-" + original filename (or sanitized title for multi-note summaries)
        const fileFormat = getFileFormat();
        let baseFilename: string;

        if (sourcePaths.length === 1) {
            // Single note: use original filename
            const originalName = path.basename(sourcePaths[0], path.extname(sourcePaths[0]));
            baseFilename = `summary-${originalName}`;
        } else {
            // Multiple notes: sanitize the title
            baseFilename = 'summary-' + title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
        }

        // Create full filename with timestamp to avoid collisions
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `${baseFilename}-${timestamp}.${fileFormat}`;
        const filePath = path.join(inboxPath, filename);

        // Create file content
        const timestampReadable = now.toLocaleString();
        const sourceList = sourcePaths.map(p => `  - ${path.basename(p)}`).join('\n');

        const fullContent = `# Summary: ${title}

Generated: ${timestampReadable}
Source: ${sourcePaths.length} note${sourcePaths.length > 1 ? 's' : ''}

${sourcePaths.length > 1 ? `## Source Notes\n${sourceList}\n\n` : ''}## Summary

${summary}

---
Generated by GitHub Copilot • Noted Extension`;

        // Write file to Inbox
        await writeFile(filePath, fullContent);

        // Open the saved file
        const doc = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(doc, { preview: false });

        // Refresh the tree view to show the new file
        if (this.notesProvider) {
            this.notesProvider.refresh();
        }

        // Show success message
        vscode.window.showInformationMessage(`Summary saved to: ${path.join(SPECIAL_FOLDERS.INBOX, filename)}`);

        // Offer auto-tagging if enabled and service provided
        if (offerAutoTag && autoTagService && sourcePaths.length === 1) {
            // TODO: Implement promptForAutoTagging function
            // await promptForAutoTagging(autoTagService, sourcePaths[0], summary);
        }
    }

    /**
     * Summarize notes with enhanced progress tracking
     */
    private async summarizeWithProgress(
        notePaths: string[],
        title: string,
        progressTitle: string,
        options?: SummaryOptions
    ): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: progressTitle,
                cancellable: true
            },
            async (progress, token) => {
                // Check if cancelled before starting
                if (token.isCancellationRequested) {
                    return;
                }

                // Report initial progress
                progress.report({ increment: 0, message: 'Starting...' });

                // If more than 10 notes, summarize individually with progress
                if (notePaths.length > 10) {
                    const summaries: string[] = [];
                    const increment = 100 / notePaths.length;

                    for (let i = 0; i < notePaths.length; i++) {
                        if (token.isCancellationRequested) {
                            vscode.window.showInformationMessage('Summarization cancelled');
                            return;
                        }

                        const notePath = notePaths[i];
                        const noteBasename = path.basename(notePath);

                        progress.report({
                            increment,
                            message: `Processing ${i + 1} of ${notePaths.length}: ${noteBasename}`
                        });

                        try {
                            const summary = await this.summarizationService.summarizeNote(notePath, options);
                            summaries.push(`### ${noteBasename}\n${summary}\n`);
                        } catch (error) {
                            summaries.push(`### ${noteBasename}\n*Error: ${error instanceof Error ? error.message : String(error)}*\n`);
                        }
                    }

                    // Combine summaries
                    const combinedSummary = summaries.join('\n');
                    await this.displaySummary(combinedSummary, title, notePaths);
                } else {
                    // For 10 or fewer notes, use batch summarization
                    const summary = await this.summarizationService.summarizeNotes(notePaths, options);
                    await this.displaySummary(summary, title, notePaths);
                }
            }
        );
    }

    /**
     * Get all notes modified since a given date
     */
    private async getRecentNotes(notesPath: string, since: Date): Promise<string[]> {
        const notes: { path: string; mtime: number }[] = [];

        async function scanDirectory(dir: string): Promise<void> {
            try {
                const entries = await readDirectoryWithTypes(dir);

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        // Skip special folders
                        if (entry.name === '.noted-templates' || entry.name === '.archive') {
                            continue;
                        }
                        await scanDirectory(fullPath);
                    } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                        try {
                            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
                            if (stat.mtime >= since.getTime()) {
                                notes.push({ path: fullPath, mtime: stat.mtime });
                            }
                        } catch (error) {
                            // Error stating file, skip it
                        }
                    }
                }
            } catch (error) {
                // Error reading directory, skip it
            }
        }

        await scanDirectory(notesPath);

        // Sort by modification time (most recent first)
        notes.sort((a, b) => b.mtime - a.mtime);

        return notes.map(note => note.path);
    }

    /**
     * Get all notes within a date range (inclusive)
     */
    private async getNotesInRange(notesPath: string, startDate: Date, endDate: Date): Promise<string[]> {
        const notes: { path: string; mtime: number }[] = [];

        async function scanDirectory(dir: string): Promise<void> {
            try {
                const entries = await readDirectoryWithTypes(dir);

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        // Skip special folders
                        if (entry.name === '.noted-templates' || entry.name === '.archive') {
                            continue;
                        }
                        await scanDirectory(fullPath);
                    } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                        try {
                            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
                            if (stat.mtime >= startDate.getTime() && stat.mtime <= endDate.getTime()) {
                                notes.push({ path: fullPath, mtime: stat.mtime });
                            }
                        } catch (error) {
                            // Error stating file, skip it
                        }
                    }
                }
            } catch (error) {
                // Error reading directory, skip it
            }
        }

        await scanDirectory(notesPath);

        // Sort by modification time (most recent first)
        notes.sort((a, b) => b.mtime - a.mtime);

        return notes.map(note => note.path);
    }
}
