import * as vscode from 'vscode';
import * as path from 'path';
import { EmbedService } from '../services/embedService';
import { marked } from 'marked';

/**
 * Show custom markdown preview with full embed support
 * This works where VS Code's built-in preview doesn't support our markdown-it plugins
 */
export async function showMarkdownPreview(embedService: EmbedService) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const document = activeEditor.document;
    if (document.languageId !== 'markdown' && !document.fileName.endsWith('.md') && !document.fileName.endsWith('.txt')) {
        vscode.window.showErrorMessage('Active file is not a markdown document');
        return;
    }

    // Build local resource roots to include document directory and parent directories
    const localResourceRoots: vscode.Uri[] = [
        vscode.Uri.file(path.dirname(document.fileName))
    ];

    // Add parent directories to allow access to sibling folders (like Diagrams/)
    // We need to go up enough levels to reach the root directory containing both Notes/ and Diagrams/
    let currentDir = path.dirname(document.fileName);
    for (let i = 0; i < 5; i++) {  // Go up 5 levels to be safe
        currentDir = path.dirname(currentDir);
        localResourceRoots.push(vscode.Uri.file(currentDir));
    }

    // Add workspace folders
    if (vscode.workspace.workspaceFolders) {
        localResourceRoots.push(...vscode.workspace.workspaceFolders.map(f => f.uri));
    }

    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
        'notedPreview',
        `Preview: ${path.basename(document.fileName)}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots
        }
    );

    // Update preview when document changes
    const updatePreview = async () => {
        const content = document.getText();
        const html = await generatePreviewHtml(content, document, panel.webview, embedService);
        panel.webview.html = html;
    };

    // Initial render
    await updatePreview();

    // Watch for document changes
    const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === document.uri.toString()) {
            updatePreview();
        }
    });

    // Clean up on panel close
    panel.onDidDispose(() => {
        changeSubscription.dispose();
    });
}

/**
 * Generate HTML for the preview
 */
async function generatePreviewHtml(
    markdownContent: string,
    document: vscode.TextDocument,
    webview: vscode.Webview,
    embedService: EmbedService
): Promise<string> {
    // Process embeds BEFORE markdown rendering
    let processedContent = markdownContent;

    // Find all embeds
    const embedRegex = /!\[\[([^\]]+?)\]\]/g;
    let match;
    const embedsToProcess: Array<{ match: string; fileName: string; displayText?: string }> = [];

    while ((match = embedRegex.exec(markdownContent)) !== null) {
        const fullMatch = match[0];
        const content = match[1];
        const parts = content.split('|');
        const fileName = parts[0].trim();
        const displayText = parts[1] ? parts[1].trim() : undefined;

        embedsToProcess.push({ match: fullMatch, fileName, displayText });
    }

    // Process each embed
    for (const embed of embedsToProcess) {
        const { match, fileName, displayText } = embed;

        // Check if it's an image or diagram
        const isImage = embedService.isImageFile(fileName);
        const isDiagram = embedService.isDiagramFile(fileName);

        if (isImage || isDiagram) {
            // Resolve the path
            const resolvedPath = await embedService.resolveImagePath(fileName, document.uri.fsPath);

            if (resolvedPath) {

                // Check if it's a raw diagram file
                const lowerPath = resolvedPath.toLowerCase();
                const isRawDiagram = (lowerPath.endsWith('.drawio') || lowerPath.endsWith('.excalidraw'))
                    && !lowerPath.endsWith('.svg') && !lowerPath.endsWith('.png');

                if (isRawDiagram) {
                    // Raw diagram - show message
                    const baseName = path.basename(resolvedPath);
                    const diagramType = lowerPath.endsWith('.drawio') ? 'Draw.io' : 'Excalidraw';
                    const replacement = `\n\n<div class="noted-diagram-link">📊 <strong>${diagramType} diagram:</strong> <code>${baseName}</code><br/><em>Export as .svg or .png to embed in preview</em></div>\n\n`;
                    processedContent = processedContent.replace(match, replacement);
                } else {
                    // Image or exported diagram - embed it
                    const imageUri = webview.asWebviewUri(vscode.Uri.file(resolvedPath));
                    const alt = displayText || path.basename(fileName, path.extname(fileName));
                    const replacement = `\n\n![${alt}](${imageUri.toString()})\n\n`;
                    processedContent = processedContent.replace(match, replacement);
                }
            } else {
                // File not found
                const icon = isDiagram ? '📊' : '📷';
                const replacement = `\n\n<div class="noted-embed-not-found">${icon} <strong>File not found:</strong> <code>${fileName}</code></div>\n\n`;
                processedContent = processedContent.replace(match, replacement);
            }
        } else {
            // Note embed - show a reference
            const replacement = `\n\n<div class="noted-note-embed">📄 <strong>Note:</strong> <code>${displayText || fileName}</code></div>\n\n`;
            processedContent = processedContent.replace(match, replacement);
        }
    }

    // Convert markdown to HTML using marked
    const htmlContent = marked(processedContent);

    // Generate full HTML page
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Noted Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
            font-size: var(--vscode-font-size, 14px);
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em 0;
            border-radius: 4px;
        }

        code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family, monospace);
        }

        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
        }

        pre code {
            background: none;
            padding: 0;
        }

        /* Embed styles */
        .noted-embed-not-found {
            padding: 1em;
            margin: 1em 0;
            border-left: 4px solid var(--vscode-editorWarning-foreground, #f59e0b);
            background-color: var(--vscode-editorWarning-background, rgba(245, 158, 11, 0.1));
        }

        .noted-diagram-link {
            padding: 1em;
            margin: 1em 0;
            border-left: 4px solid var(--vscode-editorInfo-foreground, #3b82f6);
            background-color: var(--vscode-editorInfo-background, rgba(59, 130, 246, 0.1));
        }

        .noted-note-embed {
            padding: 0.75em 1em;
            margin: 1em 0;
            border-left: 4px solid var(--vscode-textLink-foreground, #0066cc);
            background-color: var(--vscode-editor-inactiveSelectionBackground, rgba(0, 102, 204, 0.05));
        }

        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }

        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.25em; }

        blockquote {
            margin: 1em 0;
            padding-left: 1em;
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            background-color: var(--vscode-textBlockQuote-background);
        }

        a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }

        th, td {
            border: 1px solid var(--vscode-panel-border);
            padding: 8px 12px;
            text-align: left;
        }

        th {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            font-weight: 600;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
}
