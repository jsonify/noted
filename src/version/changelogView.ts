import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Latest release information
export interface LatestRelease {
    version: string;
    date: string;
    prTitle: string;
    prDescription: string;
    prNumber?: number;
    prUrl?: string;
}

/**
 * Get latest release information
 * This could be extended to read from Git commits or GitHub API
 */
export function getLatestRelease(): LatestRelease {
    return {
        version: '1.43.12',
        date: '2025-11-19',
        prTitle: 'Add version popup feature to show recent changes',
        prDescription: `Implements a version badge at the top of the Templates & Recent panel that displays the current extension version. When clicked, it opens a beautiful popup showing recent changes and new features.

**New in this release:**
- Version badge displayed at top of Templates & Recent panel
- "What's New" popup with the latest changes
- Reads version dynamically from package.json
- Quick links to documentation and GitHub repository
- Clean, VS Code-themed UI

Similar to the Roo Code extension's version bubble feature.`,
        prNumber: undefined, // Will be filled when PR is created
        prUrl: undefined
    };
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
                case 'openPR':
                    if (message.url) {
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                    }
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
    const release = getLatestRelease();

    // Convert markdown-style description to HTML paragraphs
    const descriptionHtml = release.prDescription
        .split('\n\n')
        .map(paragraph => {
            // Handle bold text (**text**)
            const processed = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Handle bullet points
            if (processed.trim().startsWith('-')) {
                const items = processed.split('\n')
                    .filter(line => line.trim().startsWith('-'))
                    .map(line => `<li>${line.trim().substring(1).trim()}</li>`)
                    .join('');
                return `<ul>${items}</ul>`;
            }
            return `<p>${processed}</p>`;
        })
        .join('');

    const prLinkHtml = release.prUrl
        ? `<button class="button secondary" onclick="openPR('${release.prUrl}')">🔗 View Pull Request #${release.prNumber}</button>`
        : '';

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
            max-width: 700px;
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

        .header .version-badge {
            display: inline-block;
            background-color: var(--vscode-textLink-foreground);
            color: var(--vscode-editor-background);
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 1.1em;
            font-weight: bold;
            margin-top: 10px;
        }

        .release-card {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 30px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }

        .release-header {
            margin-bottom: 20px;
        }

        .release-title {
            font-size: 1.4em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            margin: 0 0 8px 0;
        }

        .release-date {
            color: var(--vscode-descriptionForeground);
            font-size: 0.95em;
        }

        .release-description {
            color: var(--vscode-foreground);
            font-size: 1em;
        }

        .release-description p {
            margin: 12px 0;
        }

        .release-description ul {
            margin: 12px 0;
            padding-left: 20px;
        }

        .release-description li {
            margin: 6px 0;
        }

        .release-description strong {
            color: var(--vscode-textLink-foreground);
            font-weight: 600;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        .footer p {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 15px;
        }

        .footer-buttons {
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
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
        <div class="version-badge">v${currentVersion}</div>
    </div>

    <div class="release-card">
        <div class="release-header">
            <h2 class="release-title">${release.prTitle}</h2>
            <div class="release-date">${formatDate(release.date)}</div>
        </div>
        <div class="release-description">
            ${descriptionHtml}
        </div>
    </div>

    <div class="footer">
        <p>Thank you for using Noted! We're constantly improving to help you organize your notes better.</p>
        <div class="footer-buttons">
            <button class="button" onclick="openDocs()">📖 View Documentation</button>
            <button class="button secondary" onclick="openGitHub()">⭐ Star on GitHub</button>
            ${prLinkHtml}
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

        function openPR(url) {
            vscode.postMessage({ command: 'openPR', url: url });
        }
    </script>
</body>
</html>`;
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}
