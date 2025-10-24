import * as vscode from 'vscode';
import * as path from 'path';

interface FormattingOption {
    id: string;
    label: string;
    description: string;
    icon: string;
    action: () => void | Promise<void>;
}

export class MarkdownToolbarService {
    private toolbarButton: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];

    constructor(private context: vscode.ExtensionContext) {
        this.toolbarButton = this.createToolbarButton();
        this.setupEventListeners();
    }

    private createToolbarButton(): vscode.StatusBarItem {
        const item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        item.text = '$(edit) Markdown Tools';
        item.tooltip = 'Open markdown formatting menu';
        item.command = 'noted.showMarkdownToolbar';
        return item;
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

        // Show or hide the toolbar button
        if (shouldShow) {
            this.toolbarButton.show();
        } else {
            this.toolbarButton.hide();
        }
    }

    private isMarkdownFile(document: vscode.TextDocument): boolean {
        const ext = path.extname(document.fileName).toLowerCase();
        return ext === '.md' || ext === '.txt';
    }

    // Show formatting menu with all options
    public async showFormattingMenu(): Promise<void> {
        const options: FormattingOption[] = [
            {
                id: 'bold',
                label: '$(bold) Bold',
                description: 'Wrap text with **bold**',
                icon: '$(bold)',
                action: () => this.formatBold()
            },
            {
                id: 'italic',
                label: '$(italic) Italic',
                description: 'Wrap text with *italic*',
                icon: '$(italic)',
                action: () => this.formatItalic()
            },
            {
                id: 'strikethrough',
                label: '$(strikethrough) Strikethrough',
                description: 'Wrap text with ~~strikethrough~~',
                icon: '$(strikethrough)',
                action: () => this.formatStrikethrough()
            },
            {
                id: 'code',
                label: '$(code) Inline Code',
                description: 'Wrap text with `code`',
                icon: '$(code)',
                action: () => this.formatCode()
            },
            {
                id: 'codeblock',
                label: '$(file-code) Code Block',
                description: 'Create a code block with syntax highlighting',
                icon: '$(file-code)',
                action: () => this.formatCodeBlock()
            },
            {
                id: 'bulletlist',
                label: '$(list-unordered) Bullet List',
                description: 'Convert to bullet list',
                icon: '$(list-unordered)',
                action: () => this.formatBulletList()
            },
            {
                id: 'numberedlist',
                label: '$(list-ordered) Numbered List',
                description: 'Convert to numbered list',
                icon: '$(list-ordered)',
                action: () => this.formatNumberedList()
            },
            {
                id: 'checklist',
                label: '$(checklist) Task List',
                description: 'Convert to checklist items',
                icon: '$(checklist)',
                action: () => this.formatChecklist()
            },
            {
                id: 'quote',
                label: '$(quote) Block Quote',
                description: 'Convert to block quote',
                icon: '$(quote)',
                action: () => this.formatQuote()
            },
            {
                id: 'link',
                label: '$(link) Insert Link',
                description: 'Create markdown link',
                icon: '$(link)',
                action: () => this.formatLink()
            },
            {
                id: 'heading',
                label: '$(symbol-text) Heading',
                description: 'Convert to heading (H1-H6)',
                icon: '$(symbol-text)',
                action: () => this.formatHeading()
            }
        ];

        const selected = await vscode.window.showQuickPick(
            options.map(opt => ({
                label: opt.label,
                description: opt.description,
                action: opt.action
            })),
            {
                placeHolder: 'Choose a markdown formatting option',
                matchOnDescription: true
            }
        );

        if (selected && selected.action) {
            await selected.action();
        }
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

        // Regex to find existing list markers (bullet, numbered, or checklist)
        const listMarkerRegex = /^\s*(-|\*|\+|\d+\.|- \[[ x]\])\s*/;

        // Split by lines and add prefix to each
        const lines = selectedText.split('\n');
        const formatted = lines.map((line, index) => {
            const cleanLine = line.replace(listMarkerRegex, '');
            if (isNumbered) {
                return `${index + 1}. ${cleanLine}`;
            }
            return `${prefix}${cleanLine}`;
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

        // Check if selected text is a URL (single line only)
        const urlPattern = /^https?:\/\//i;
        const isUrl = !selectedText.includes('\n') && urlPattern.test(selectedText);

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

            if (url === undefined) return;

            // Check if selection spans multiple lines
            const lines = selectedText ? selectedText.split('\n') : [];

            if (lines.length > 1) {
                // Apply link to each line individually
                const formatted = lines.map(line => {
                    // Don't add link to empty lines
                    if (line.trim() === '') {
                        return line;
                    }
                    return `[${line}](${url})`;
                }).join('\n');

                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, formatted);
                });
            } else {
                // Single line or no selection
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
        const headingRegex = /^\s*#{1,6}\s*/;

        // If no selection, insert placeholder
        if (!selectedText) {
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, `${level.value} Heading`);
            });
            return;
        }

        // Check if selection spans multiple lines
        const lines = selectedText.split('\n');

        if (lines.length > 1) {
            // Apply heading to each line individually
            const formatted = lines.map(line => {
                // Don't add heading to empty lines
                if (line.trim() === '') {
                    return line;
                }
                const cleanLine = line.replace(headingRegex, '');
                return `${level.value} ${cleanLine}`;
            }).join('\n');

            await editor.edit(editBuilder => {
                editBuilder.replace(selection, formatted);
            });
        } else {
            // Single line
            const cleanLine = selectedText.replace(headingRegex, '');
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, `${level.value} ${cleanLine}`);
            });
        }
    }

    private wrapSelection(prefix: string, suffix: string, placeholder: string): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        // If no selection, just insert placeholder
        if (!selectedText) {
            editor.edit(editBuilder => {
                editBuilder.replace(selection, prefix + placeholder + suffix);
            });
            return;
        }

        // Check if selection spans multiple lines
        const lines = selectedText.split('\n');

        if (lines.length > 1) {
            // Apply formatting to each line individually
            const formatted = lines.map(line => {
                // Don't wrap empty lines
                if (line.trim() === '') {
                    return line;
                }
                return prefix + line + suffix;
            }).join('\n');

            editor.edit(editBuilder => {
                editBuilder.replace(selection, formatted);
            });
        } else {
            // Single line - wrap normally
            editor.edit(editBuilder => {
                editBuilder.replace(selection, prefix + selectedText + suffix);
            });
        }
    }

    public dispose(): void {
        // Dispose toolbar button
        this.toolbarButton.dispose();

        // Dispose event listeners
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
