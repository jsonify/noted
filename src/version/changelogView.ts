import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Recent version changes (most recent first)
export interface ChangelogEntry {
    version: string;
    date: string;
    changes: {
        category: 'feature' | 'bugfix' | 'improvement' | 'documentation';
        description: string;
    }[];
}

/**
 * Get recent changelog entries
 */
export function getRecentChangelog(): ChangelogEntry[] {
    return [
        {
            version: '1.43.12',
            date: '2025-11-19',
            changes: [
                {
                    category: 'improvement',
                    description: 'Check supported file types in MyNotes panel'
                }
            ]
        },
        {
            version: '1.43.0',
            date: '2025-11-15',
            changes: [
                {
                    category: 'feature',
                    description: 'Template Browser Phase 5 - Interactive Enhancements with improved UI/UX'
                }
            ]
        },
        {
            version: '1.42.0',
            date: '2025-11-15',
            changes: [
                {
                    category: 'feature',
                    description: 'Template Browser Phase 3 - Usage Guidance & Context with variable editor'
                }
            ]
        },
        {
            version: '1.41.0',
            date: '2025-11-13',
            changes: [
                {
                    category: 'feature',
                    description: 'Template Browser UI - Visual interface for browsing and managing templates'
                }
            ]
        },
        {
            version: '1.40.0',
            date: '2025-11-12',
            changes: [
                {
                    category: 'feature',
                    description: 'Modal option for warning messages (delete, archive, and export operations)'
                }
            ]
        },
        {
            version: '1.38.0',
            date: '2025-11-07',
            changes: [
                {
                    category: 'feature',
                    description: 'AI Summarization Phase 2 - Enhanced features including summary history and comparison'
                }
            ]
        },
        {
            version: '1.37.0',
            date: '2025-11-07',
            changes: [
                {
                    category: 'feature',
                    description: 'AI Summarization Phase 1 (MVP) - Summarize notes with AI-powered insights'
                }
            ]
        },
        {
            version: '1.36.0',
            date: '2025-11-05',
            changes: [
                {
                    category: 'feature',
                    description: 'Activity View - Track notes created, tags added, and links created over time'
                }
            ]
        }
    ];
}

/**
 * Show the changelog popup webview
 */
export async function showChangelogView(
    context: vscode.ExtensionContext
): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'notedChangelog',
        'What\'s New in Noted',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: false
        }
    );

    // Get the current version from package.json
    const extensionPath = context.extensionPath;
    const packageJsonPath = path.join(extensionPath, 'package.json');
    let currentVersion = '1.43.12'; // fallback

    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        currentVersion = packageJson.version;
    } catch (error) {
        console.error('[NOTED] Error reading package.json:', error);
    }

    // Set the HTML content
    panel.webview.html = getChangelogHtml(currentVersion);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'openDocs':
                    vscode.env.openExternal(vscode.Uri.parse('https://jsonify.github.io/noted/'));
                    break;
                case 'openGitHub':
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/jsonify/noted'));
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Generate the HTML content for the changelog webview
 */
function getChangelogHtml(currentVersion: string): string {
    const changelog = getRecentChangelog();

    // Find the current version entry
    const currentEntry = changelog.find(entry => entry.version === currentVersion);

    // Build the recent changes list
    const recentChangesHtml = changelog
        .slice(0, 5) // Show top 5 recent versions
        .map(entry => {
            const isCurrent = entry.version === currentVersion;
            const changesHtml = entry.changes
                .map(change => {
                    const emoji = getCategoryEmoji(change.category);
                    return `<li><span class="change-category ${change.category}">${emoji}</span> ${change.description}</li>`;
                })
                .join('');

            return `
                <div class="version-entry ${isCurrent ? 'current' : ''}">
                    <div class="version-header">
                        <span class="version-number">v${entry.version}</span>
                        ${isCurrent ? '<span class="current-badge">Current</span>' : ''}
                        <span class="version-date">${formatDate(entry.date)}</span>
                    </div>
                    <ul class="changes-list">
                        ${changesHtml}
                    </ul>
                </div>
            `;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>What's New in Noted</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }

        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2em;
            color: var(--vscode-textLink-foreground);
        }

        .header .current-version {
            font-size: 1.2em;
            color: var(--vscode-descriptionForeground);
        }

        .version-entry {
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            border-left: 4px solid var(--vscode-panel-border);
        }

        .version-entry.current {
            border-left-color: var(--vscode-textLink-foreground);
            background-color: var(--vscode-list-hoverBackground);
        }

        .version-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }

        .version-number {
            font-size: 1.3em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }

        .current-badge {
            background-color: var(--vscode-textLink-foreground);
            color: var(--vscode-editor-background);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }

        .version-date {
            margin-left: auto;
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }

        .changes-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .changes-list li {
            padding: 8px 0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }

        .change-category {
            flex-shrink: 0;
            font-size: 1.2em;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .footer-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
        }

        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }

        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 What's New in Noted</h1>
        <div class="current-version">Current Version: v${currentVersion}</div>
    </div>

    <div class="changelog-container">
        ${recentChangesHtml}
    </div>

    <div class="footer">
        <p>Thank you for using Noted! We're constantly improving to help you organize your notes better.</p>
        <div class="footer-buttons">
            <button class="button" onclick="openDocs()">📖 View Documentation</button>
            <button class="button secondary" onclick="openGitHub()">⭐ Star on GitHub</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function openDocs() {
            vscode.postMessage({ command: 'openDocs' });
        }

        function openGitHub() {
            vscode.postMessage({ command: 'openGitHub' });
        }
    </script>
</body>
</html>`;
}

/**
 * Get emoji for change category
 */
function getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
        feature: '✨',
        bugfix: '🐛',
        improvement: '⚡',
        documentation: '📝'
    };
    return emojiMap[category] || '•';
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}
