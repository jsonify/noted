/**
 * Summary History command handlers
 * Commands for viewing, comparing, restoring, and clearing summary versions
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { SummarizationService } from '../services/summarizationService';
import { SummaryHistoryService, SummaryVersion } from '../services/summaryHistoryService';
import { NoteItem } from '../providers/treeItems';
import { getNotesPath } from '../services/configService';

/**
 * Handle showing summary history for the current note
 */
export async function handleShowSummaryHistory(
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

    const historyService = summarizationService.getHistoryService();
    if (!historyService) {
        vscode.window.showErrorMessage('Summary history service not initialized');
        return;
    }

    try {
        const versions = await historyService.getVersions(filePath);

        if (versions.length === 0) {
            vscode.window.showInformationMessage('No summary history found for this note');
            return;
        }

        // Create quick pick items for each version
        const items = versions.map((version, index) => {
            const label = historyService.formatVersionForDisplay(version, index, versions.length);
            const description = version.model;
            const detail = historyService.formatVersionMetadata(version);

            return {
                label,
                description,
                detail,
                version,
                index
            };
        }).reverse(); // Show newest first

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a summary version to view',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return; // User cancelled
        }

        // Display the selected summary
        await displaySummaryVersion(filePath, selected.version, selected.index, versions.length);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to load summary history: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle comparing two summary versions
 */
export async function handleCompareSummaries(
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

    const historyService = summarizationService.getHistoryService();
    if (!historyService) {
        vscode.window.showErrorMessage('Summary history service not initialized');
        return;
    }

    try {
        const versions = await historyService.getVersions(filePath);

        if (versions.length < 2) {
            vscode.window.showInformationMessage('Need at least 2 versions to compare. Current versions: ' + versions.length);
            return;
        }

        // Create quick pick items for selecting first version
        const items = versions.map((version, index) => {
            const label = historyService.formatVersionForDisplay(version, index, versions.length);
            const description = version.model;

            return {
                label,
                description,
                version,
                index
            };
        }).reverse(); // Show newest first

        // Select first version
        const first = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select first version to compare',
            matchOnDescription: true
        });

        if (!first) {
            return; // User cancelled
        }

        // Select second version
        const second = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select second version to compare with',
            matchOnDescription: true
        });

        if (!second) {
            return; // User cancelled
        }

        if (first.index === second.index) {
            vscode.window.showErrorMessage('Please select two different versions');
            return;
        }

        // Create temporary documents for comparison
        const leftContent = formatSummaryForComparison(filePath, first.version, first.index, versions.length);
        const rightContent = formatSummaryForComparison(filePath, second.version, second.index, versions.length);

        const leftUri = vscode.Uri.parse(`untitled:Summary Version ${first.index + 1}`);
        const rightUri = vscode.Uri.parse(`untitled:Summary Version ${second.index + 1}`);

        // Open diff editor
        await vscode.commands.executeCommand('vscode.diff',
            leftUri.with({ scheme: 'data', path: leftContent }),
            rightUri.with({ scheme: 'data', path: rightContent }),
            `Version ${first.index + 1} ↔ Version ${second.index + 1}`
        );

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to compare summaries: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle restoring a summary version (shows summary in editor)
 */
