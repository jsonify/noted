import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

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
 * Get latest merged PR from Git history
 * Parses git log to find the most recent commit with a PR number (#XXX)
 */
export function getLatestRelease(): LatestRelease {
    try {
        // Get the most recent commit with a PR number in the title
        // Format: "title (#123)" where #123 is the PR number
        const gitLog = execSync(
            'git log --format="%H|%s|%b|%ai" --grep="#[0-9]\\+" --regexp-ignore-case -1',
            { encoding: 'utf8', cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath }
        ).trim();

        if (!gitLog) {
            // Fallback if no PR commits found
            return getFallbackRelease();
        }

        // Split by pipe, but limit to 4 parts (hash, title, body, date)
        // Body can contain newlines and multiple pipes, so we need to handle carefully
        const parts = gitLog.split('|');

        if (parts.length < 4) {
            return getFallbackRelease();
        }

        // Extract parts: hash, title, body (everything between title and date), date (last part)
        const hash = parts[0];
        const title = parts[1];
        const dateStr = parts[parts.length - 1]; // Last part is date
        const body = parts.slice(2, parts.length - 1).join('|'); // Everything in between is body

        // Extract PR number from title (e.g., "Title (#123)" -> 123)
        const prMatch = title.match(/#(\d+)\)$/);
        const prNumber = prMatch ? parseInt(prMatch[1], 10) : undefined;

        // Remove PR number from title
        const cleanTitle = title.replace(/\s*\(#\d+\)\s*$/, '').trim();

        // Parse date
        const date = new Date(dateStr);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

        // Get version from package.json
        let version = '1.43.12'; // fallback
        try {
            const packageJsonPath = path.join(
                vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
                'package.json'
            );
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            version = packageJson.version;
        } catch (error) {
            console.error('[NOTED] Error reading version:', error);
        }

        return {
            version,
            date: dateString,
            prTitle: cleanTitle,
            prDescription: body.trim() || 'No description available.',
            prNumber,
            prUrl: prNumber ? `https://github.com/jsonify/noted/pull/${prNumber}` : undefined
        };
    } catch (error) {
        console.error('[NOTED] Error reading git log:', error);
        return getFallbackRelease();
    }
}

/**
 * Fallback release info when Git parsing fails
 */
function getFallbackRelease(): LatestRelease {
    return {
        version: '1.43.12',
        date: '2025-11-19',
        prTitle: 'Check supported file types in MyNotes panel',
        prDescription: `Extended SUPPORTED_EXTENSIONS to include common programming language file types, enabling users to store and view scripts in the MyNotes panel.

**Added support for:**
- Web development: HTML, CSS, JS/TS, JSON, YAML, XML
- Programming languages: Python, Java, C/C++, Go, Rust, Ruby, PHP, Swift, Kotlin, R, etc.
- Shell/scripting: Bash, PowerShell, Windows batch
- Data/config: SQL, TOML, INI, ENV files

Resolves issue where users could only see .md and .txt files in the panel.`,
        prNumber: 123,
        prUrl: 'https://github.com/jsonify/noted/pull/123'
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
        const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
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
 * Parse markdown text to HTML with proper formatting
 * Handles: bold text, bullet lists, numbered lists, line breaks, code blocks
 */
function parseMarkdownToHtml(markdown: string): string {
    const lines = markdown.split('\n');
    const html: string[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            const text = currentParagraph.join(' ').trim();
            if (text) {
                // Apply inline formatting
                const formatted = applyInlineFormatting(text);
                html.push(`<p>${formatted}</p>`);
            }
            currentParagraph = [];
        }
    };

    const closeList = () => {
        if (inList && listType) {
            html.push(`</${listType}>`);
            inList = false;
            listType = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) {
            flushParagraph();
            closeList();
            continue;
        }

        // Bullet list (-, *, •)
        const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
        if (bulletMatch) {
            flushParagraph();
            if (!inList || listType !== 'ul') {
                closeList();
                html.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            html.push(`<li>${applyInlineFormatting(bulletMatch[1])}</li>`);
            continue;
        }

        // Numbered list (1., 2., etc.)
        const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
        if (numberedMatch) {
            flushParagraph();
            if (!inList || listType !== 'ol') {
                closeList();
                html.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            html.push(`<li>${applyInlineFormatting(numberedMatch[1])}</li>`);
            continue;
        }

        // Code block or special formatting
        if (trimmed.startsWith('```')) {
            flushParagraph();
            closeList();
            // Skip code blocks for now
            continue;
        }

        // Heading (##)
        const headingMatch = trimmed.match(/^(#{2,})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            closeList();
            const level = Math.min(headingMatch[1].length, 6);
            html.push(`<h${level}>${applyInlineFormatting(headingMatch[2])}</h${level}>`);
            continue;
        }

        // Regular paragraph line
        closeList();
        currentParagraph.push(trimmed);
    }

    // Flush any remaining content
    flushParagraph();
    closeList();

    return html.join('\n');
}

/**
 * Apply inline markdown formatting (bold, italic, code)
 */
function applyInlineFormatting(text: string): string {
    // Use placeholders to avoid conflicts during replacement
    let result = text;

    // Links [text](url) - replace with placeholder
    const links: string[] = [];
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        links.push(`<a href="${url}">${text}</a>`);
        return `__LINK_${links.length - 1}__`;
    });

    // Inline code - replace with placeholder
    const codes: string[] = [];
    result = result.replace(/`([^`]+)`/g, (match, code) => {
        codes.push(`<code>${code}</code>`);
        return `__CODE_${codes.length - 1}__`;
    });

    // Bold (**text** or __text__)
    result = result.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic (*text* or _text_) - only single chars
    result = result.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Restore codes
    codes.forEach((code, i) => {
        result = result.replace(`__CODE_${i}__`, code);
    });

    // Restore links
    links.forEach((link, i) => {
        result = result.replace(`__LINK_${i}__`, link);
    });

    return result;
}

/**
 * Generate the HTML content for the changelog webview
 */
function getChangelogHtml(currentVersion: string): string {
    const release = getLatestRelease();

    // Convert markdown-style description to HTML
    const descriptionHtml = parseMarkdownToHtml(release.prDescription);

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

        .release-description ul,
        .release-description ol {
            margin: 12px 0;
            padding-left: 24px;
        }

        .release-description li {
            margin: 6px 0;
            line-height: 1.5;
        }

        .release-description strong {
            color: var(--vscode-textLink-foreground);
            font-weight: 600;
        }

        .release-description em {
            font-style: italic;
        }

        .release-description code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
        }

        .release-description h2,
        .release-description h3,
        .release-description h4 {
            margin: 16px 0 8px 0;
            color: var(--vscode-textLink-foreground);
        }

        .release-description h2 {
            font-size: 1.2em;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 4px;
        }

        .release-description h3 {
            font-size: 1.1em;
        }

        .release-description h4 {
            font-size: 1.05em;
        }

        .release-description a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }

        .release-description a:hover {
            text-decoration: underline;
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
