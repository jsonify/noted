import * as vscode from 'vscode';
import * as path from 'path';
import { EmbedService } from '../services/embedService';

/**
 * Manages the markdown preview panel
 */
export class MarkdownPreviewManager {
    private panel: vscode.WebviewPanel | undefined;
    private currentDocument: vscode.TextDocument | undefined;
    private updateTimeout: NodeJS.Timeout | undefined;
    private disposables: vscode.Disposable[] = [];
    private embedService: EmbedService | undefined;

    constructor(
        private context: vscode.ExtensionContext,
        embedService?: EmbedService
    ) {
        this.embedService = embedService;
    }

    /**
     * Toggle the markdown preview panel
     */
    public async togglePreview(): Promise<void> {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showInformationMessage('Open a markdown note to preview');
            return;
        }

        const document = editor.document;
        const isMarkdown = document.languageId === 'markdown' || document.fileName.endsWith('.md');

        if (!isMarkdown) {
            vscode.window.showWarningMessage('Markdown preview is only available for .md files');
            return;
        }

        // If panel exists and is for the same document, dispose it (toggle off)
        if (this.panel && this.currentDocument?.uri.toString() === document.uri.toString()) {
            this.closePreview();
            return;
        }

        // If panel exists but for different document, update it
        if (this.panel) {
            this.currentDocument = document;
            this.updatePreview();
            this.panel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        // Create new panel
        this.createPreviewPanel(document);
    }