export async function handleRestoreSummaryVersion(
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

    const historyService = summarizationService.getHistoryService();
    if (!historyService) {
        vscode.window.showErrorMessage('Summary history service not initialized');
        return;
    }

    try {
        const versions = await historyService.getVersions(filePath);

        if (versions.length === 0) {
            vscode.window.showInformationMessage('No summary history found for this note');
            return;
        }

        // Create quick pick items for each version
        const items = versions.map((version, index) => {
            const label = historyService.formatVersionForDisplay(version, index, versions.length);
            const description = version.model;
            const detail = historyService.formatVersionMetadata(version);

            return {
                label,
                description,
                detail,
                version,
                index
            };
        }).reverse(); // Show newest first

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a summary version to restore',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return; // User cancelled
        }

        // Confirm restoration
        const answer = await vscode.window.showInformationMessage(
            `Restore summary from ${historyService.formatVersionForDisplay(selected.version, selected.index, versions.length)}?`,
            { modal: true },
            'Restore',
            'Cancel'
        );

        if (answer !== 'Restore') {
            return;
        }

        // Display the summary as a new document (user can copy/paste where needed)
        await displaySummaryVersion(filePath, selected.version, selected.index, versions.length, true);

        vscode.window.showInformationMessage('Summary version opened in new editor. You can now copy/paste as needed.');

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to restore summary: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handle clearing summary history
 */
export async function handleClearSummaryHistory(
    summarizationService: SummarizationService
): Promise<void> {
    const historyService = summarizationService.getHistoryService();
    if (!historyService) {
        vscode.window.showErrorMessage('Summary history service not initialized');
        return;
    }

    // Ask user what to clear
    const choice = await vscode.window.showQuickPick(
        [
            { label: 'Clear history for current note', value: 'current' },
            { label: 'Clear all summary history', value: 'all' }
        ],
        { placeHolder: 'What would you like to clear?' }
    );

    if (!choice) {
        return; // User cancelled
    }

    if (choice.value === 'current') {
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

        // Confirm
        const answer = await vscode.window.showWarningMessage(
            `Clear summary history for ${path.basename(filePath)}?`,
            { modal: true },
            'Clear',
            'Cancel'
        );

        if (answer !== 'Clear') {
            return;
        }

        try {
            await historyService.clearHistory(filePath);
            vscode.window.showInformationMessage('Summary history cleared for current note');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clear history: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else {
        // Clear all
        const stats = await historyService.getStats();

        const answer = await vscode.window.showWarningMessage(
            `Clear all summary history? This will delete ${stats.totalVersions} version(s) across ${stats.totalFiles} note(s).`,
            { modal: true },
            'Clear All',
            'Cancel'
        );

        if (answer !== 'Clear All') {
            return;
        }

        try {
            await historyService.clearAllHistory();
            vscode.window.showInformationMessage('All summary history cleared');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to clear history: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * Handle showing summary history stats
 */
export async function handleShowSummaryHistoryStats(
    summarizationService: SummarizationService
): Promise<void> {
    const historyService = summarizationService.getHistoryService();
    if (!historyService) {
        vscode.window.showErrorMessage('Summary history service not initialized');
        return;
    }

    try {
        const stats = await historyService.getStats();

        const message = [
            'Summary History Statistics:',
            `• Total notes with history: ${stats.totalFiles}`,
            `• Total versions stored: ${stats.totalVersions}`,
            `• Max versions per note: ${stats.maxVersions}`,
            `• Average versions per note: ${stats.totalFiles > 0 ? (stats.totalVersions / stats.totalFiles).toFixed(1) : '0'}`
        ].join('\n');

        vscode.window.showInformationMessage(message, { modal: false });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Display a summary version in a new editor
 */
async function displaySummaryVersion(
    filePath: string,
    version: SummaryVersion,
    index: number,
    total: number,
    forRestore: boolean = false
): Promise<void> {
    const filename = path.basename(filePath);
    const versionLabel = `Version ${index + 1} of ${total}`;
    const timestamp = version.timestamp.toLocaleString();

    const content = [
        `# Summary: ${filename}`,
        forRestore ? '## Restored Version' : '## Version History',
        '',
        `**${versionLabel}**`,
        `Generated: ${timestamp}`,
        `Model: ${version.model}`,
        `Length: ${version.options.maxLength || 'medium'}`,
        `Format: ${version.options.format || 'structured'}`,
        version.promptTemplate ? `Template: ${version.promptTemplate}` : '',
        '',
        '## Summary',
        '',
        version.summary,
        '',
        '---',
        forRestore ? 'Copy and paste this summary where needed' : 'Generated by GitHub Copilot • Noted Extension'
    ].filter(line => line !== '').join('\n');

    const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'markdown'
    });

    await vscode.window.showTextDocument(doc, { preview: false });
}

/**
 * Format a summary version for comparison in diff view
 */
function formatSummaryForComparison(
    filePath: string,
    version: SummaryVersion,
    index: number,
    total: number
): string {
    const filename = path.basename(filePath);
    const versionLabel = `Version ${index + 1} of ${total}`;
    const timestamp = version.timestamp.toLocaleString();

    return [
        `# Summary: ${filename}`,
        `## ${versionLabel}`,
        '',
        `Generated: ${timestamp}`,
        `Model: ${version.model}`,
        `Length: ${version.options.maxLength || 'medium'}`,
        `Format: ${version.options.format || 'structured'}`,
        version.promptTemplate ? `Template: ${version.promptTemplate}` : '',
        '',
        '## Summary',
        '',
        version.summary
    ].filter(line => line !== '').join('\n');
}
