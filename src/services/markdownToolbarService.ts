import * as vscode from 'vscode';

export class MarkdownToolbarService {
    private statusBarItems: Map<string, vscode.StatusBarItem> = new Map();
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.createStatusBarItems();
        this.setupEventListeners();
    }

    private createStatusBarItems(): void {
        // Define toolbar buttons with icons and tooltips
        const buttons = [
            { id: 'bold', text: '$(bold) B', tooltip: 'Bold (Ctrl+B)', priority: 100, command: 'noted.format.bold' },
            { id: 'italic', text: '$(italic) I', tooltip: 'Italic (Ctrl+I)', priority: 99, command: 'noted.format.italic' },
            { id: 'strikethrough', text: '$(strikethrough) S', tooltip: 'Strikethrough', priority: 98, command: 'noted.format.strikethrough' },
            { id: 'code', text: '$(code) Code', tooltip: 'Inline Code', priority: 97, command: 'noted.format.code' },
            { id: 'codeblock', text: '$(file-code) Block', tooltip: 'Code Block', priority: 96, command: 'noted.format.codeblock' },
            { id: 'bulletlist', text: '$(list-unordered) List', tooltip: 'Bullet List', priority: 95, command: 'noted.format.bulletlist' },
            { id: 'numberedlist', text: '$(list-ordered) 1-2-3', tooltip: 'Numbered List', priority: 94, command: 'noted.format.numberedlist' },
            { id: 'checklist', text: '$(checklist) Todo', tooltip: 'Checklist', priority: 93, command: 'noted.format.checklist' },
            { id: 'quote', text: '$(quote) Quote', tooltip: 'Block Quote', priority: 92, command: 'noted.format.quote' },
            { id: 'link', text: '$(link) Link', tooltip: 'Insert Link', priority: 91, command: 'noted.format.link' },
            { id: 'heading', text: '$(symbol-text) H', tooltip: 'Heading', priority: 90, command: 'noted.format.heading' },
        ];

        // Create status bar items
        for (const button of buttons) {
            const item = vscode.window.createStatusBarItem(
                vscode.StatusBarAlignment.Right,
                button.priority
            );
            item.text = button.text;
            item.tooltip = button.tooltip;
            item.command = button.command;
            this.statusBarItems.set(button.id, item);
        }
    }

    private setupEventListeners(): void {
        // Listen to selection changes
        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection(() => {
                this.updateToolbarVisibility();
            })
        );

        // Listen to active editor changes
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                this.updateToolbarVisibility();
            })
        );

        // Initial update
        this.updateToolbarVisibility();
    }

    private updateToolbarVisibility(): void {
        const editor = vscode.window.activeTextEditor;

        // Check if we should show the toolbar
        const shouldShow = editor &&
            this.isMarkdownFile(editor.document) &&
            !editor.selection.isEmpty;

        // Show or hide all toolbar items
        for (const item of this.statusBarItems.values()) {
            if (shouldShow) {
                item.show();
            } else {
                item.hide();
            }
        }
    }

    private isMarkdownFile(document: vscode.TextDocument): boolean {
        const ext = document.fileName.split('.').pop()?.toLowerCase();
        return ext === 'md' || ext === 'txt';
    }

    // Formatting command handlers
    public formatBold(): void {
        this.wrapSelection('**', '**', 'bold text');
    }

    public formatItalic(): void {
        this.wrapSelection('*', '*', 'italic text');
    }

    public formatStrikethrough(): void {
        this.wrapSelection('~~', '~~', 'strikethrough text');
    }

    public formatCode(): void {
        this.wrapSelection('`', '`', 'code');
    }

    public async formatCodeBlock(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        // Prompt for language
        const language = await vscode.window.showInputBox({
            prompt: 'Enter language identifier (optional)',
            placeHolder: 'javascript, python, etc.',
        });

        const lang = language || '';
        const prefix = `\`\`\`${lang}\n`;
        const suffix = '\n\`\`\`';

        await editor.edit(editBuilder => {
            editBuilder.replace(selection, prefix + (selectedText || 'code') + suffix);
        });
    }

    public formatBulletList(): void {
        this.formatAsList('- ');
    }

    public formatNumberedList(): void {
        this.formatAsList('1. ', true);
    }

    public formatChecklist(): void {
        this.formatAsList('- [ ] ');
    }

    public formatQuote(): void {
        this.formatAsList('> ');
    }

    private formatAsList(prefix: string, isNumbered: boolean = false): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText) {
            // No selection, just insert prefix
            editor.edit(editBuilder => {
                editBuilder.insert(selection.start, prefix);
            });
            return;
        }

        // Split by lines and add prefix to each
        const lines = selectedText.split('\n');
        const formatted = lines.map((line, index) => {
            if (isNumbered) {
                return `${index + 1}. ${line}`;
            }
            return `${prefix}${line}`;
        }).join('\n');

        editor.edit(editBuilder => {
            editBuilder.replace(selection, formatted);
        });
    }

    public async formatLink(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        // Check if selected text is a URL
        const urlPattern = /^https?:\/\//i;
        const isUrl = urlPattern.test(selectedText);

        if (isUrl) {
            // URL selected, prompt for link text
            const text = await vscode.window.showInputBox({
                prompt: 'Enter link text',
                placeHolder: 'Link text',
            });

            if (text !== undefined) {
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, `[${text}](${selectedText})`);
                });
            }
        } else {
            // Text selected (or no selection), prompt for URL
            const url = await vscode.window.showInputBox({
                prompt: 'Enter URL',
                placeHolder: 'https://example.com',
            });

            if (url !== undefined) {
                const linkText = selectedText || 'link text';
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, `[${linkText}](${url})`);
                });
            }
        }
    }

    public async formatHeading(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        // Prompt for heading level
        const level = await vscode.window.showQuickPick(
            [
                { label: 'H1', description: '# Heading 1', value: '#' },
                { label: 'H2', description: '## Heading 2', value: '##' },
                { label: 'H3', description: '### Heading 3', value: '###' },
                { label: 'H4', description: '#### Heading 4', value: '####' },
                { label: 'H5', description: '##### Heading 5', value: '#####' },
                { label: 'H6', description: '###### Heading 6', value: '######' },
            ],
            { placeHolder: 'Select heading level' }
        );

        if (!level) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        await editor.edit(editBuilder => {
            editBuilder.replace(selection, `${level.value} ${selectedText || 'Heading'}`);
        });
    }

    private wrapSelection(prefix: string, suffix: string, placeholder: string): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        editor.edit(editBuilder => {
            editBuilder.replace(selection, prefix + (selectedText || placeholder) + suffix);
        });
    }

    public dispose(): void {
        // Dispose all status bar items
        for (const item of this.statusBarItems.values()) {
            item.dispose();
        }
        this.statusBarItems.clear();

        // Dispose event listeners
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
