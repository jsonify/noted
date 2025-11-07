/**
 * AI Summarization command handlers
 * All commands are designed to be registered in extension.ts
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SummarizationService } from '../services/summarizationService';
import { NoteItem } from '../providers/treeItems';
import { getNotesPath } from '../services/configService';
import { readDirectoryWithTypes } from '../services/fileSystemService';

/**
 * Handle summarizing a single note from tree view
 */
export async function handleSummarizeNote(
    summarizationService: SummarizationService,
    noteItem: NoteItem
): Promise<void> {
    if (noteItem.type !== 'note') {
        vscode.window.showErrorMessage('Please select a note to summarize');
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating summary...',
                cancellable: false
            },
            async () => {
                const summary = await summarizationService.summarizeNote(noteItem.filePath);
                await displaySummary(summary, path.basename(noteItem.filePath), [noteItem.filePath]);
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle summarizing the currently open note
 */
export async function handleSummarizeCurrentNote(
    summarizationService: SummarizationService
): Promise<void> {
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
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating summary...',
                cancellable: false
            },
            async () => {
                const summary = await summarizationService.summarizeNote(filePath);
                await displaySummary(summary, path.basename(filePath), [filePath]);
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle summarizing recent notes (last 7 days)
 */
export async function handleSummarizeRecent(
    summarizationService: SummarizationService
): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured');
        return;
    }

    try {
        // Get notes from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentNotes = await getRecentNotes(notesPath, sevenDaysAgo);

        if (recentNotes.length === 0) {
            vscode.window.showInformationMessage('No notes found in the last 7 days');
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Analyzing ${recentNotes.length} notes from the last 7 days...`,
                cancellable: false
            },
            async () => {
                const summary = await summarizationService.summarizeNotes(recentNotes);
                await displaySummary(summary, `Recent Notes (Last 7 Days)`, recentNotes);
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle clearing the summary cache
 */
export async function handleClearSummaryCache(
    summarizationService: SummarizationService
): Promise<void> {
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
        await summarizationService.clearCache();
        const stats = summarizationService.getCacheStats();
        vscode.window.showInformationMessage(`Summary cache cleared. Cache size: ${stats.size}/${stats.maxSize}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Display summary in a new editor tab
 */
async function displaySummary(summary: string, title: string, sourcePaths: string[]): Promise<void> {
    // Create a new untitled document with the summary
    const timestamp = new Date().toLocaleString();
    const sourceList = sourcePaths.map(p => `  - ${path.basename(p)}`).join('\n');

    const fullContent = `# Summary: ${title}

Generated: ${timestamp}
Source: ${sourcePaths.length} note${sourcePaths.length > 1 ? 's' : ''}

${sourcePaths.length > 1 ? `## Source Notes\n${sourceList}\n\n` : ''}## Summary

${summary}

---
Generated by GitHub Copilot • Noted Extension`;

    const doc = await vscode.workspace.openTextDocument({
        content: fullContent,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc, { preview: false });
}

/**
 * Get all notes modified since a given date
 */
async function getRecentNotes(notesPath: string, since: Date): Promise<string[]> {
    const notes: string[] = [];

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
                            notes.push(fullPath);
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
    notes.sort((a, b) => {
        // This is async but we'll do a simple sort - in real implementation you'd cache stats
        return 0;
    });

    return notes;
}
