import * as vscode from 'vscode';
import * as path from 'path';
import { LinkService, LINK_PATTERN } from '../services/linkService';
import { IMAGE_EXTENSIONS, DIAGRAM_EXTENSIONS } from '../constants';

/**
 * Provides diagnostics for wiki-style links
 * - Warns about ambiguous links (multiple notes with same name)
 * - Provides quick fixes to use full paths for disambiguation
 */
export class LinkDiagnosticsProvider {
    private linkService: LinkService;
    private notesPath: string;
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(linkService: LinkService, notesPath: string) {
        this.linkService = linkService;
        this.notesPath = notesPath;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('noted-links');
    }

    /**
     * Check if a link is to an image or diagram file based on extension
     */
    private isImageOrDiagramLink(linkText: string): boolean {
        const lowerLink = linkText.toLowerCase();

        // Check for composite extensions first (.excalidraw.svg, .excalidraw.png)
        if (lowerLink.endsWith('.excalidraw.svg') || lowerLink.endsWith('.excalidraw.png')) {
            return true;
        }

        // Check single extensions
        const ext = path.extname(linkText).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext) || DIAGRAM_EXTENSIONS.includes(ext);
    }

    /**
     * Update diagnostics for a document
     */
    async updateDiagnostics(document: vscode.TextDocument): Promise<void> {
        // Only process note files
        const ext = path.extname(document.fileName);
        if (ext !== '.txt' && ext !== '.md') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        // Reset regex state
        LINK_PATTERN.lastIndex = 0;
        let match;

        while ((match = LINK_PATTERN.exec(text)) !== null) {
            const linkText = match[1].trim();
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            // Skip diagnostics for image and diagram links (handled by embed system)
            if (this.isImageOrDiagramLink(linkText)) {
                continue;
            }

            // Check if link is ambiguous (path-based links are never ambiguous)
            if (!linkText.includes('/') && !linkText.includes('\\')) {
                const allMatches = await this.linkService.findAllMatchingNotes(linkText);

                if (allMatches.length > 1) {
                    // Create warning for ambiguous link
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Ambiguous link: ${allMatches.length} notes named "${linkText}" found. Consider using full path.`,
                        vscode.DiagnosticSeverity.Warning
                    );

                    diagnostic.code = 'ambiguous-link';
                    diagnostic.source = 'noted';

                    // Add information about all matching notes
                    const relatedInfo: vscode.DiagnosticRelatedInformation[] = [];
                    for (const notePath of allMatches) {
                        const relativePath = path.relative(this.notesPath, notePath);
                        relatedInfo.push(
                            new vscode.DiagnosticRelatedInformation(
                                new vscode.Location(vscode.Uri.file(notePath), new vscode.Position(0, 0)),
                                `Matching note: ${relativePath}`
                            )
                        );
                    }
                    diagnostic.relatedInformation = relatedInfo;

                    diagnostics.push(diagnostic);
                } else if (allMatches.length === 0) {
                    // Check if link can be resolved at all
                    const resolved = await this.linkService.resolveLink(linkText);
                    if (!resolved) {
                        // Create error for broken link
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            `Note not found: "${linkText}"`,
                            vscode.DiagnosticSeverity.Error
                        );

                        diagnostic.code = 'broken-link';
                        diagnostic.source = 'noted';

                        diagnostics.push(diagnostic);
                    }
                }
            } else {
                // For path-based links, check if they resolve
                const resolved = await this.linkService.resolveLink(linkText);
                if (!resolved) {
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Note not found: "${linkText}"`,
                        vscode.DiagnosticSeverity.Error
                    );

                    diagnostic.code = 'broken-link';
                    diagnostic.source = 'noted';

                    diagnostics.push(diagnostic);
                }
            }
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    /**
     * Clear diagnostics for a document
     */
    clearDiagnostics(document: vscode.TextDocument): void {
        this.diagnosticCollection.delete(document.uri);
    }

    /**
     * Clear all diagnostics
     */
    clearAll(): void {
        this.diagnosticCollection.clear();
    }

    /**
     * Dispose of the diagnostic collection
     */
    dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

/**
 * Provides code actions (quick fixes) for link diagnostics
 */
export class LinkCodeActionProvider implements vscode.CodeActionProvider {
    private linkService: LinkService;
    private notesPath: string;

    constructor(linkService: LinkService, notesPath: string) {
        this.linkService = linkService;
        this.notesPath = notesPath;
    }

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== 'noted') {
                continue;
            }

            if (diagnostic.code === 'ambiguous-link') {
                // Extract link text from diagnostic range
                const linkText = this.extractLinkText(document, diagnostic.range);
                if (!linkText) {
                    continue;
                }

                // Get all matching notes
                const allMatches = await this.linkService.findAllMatchingNotes(linkText);

                // Create a quick fix for each matching note
                for (const notePath of allMatches) {
                    const relativePath = path.relative(this.notesPath, notePath);
                    const relativePathNoExt = relativePath.replace(/\.(txt|md)$/i, '');
                    const pathForLink = relativePathNoExt.replace(/\\/g, '/');

                    const action = new vscode.CodeAction(
                        `Use full path: [[${pathForLink}]]`,
                        vscode.CodeActionKind.QuickFix
                    );

                    action.diagnostics = [diagnostic];
                    action.isPreferred = false;

                    // Create edit to replace link text with full path
                    const edit = new vscode.WorkspaceEdit();
                    const newText = `[[${pathForLink}]]`;
                    edit.replace(document.uri, diagnostic.range, newText);
                    action.edit = edit;

                    actions.push(action);
                }
            }
        }

        return actions;
    }

    /**
     * Extract link text from a [[link]] at the given range
     */
    private extractLinkText(document: vscode.TextDocument, range: vscode.Range): string | undefined {
        const text = document.getText(range);
        const match = text.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
        return match ? match[1].trim() : undefined;
    }
}
