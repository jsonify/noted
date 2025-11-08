import * as vscode from 'vscode';
import { tagManager } from './TagManager';
import { NoteTag } from './TagParser';

/**
 * Tag statistics and analytics
 */
export interface TagStatistics {
    totalTags: number;
    totalTaggedNotes: number;
    totalUntaggedNotes: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
    aiGeneratedTags: number;
    manualTags: number;
    averageTagsPerNote: number;
    recentlyAddedTags: Array<{ tag: string; addedAt: Date; note: string }>;
}

/**
 * Gather comprehensive tag statistics
 */
export async function gatherTagStatistics(): Promise<TagStatistics> {
    // Get all tags with counts
    const allTags = await tagManager.getAllTags();
    const totalTags = allTags.size;

    // Count notes
    const noteFiles = await getAllNoteFiles();
    const totalNotes = noteFiles.length;

    let totalTaggedNotes = 0;
    let aiGeneratedCount = 0;
    let manualCount = 0;
    let totalTagInstances = 0;
    const recentTags: Array<{ tag: string; addedAt: Date; note: string }> = [];

    // Analyze each note
    for (const filePath of noteFiles) {
        const tags = await tagManager.getNoteTags(filePath);
        if (tags.length > 0) {
            totalTaggedNotes++;
            totalTagInstances += tags.length;

            // Count AI vs manual
            for (const tag of tags) {
                if (tag.source === 'ai') {
                    aiGeneratedCount++;
                } else {
                    manualCount++;
                }

                // Track recent tags (last 24 hours)
                const age = Date.now() - tag.addedAt.getTime();
                if (age < 24 * 60 * 60 * 1000) {
                    recentTags.push({
                        tag: tag.name,
                        addedAt: tag.addedAt,
                        note: getFileName(filePath)
                    });
                }
            }
        }
    }

    // Sort tags by usage
    const sortedTags = Array.from(allTags.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

    // Sort recent tags by date
    recentTags.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

    return {
        totalTags,
        totalTaggedNotes,
        totalUntaggedNotes: totalNotes - totalTaggedNotes,
        mostUsedTags: sortedTags.slice(0, 10),
        aiGeneratedTags: aiGeneratedCount,
        manualTags: manualCount,
        averageTagsPerNote: totalTaggedNotes > 0 ? totalTagInstances / totalTaggedNotes : 0,
        recentlyAddedTags: recentTags.slice(0, 10)
    };
}

/**
 * Show tag statistics in a webview
 */
export async function showTagStatistics(): Promise<void> {
    const stats = await gatherTagStatistics();

    const panel = vscode.window.createWebviewPanel(
        'tagStatistics',
        'Tag Statistics',
        vscode.ViewColumn.Beside,
        {}
    );

    panel.webview.html = generateStatisticsHTML(stats);
}

/**
 * Show tag statistics as a quick summary message
 */
export async function showTagStatisticsSummary(): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Calculating tag statistics...',
        cancellable: false
    }, async () => {
        const stats = await gatherTagStatistics();

        const message = `Tag Statistics:\n\n` +
            `Total Tags: ${stats.totalTags}\n` +
            `Tagged Notes: ${stats.totalTaggedNotes}\n` +
            `Untagged Notes: ${stats.totalUntaggedNotes}\n` +
            `Avg Tags/Note: ${stats.averageTagsPerNote.toFixed(1)}\n\n` +
            `Top 5 Tags:\n${stats.mostUsedTags.slice(0, 5).map(t => `  • ${t.tag} (${t.count})`).join('\n')}\n\n` +
            `AI Generated: ${stats.aiGeneratedTags}\n` +
            `Manual: ${stats.manualTags}`;

        const choice = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            'View Details'
        );

        if (choice === 'View Details') {
            await showTagStatistics();
        }
    });
}

/**
 * Generate HTML for statistics webview
 */
function generateStatisticsHTML(stats: TagStatistics): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                h1 {
                    color: var(--vscode-textLink-foreground);
                    font-size: 28px;
                    margin-bottom: 30px;
                    border-bottom: 2px solid var(--vscode-textLink-foreground);
                    padding-bottom: 10px;
                }
                h2 {
                    color: var(--vscode-textLink-activeForeground);
                    font-size: 20px;
                    margin-top: 30px;
                    margin-bottom: 15px;
                }
                .stat-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-card {
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid var(--vscode-textLink-foreground);
                }
                .stat-value {
                    font-size: 36px;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                }
                .stat-label {
                    font-size: 14px;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 5px;
                }
                .tag-list {
                    list-style: none;
                    padding: 0;
                }
                .tag-item {
                    padding: 10px;
                    margin-bottom: 5px;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .tag-name {
                    font-family: 'Courier New', monospace;
                    color: var(--vscode-textLink-activeForeground);
                }
                .tag-count {
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                }
                .progress-bar {
                    height: 20px;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-top: 10px;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--vscode-textLink-foreground), var(--vscode-textLink-activeForeground));
                    transition: width 0.3s ease;
                }
                .recent-tag {
                    padding: 8px;
                    margin-bottom: 5px;
                    background: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 4px;
                    border-left: 3px solid var(--vscode-textLink-foreground);
                }
                .recent-tag-name {
                    font-family: 'Courier New', monospace;
                    color: var(--vscode-textLink-activeForeground);
                }
                .recent-tag-meta {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 4px;
                }
            </style>
        </head>
        <body>
            <h1>📊 Tag Statistics</h1>

            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalTags}</div>
                    <div class="stat-label">Unique Tags</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalTaggedNotes}</div>
                    <div class="stat-label">Tagged Notes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalUntaggedNotes}</div>
                    <div class="stat-label">Untagged Notes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.averageTagsPerNote.toFixed(1)}</div>
                    <div class="stat-label">Avg Tags/Note</div>
                </div>
            </div>

            <h2>📈 Tag Sources</h2>
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>AI Generated: ${stats.aiGeneratedTags}</span>
                    <span>Manual: ${stats.manualTags}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stats.aiGeneratedTags + stats.manualTags > 0 ? (stats.aiGeneratedTags / (stats.aiGeneratedTags + stats.manualTags) * 100) : 0}%;"></div>
                </div>
            </div>

            <h2>🏆 Most Used Tags</h2>
            <ul class="tag-list">
                ${stats.mostUsedTags.map(t => `
                    <li class="tag-item">
                        <span class="tag-name">#${t.tag}</span>
                        <span class="tag-count">${t.count} note${t.count !== 1 ? 's' : ''}</span>
                    </li>
                `).join('')}
            </ul>

            ${stats.recentlyAddedTags.length > 0 ? `
                <h2>🕐 Recently Added (Last 24 Hours)</h2>
                <div>
                    ${stats.recentlyAddedTags.map(t => `
                        <div class="recent-tag">
                            <div class="recent-tag-name">#${t.tag}</div>
                            <div class="recent-tag-meta">
                                ${t.note} • ${getRelativeTime(t.addedAt)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </body>
        </html>
    `;
}

/**
 * Get relative time string
 */
function getRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Get file name from path
 */
function getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
}

/**
 * Get all note files (helper function)
 */
async function getAllNoteFiles(): Promise<string[]> {
    const notesPath = vscode.workspace.getConfiguration('noted').get<string>('notesFolder');
    if (!notesPath) {
        return [];
    }

    const fileFormat = vscode.workspace.getConfiguration('noted').get<string>('fileFormat', 'md');
    const pattern = new vscode.RelativePattern(notesPath, `**/*.${fileFormat}`);
    const files = await vscode.workspace.findFiles(pattern, '**/.noted-templates/**');

    return files.map(uri => uri.fsPath);
}