    /**
     * Create a new preview panel
     */
    private createPreviewPanel(document: vscode.TextDocument): void {
        this.currentDocument = document;

        // Build local resource roots to allow images from various locations
        const localResourceRoots = [
            vscode.Uri.file(path.dirname(document.fileName))
        ];

        // Add workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            workspaceFolders.forEach(folder => {
                localResourceRoots.push(folder.uri);
            });
        }

        this.panel = vscode.window.createWebviewPanel(
            'notedMarkdownPreview',
            `Preview: ${path.basename(document.fileName)}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots
            }
        );

        // Set initial content
        this.updatePreview();

        // Handle panel disposal
        this.panel.onDidDispose(() => {
            this.panel = undefined;
            this.currentDocument = undefined;
            this.disposeListeners();
        }, null, this.disposables);

        // Listen for document changes
        this.setupDocumentListeners();

        // Listen for active editor changes
        const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && this.panel) {
                const doc = editor.document;
                const isMarkdown = doc.languageId === 'markdown' || doc.fileName.endsWith('.md');

                if (isMarkdown) {
                    this.currentDocument = doc;
                    this.panel.title = `Preview: ${path.basename(doc.fileName)}`;
                    this.updatePreview();
                }
            }
        }, null, this.disposables);
    }

    /**
     * Setup listeners for document changes
     */
    private setupDocumentListeners(): void {
        // Listen for document changes
        const changeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
            if (this.currentDocument && event.document.uri.toString() === this.currentDocument.uri.toString()) {
                // Debounce updates to avoid excessive refreshes
                if (this.updateTimeout) {
                    clearTimeout(this.updateTimeout);
                }
                this.updateTimeout = setTimeout(() => {
                    this.updatePreview();
                }, 300);
            }
        }, null, this.disposables);

        // Listen for document saves
        const saveDisposable = vscode.workspace.onDidSaveTextDocument(document => {
            if (this.currentDocument && document.uri.toString() === this.currentDocument.uri.toString()) {
                this.updatePreview();
            }
        }, null, this.disposables);
    }

    /**
     * Update the preview content
     */
    private async updatePreview(): Promise<void> {
        if (!this.panel || !this.currentDocument) {
            return;
        }

        let content = this.currentDocument.getText();
        const documentPath = this.currentDocument.uri.fsPath;

        // Process embedded content if service is available
        if (this.embedService && this.panel) {
            try {
                const originalLength = content.length;
                content = await this.embedService.processEmbedsForWebview(
                    content,
                    this.panel.webview,
                    this.currentDocument.uri
                );

                // Log successful processing with metrics
                const processedLength = content.length;
                const embeddedCount = (content.match(/!?\[\[/g) || []).length;
                console.log(
                    `[NOTED] Processed embedded content for ${path.basename(documentPath)}: ` +
                    `${originalLength} -> ${processedLength} chars, ${embeddedCount} embeds`
                );
            } catch (error) {
                // Enhanced error logging with context
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorStack = error instanceof Error ? error.stack : undefined;

                console.error(
                    `[NOTED] Error processing embedded content in ${path.basename(documentPath)}:`,
                    {
                        message: errorMessage,
                        path: documentPath,
                        error: error,
                        stack: errorStack
                    }
                );

                // Add error notification in the preview itself
                const errorNotice = `\n\n> ⚠️ **Note**: Some embedded content may not have rendered correctly. Check the developer console for details.\n\n`;
                content = errorNotice + content;

                // Show non-intrusive status bar message
                vscode.window.setStatusBarMessage(
                    '$(warning) Noted: Error processing embedded content',
                    3000
                );
            }
        }

        const html = await this.renderMarkdown(content, this.currentDocument.uri);
        this.panel.webview.html = this.getHtmlForWebview(html);
    }

    /**
     * Render markdown to HTML using VS Code's markdown API
     */
    private async renderMarkdown(content: string, documentUri: vscode.Uri): Promise<string> {
        try {
            // Use VS Code's built-in markdown rendering
            const rendered = await vscode.commands.executeCommand<string>(
                'markdown.api.render',
                content
            );
            return rendered || this.fallbackMarkdownRender(content);
        } catch (error) {
            // Fallback to simple rendering if API fails
            return this.fallbackMarkdownRender(content);
        }
    }

    /**
     * Simple fallback markdown rendering
     */
    private fallbackMarkdownRender(content: string): string {
        // Basic markdown parsing for fallback
        let html = content
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // Code blocks
            .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            // Links
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        return `<p>${html}</p>`;
    }

    /**
     * Get the HTML template for the webview
     */
    private getHtmlForWebview(markdownHtml: string): string {
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src vscode-resource: https: data:;">
    <title>Markdown Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
        }

        h1, h2, h3, h4, h5, h6 {
            color: var(--vscode-editor-foreground);
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
        }

        h1 {
            font-size: 2em;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.3em;
        }

        h2 {
            font-size: 1.5em;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.3em;
        }

        h3 {
            font-size: 1.25em;
        }

        p {
            margin-top: 0;
            margin-bottom: 16px;
        }

        a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        code {
            background-color: var(--vscode-textCodeBlock-background);
            color: var(--vscode-textPreformat-foreground);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: Menlo, Monaco, 'Courier New', monospace;
            font-size: 0.9em;
        }

        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-radius: 6px;
            overflow: auto;
            margin: 16px 0;
        }

        pre code {
            background-color: transparent;
            padding: 0;
        }

        blockquote {
            margin: 16px 0;
            padding-left: 16px;
            border-left: 4px solid var(--vscode-panel-border);
            color: var(--vscode-descriptionForeground);
        }

        ul, ol {
            margin-top: 0;
            margin-bottom: 16px;
            padding-left: 2em;
        }

        li {
            margin-bottom: 4px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
        }

        table th,
        table td {
            padding: 8px 13px;
            border: 1px solid var(--vscode-panel-border);
        }

        table th {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            font-weight: 600;
        }

        img {
            max-width: 100%;
            height: auto;
        }

        hr {
            height: 0.25em;
            padding: 0;
            margin: 24px 0;
            background-color: var(--vscode-panel-border);
            border: 0;
        }

        /* Note-specific styles */
        .timestamp {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        .tag {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            display: inline-block;
            margin: 0 4px;
        }

        /* Embedded content styles */
        .embedded-note {
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding-left: 16px;
            margin: 20px 0;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 16px;
            border-radius: 4px;
        }

        .embedded-note h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div id="content">
        ${markdownHtml}
    </div>
    <script nonce="${nonce}">
        // Handle any interactive features here if needed
        const vscode = acquireVsCodeApi();
    </script>
</body>
</html>`;
    }

    /**
     * Generate a nonce for CSP
     */
    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    /**
     * Close the preview panel
     */
    public closePreview(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }

    /**
     * Dispose all listeners
     */
    private disposeListeners(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = undefined;
        }
    }

    /**
     * Dispose the manager
     */
    public dispose(): void {
        this.closePreview();
        this.disposeListeners();
    }
}
