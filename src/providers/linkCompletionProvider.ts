import * as vscode from 'vscode';
import * as path from 'path';
import { LinkService } from '../services/linkService';
import { getSupportedExtensionsRegex } from '../constants';

/**
 * Provides autocomplete suggestions for wiki-style [[note]] links
 * Suggests both simple note names and full paths for disambiguation
 */
export class LinkCompletionProvider implements vscode.CompletionItemProvider {
    private linkService: LinkService;
    private notesPath: string;

    constructor(linkService: LinkService, notesPath: string) {
        this.linkService = linkService;
        this.notesPath = notesPath;
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const line = document.lineAt(position.line);
        const textBeforeCursor = line.text.substring(0, position.character);

        // Check if we're inside a wiki link
        const linkStartMatch = textBeforeCursor.match(/\[\[([^\]]*?)$/);
        if (!linkStartMatch) {
            return [];
        }

        const partialLink = linkStartMatch[1];
        const allNotes = await this.linkService.getAllNotes();
        const completionItems: vscode.CompletionItem[] = [];

        // Group notes by basename to detect duplicates
        const notesByBasename = new Map<string, string[]>();
        for (const notePath of allNotes) {
            const basename = path.basename(notePath, path.extname(notePath));
            if (!notesByBasename.has(basename)) {
                notesByBasename.set(basename, []);
            }
            notesByBasename.get(basename)!.push(notePath);
        }

        // Create completion items
        for (const [basename, notePaths] of notesByBasename.entries()) {
            const hasMultiple = notePaths.length > 1;

            for (const notePath of notePaths) {
                const relativePath = path.relative(this.notesPath, notePath);
                const relativePathNoExt = relativePath.replace(getSupportedExtensionsRegex(), '');

                // Filter based on partial input
                if (partialLink && !basename.toLowerCase().includes(partialLink.toLowerCase()) &&
                    !relativePathNoExt.toLowerCase().includes(partialLink.toLowerCase())) {
                    continue;
                }

                // Create completion item
                const item = new vscode.CompletionItem(
                    basename,
                    vscode.CompletionItemKind.File
                );

                if (hasMultiple) {
                    // For duplicate names, show full path in detail and use path as insert text
                    item.detail = `${relativePathNoExt} (disambiguate)`;
                    item.insertText = relativePathNoExt.replace(/\\/g, '/');
                    item.documentation = new vscode.MarkdownString(
                        `**Multiple notes named "${basename}" found.**\n\nThis will insert the full path to disambiguate:\n\`[[${relativePathNoExt}]]\``
                    );
                    // Higher sort order to show disambiguated paths first when there are conflicts
                    item.sortText = `0-${basename}-${relativePathNoExt}`;
                } else {
                    // For unique names, use simple basename
                    item.detail = relativePathNoExt;
                    item.insertText = basename;
                    item.documentation = new vscode.MarkdownString(
                        `Link to: \`${relativePathNoExt}\``
                    );
                    item.sortText = `1-${basename}`;
                }

                completionItems.push(item);

                // Also add a full-path option for all notes (not just duplicates)
                if (!partialLink.includes('/')) {
                    const pathItem = new vscode.CompletionItem(
                        relativePathNoExt.replace(/\\/g, '/'),
                        vscode.CompletionItemKind.File
                    );
                    pathItem.detail = 'Full path';
                    pathItem.insertText = relativePathNoExt.replace(/\\/g, '/');
                    pathItem.documentation = new vscode.MarkdownString(
                        `Link using full path:\n\`[[${relativePathNoExt}]]\``
                    );
                    pathItem.sortText = `2-${relativePathNoExt}`;
                    completionItems.push(pathItem);
                }
            }
        }

        return completionItems;
    }
}
