import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFile } from './fileSystemService';
import { LinkService } from './linkService';
import { IMAGE_EXTENSIONS, DIAGRAM_EXTENSIONS } from '../constants';

/**
 * Regular expression to match embed syntax: ![[note-name]] or ![[note-name#section]]
 * Captures: [1] = note name, [2] = optional section (after #)
 */
export const EMBED_PATTERN = /!\[\[([^\]#|]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * Represents an embed found in a note
 */
export interface NoteEmbed {
    /** The note name to embed */
    noteName: string;
    /** Optional section/heading to embed (text after #) */
    section?: string;
    /** Optional display text (when using ![[note#section|display]] syntax) */
    displayText?: string;
    /** The range in the document where the embed appears */
    range: vscode.Range;
    /** The resolved file path if found */
    targetPath?: string;
    /** Type of embed: 'note', 'image', or 'diagram' */
    type?: 'note' | 'image' | 'diagram';
}

/**
 * Represents a matched embed during webview processing
 */
export interface EmbedMatch {
    /** The full matched text including ![[...]] syntax */
    match: string;
    /** The note or image name */
    noteName: string;
    /** Optional section name (after #) */
    section?: string;
    /** Optional display text (after |) */
    displayText?: string;
    /** Character index where the match starts in the content */
    index: number;
    /** Type of embed: 'note', 'image', or 'diagram' */
    type: 'note' | 'image' | 'diagram';
}

/**
 * Service for managing note embeds and section extraction
 */
export class EmbedService {
    private linkService: LinkService;
    /** Cache: document URI -> array of source files that are embedded in that document */
    private embedSourcesCache: Map<string, Set<string>> = new Map();

    constructor(linkService: LinkService) {
        this.linkService = linkService;
    }

    /**
     * Check if a file path is an image based on extension
     */
    isImageFile(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
    }

    /**
     * Check if a file path is a diagram file based on extension
     * Supports Draw.io (.drawio) and Excalidraw (.excalidraw, .excalidraw.svg, .excalidraw.png)
     */
    isDiagramFile(filePath: string): boolean {
        const lowerPath = filePath.toLowerCase();
        // Check for composite extensions first (.excalidraw.svg, .excalidraw.png)
        if (lowerPath.endsWith('.excalidraw.svg') || lowerPath.endsWith('.excalidraw.png')) {
            return true;
        }
        // Check for single extensions (.drawio, .excalidraw)
        const ext = path.extname(filePath).toLowerCase();
        return DIAGRAM_EXTENSIONS.includes(ext);
    }

    /**
     * Recursively search for a file by name in a directory
     */
    private async findFileRecursively(directory: string, filename: string, depth: number = 0): Promise<string | undefined> {
        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });

            // First check files in current directory
            for (const entry of entries) {
                if (entry.isFile()) {
                    if (entry.name.toLowerCase() === filename.toLowerCase()) {
                        const fullPath = path.join(directory, entry.name);
                        console.log(`[NOTED] Found file: ${fullPath}`);
                        return fullPath;
                    }
                }
            }

            // Then recurse into subdirectories
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    // Skip common ignore directories
                    if (['node_modules', '.git', '.vscode', 'out', 'dist', '.noted-templates', '.build'].includes(entry.name)) {
                        continue;
                    }

                    const fullPath = path.join(directory, entry.name);
                    const found = await this.findFileRecursively(fullPath, filename, depth + 1);
                    if (found) {
                        return found;
                    }
                }
            }
        } catch (error) {
            // Silently fail for directories we can't read
            return undefined;
        }

        return undefined;
    }

    /**
     * Resolve an image or diagram path relative to the current document or workspace
     * Supports:
     * - Relative paths: ./images/photo.png or diagrams/chart.drawio
     * - Absolute paths: /Users/name/photos/image.png
     * - Workspace-relative paths: images/photo.png (searches workspace)
     * - Diagram files: .drawio, .excalidraw, .excalidraw.svg, .excalidraw.png
     * - Recursive search: Searches entire workspace for files by name
     */
    async resolveImagePath(imagePath: string, currentDocumentPath?: string): Promise<string | undefined> {
        // If it's an absolute path and exists, return it
        if (path.isAbsolute(imagePath)) {
            try {
                await fs.access(imagePath);
                return imagePath;
            } catch {
                return undefined;
            }
        }

        // Try relative to current document
        if (currentDocumentPath) {
            const documentDir = path.dirname(currentDocumentPath);
            const relativePath = path.resolve(documentDir, imagePath);
            try {
                await fs.access(relativePath);
                return relativePath;
            } catch {
                // Continue to try other methods
            }

            // Try sibling Diagrams folder
            // If document is in Notes/, check for Diagrams/ at the same level
            const config = vscode.workspace.getConfiguration('noted');
            let notesFolder = config.get<string>('notesFolder', 'Notes');

            // If notesFolder is a full path, extract just the folder name
            if (notesFolder.includes(path.sep)) {
                notesFolder = path.basename(notesFolder);
            }

            // Split path and look for the notes folder name
            const pathParts = currentDocumentPath.split(path.sep);
            const notesFolderIndex = pathParts.indexOf(notesFolder);

            if (notesFolderIndex !== -1) {
                // Build path to Diagrams folder at the same level as Notes
                const diagramsBasePath = pathParts.slice(0, notesFolderIndex).join(path.sep) + path.sep + 'Diagrams';
                const diagramPath = path.join(diagramsBasePath, imagePath);

                try {
                    await fs.access(diagramPath);
                    return diagramPath;
                } catch {
                    // Not found in Diagrams folder, continue
                }
            }
        }

        // Try relative to workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            // If we have a current document, search in its workspace folder first
            if (currentDocumentPath) {
                const docWorkspaceFolder = workspaceFolders.find(folder =>
                    currentDocumentPath.startsWith(folder.uri.fsPath)
                );

                if (docWorkspaceFolder) {
                    // Try direct path in document's workspace
                    const workspacePath = path.join(docWorkspaceFolder.uri.fsPath, imagePath);
                    try {
                        await fs.access(workspacePath);
                        return workspacePath;
                    } catch {
                        // Continue to recursive search
                    }

                    // If no path separators, do recursive search in document's workspace
                    if (!imagePath.includes('/') && !imagePath.includes('\\')) {
                        const found = await this.findFileRecursively(docWorkspaceFolder.uri.fsPath, imagePath);
                        if (found) {
                            return found;
                        }
                    }
                }
            }

            // Search in all workspace folders as fallback
            for (const folder of workspaceFolders) {
                const workspacePath = path.join(folder.uri.fsPath, imagePath);
                try {
                    await fs.access(workspacePath);
                    return workspacePath;
                } catch {
                    // Continue to next workspace folder
                }
            }

            // If no path separators in imagePath, try recursive search in all workspaces
            if (!imagePath.includes('/') && !imagePath.includes('\\')) {
                for (const folder of workspaceFolders) {
                    const found = await this.findFileRecursively(folder.uri.fsPath, imagePath);
                    if (found) {
                        return found;
                    }
                }
            }
        }

        return undefined;
    }

    /**
     * Get image metadata (dimensions, file size)
     */
    async getImageMetadata(imagePath: string): Promise<{ width?: number; height?: number; size: number } | undefined> {
        try {
            const stats = await fs.stat(imagePath);

            // For now, just return file size
            // Image dimensions would require image decoding library
            return {
                size: stats.size
            };
        } catch (error) {
            console.error('[NOTED] Error getting image metadata:', imagePath, error);
            return undefined;
        }
    }

    /**
     * Extract all embeds from a document
     */
    extractEmbeds(document: vscode.TextDocument): NoteEmbed[] {
        const embeds: NoteEmbed[] = [];
        const text = document.getText();

        // Reset regex state
        EMBED_PATTERN.lastIndex = 0;
        let match;

        while ((match = EMBED_PATTERN.exec(text)) !== null) {
            const noteName = match[1].trim();
            const section = match[2] ? match[2].trim() : undefined;
            const displayText = match[3] ? match[3].trim() : undefined;
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            // Determine embed type based on file extension
            let type: 'note' | 'image' | 'diagram' = 'note';
            if (this.isDiagramFile(noteName)) {
                type = 'diagram';
            } else if (this.isImageFile(noteName)) {
                type = 'image';
            }

            embeds.push({
                noteName,
                section,
                displayText,
                range,
                type
            });
        }

        return embeds;
    }

    /**
     * Extract embeds from a file path
     */
    async extractEmbedsFromFile(filePath: string): Promise<NoteEmbed[]> {
        try {
            const content = await readFile(filePath);
            const lines = content.split('\n');
            const embeds: NoteEmbed[] = [];

            lines.forEach((line, lineIndex) => {
                EMBED_PATTERN.lastIndex = 0;
                let match;

                while ((match = EMBED_PATTERN.exec(line)) !== null) {
                    const noteName = match[1].trim();
                    const section = match[2] ? match[2].trim() : undefined;
                    const displayText = match[3] ? match[3].trim() : undefined;
                    const startCol = match.index;
                    const endCol = match.index + match[0].length;

                    // Determine embed type based on file extension
                    let type: 'note' | 'image' | 'diagram' = 'note';
                    if (this.isDiagramFile(noteName)) {
                        type = 'diagram';
                    } else if (this.isImageFile(noteName)) {
                        type = 'image';
                    }

                    embeds.push({
                        noteName,
                        section,
                        displayText,
                        range: new vscode.Range(
                            new vscode.Position(lineIndex, startCol),
                            new vscode.Position(lineIndex, endCol)
                        ),
                        type
                    });
                }
            });

            return embeds;
        } catch (error) {
            console.error('[NOTED] Error extracting embeds from file:', filePath, error);
            return [];
        }
    }

    /**
     * Resolve an embed to get the target file path
     * For images and diagrams, uses image path resolution
     * For notes, uses link service resolution
     */
    async resolveEmbed(embed: NoteEmbed, currentDocumentPath?: string): Promise<string | undefined> {
        // For image and diagram embeds, use image path resolution
        if (embed.type === 'image' || embed.type === 'diagram') {
            return await this.resolveImagePath(embed.noteName, currentDocumentPath);
        }

        // For note embeds, use the link service
        return await this.linkService.resolveLink(embed.noteName);
    }

    /**
     * Get the content to embed from a note
     * If section is specified, extracts only that section
     * If no section, returns the entire note content
     */
    async getEmbedContent(filePath: string, section?: string): Promise<string | undefined> {
        try {
            const content = await readFile(filePath);

            if (!section) {
                // Return entire note content
                return content;
            }

            // Extract specific section
            return this.extractSection(content, section);
        } catch (error) {
            console.error('[NOTED] Error reading embed content:', filePath, error);
            return undefined;
        }
    }

    /**
     * Extract content from a specific section/heading
     * Supports both markdown (# heading) and text file (HEADING:) formats
     */
    private extractSection(content: string, sectionName: string): string | undefined {
        const lines = content.split('\n');
        const normalizedSection = sectionName.toLowerCase().trim();

        let sectionStartIndex = -1;
        let sectionLevel = 0;
        let inSection = false;
        const sectionLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Check for markdown heading: # Heading, ## Heading, etc.
            const mdHeadingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
            if (mdHeadingMatch) {
                const level = mdHeadingMatch[1].length;
                const headingText = mdHeadingMatch[2].trim().toLowerCase();

                if (!inSection && headingText === normalizedSection) {
                    // Found the target section
                    inSection = true;
                    sectionStartIndex = i;
                    sectionLevel = level;
                    // Include the heading itself
                    sectionLines.push(line);
                    continue;
                } else if (inSection && level <= sectionLevel) {
                    // Found a heading at the same or higher level - end of section
                    break;
                }
            }

            // Check for text-style heading: HEADING: or Heading:
            const textHeadingMatch = trimmedLine.match(/^([A-Za-z0-9\s]+):$/);
            if (textHeadingMatch) {
                const headingText = textHeadingMatch[1].trim().toLowerCase();

                if (!inSection && headingText === normalizedSection) {
                    // Found the target section
                    inSection = true;
                    sectionStartIndex = i;
                    sectionLines.push(line);
                    continue;
                } else if (inSection && textHeadingMatch) {
                    // Found another text-style heading - end of section
                    break;
                }
            }

            // If we're in the target section, add the line
            if (inSection) {
                sectionLines.push(line);
            }
        }

        if (sectionLines.length > 0) {
            return sectionLines.join('\n');
        }

        return undefined;
    }

    /**
     * Get all sections/headings from a note
     * Useful for autocomplete or section selection
     */
    async getSectionsFromNote(filePath: string): Promise<string[]> {
        try {
            const content = await readFile(filePath);
            const sections: string[] = [];
            const lines = content.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Check for markdown heading
                const mdHeadingMatch = trimmedLine.match(/^#{1,6}\s+(.+)$/);
                if (mdHeadingMatch) {
                    sections.push(mdHeadingMatch[1].trim());
                    continue;
                }

                // Check for text-style heading
                const textHeadingMatch = trimmedLine.match(/^([A-Za-z0-9\s]+):$/);
                if (textHeadingMatch) {
                    sections.push(textHeadingMatch[1].trim());
                }
            }

            return sections;
        } catch (error) {
            console.error('[NOTED] Error getting sections from note:', filePath, error);
            return [];
        }
    }

    /**
     * Track embedded sources for a document
     * This is used for transclusion - knowing which source files to watch
     * @param documentUri The URI of the document containing embeds
     * @param embeds The embeds found in that document
     */
    async updateEmbedSourcesCache(documentUri: string, embeds: NoteEmbed[]): Promise<void> {
        const sources = new Set<string>();

        for (const embed of embeds) {
            // Get the document path from the URI
            // Handle both URI strings (file:///) and plain paths
            let documentPath: string;
            try {
                const uri = vscode.Uri.parse(documentUri);
                documentPath = uri.fsPath;
            } catch {
                // If parse fails, assume it's already a file path
                documentPath = documentUri.replace('file:///', '/').replace('file://', '/');
            }

            const targetPath = await this.resolveEmbed(embed, documentPath);
            if (targetPath) {
                sources.add(targetPath);
            }
        }

        // Update cache
        this.embedSourcesCache.set(documentUri, sources);
    }

    /**
     * Get all source files embedded in a document
     * Returns empty array if no embeds are tracked
     */
    getEmbeddedSources(documentUri: string): string[] {
        const sources = this.embedSourcesCache.get(documentUri);
        return sources ? Array.from(sources) : [];
    }

    /**
     * Get all documents that embed a specific source file
     * This is used to know which documents to refresh when a source file changes
     */
    getDocumentsEmbeddingSource(sourceFilePath: string): string[] {
        const documents: string[] = [];

        for (const [documentUri, sources] of this.embedSourcesCache) {
            if (sources.has(sourceFilePath)) {
                documents.push(documentUri);
            }
        }

        return documents;
    }

    /**
     * Clear embed sources cache for a specific document
     */
    clearEmbedSourcesCache(documentUri: string): void {
        this.embedSourcesCache.delete(documentUri);
    }

    /**
     * Clear all embed sources cache
     */
    clearAllEmbedSourcesCache(): void {
        this.embedSourcesCache.clear();
    }

    /**
     * Check if an embed at a position exists in the document
     */
    getEmbedAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): NoteEmbed | undefined {
        const line = document.lineAt(position.line);
        const text = line.text;

        // Reset regex state
        EMBED_PATTERN.lastIndex = 0;
        let match;

        while ((match = EMBED_PATTERN.exec(text)) !== null) {
            const startCol = match.index;
            const endCol = match.index + match[0].length;

            // Check if cursor is within this embed
            if (position.character >= startCol && position.character <= endCol) {
                const noteName = match[1].trim();
                const section = match[2] ? match[2].trim() : undefined;
                const displayText = match[3] ? match[3].trim() : undefined;
                const range = new vscode.Range(
                    position.line,
                    startCol,
                    position.line,
                    endCol
                );

                // Determine if this is an image or note embed
                const type = this.isImageFile(noteName) ? 'image' : 'note';

                return { noteName, section, displayText, range, type };
            }
        }

        return undefined;
    }

    /**
     * Process embedded content for webview rendering
     * Replaces ![[note-name]] and ![[image.png]] with rendered markdown
     */
    async processEmbedsForWebview(
        content: string,
        webview: vscode.Webview,
        currentDocumentUri?: vscode.Uri
    ): Promise<string> {
        const embedMatches: EmbedMatch[] = [];

        // First, collect all embed matches
        EMBED_PATTERN.lastIndex = 0;
        let match;
        while ((match = EMBED_PATTERN.exec(content)) !== null) {
            const noteName = match[1].trim();
            const section = match[2] ? match[2].trim() : undefined;
            const displayText = match[3] ? match[3].trim() : undefined;

            // Determine embed type based on file extension
            let type: 'note' | 'image' | 'diagram' = 'note';
            if (this.isDiagramFile(noteName)) {
                type = 'diagram';
            } else if (this.isImageFile(noteName)) {
                type = 'image';
            }

            embedMatches.push({
                match: match[0],
                noteName,
                section,
                displayText,
                index: match.index,
                type
            });
        }

        // Track processing statistics
        let successCount = 0;
        let failureCount = 0;

        // Build array of replacement parts (process in reverse to maintain indices)
        const parts: string[] = [];
        let lastIndex = content.length;

        // Process embeds in reverse order to maintain correct indices
        for (let i = embedMatches.length - 1; i >= 0; i--) {
            const embed = embedMatches[i];
            const embedEnd = embed.index + embed.match.length;
            let replacement: string;

            try {
                if (embed.type === 'image' || embed.type === 'diagram') {
                    // Process as embedded image or diagram (both use image rendering)
                    // Diagrams with .svg or .png extensions can be embedded directly
                    replacement = await this.renderEmbeddedImageForWebview(
                        embed.noteName,
                        webview,
                        currentDocumentUri?.fsPath,
                        embed.type === 'diagram'
                    );
                } else {
                    // Process as embedded note
                    replacement = await this.renderEmbeddedNoteForWebview(
                        embed.noteName,
                        embed.section,
                        embed.displayText
                    );
                }
                successCount++;
            } catch (error) {
                // Handle individual embed processing errors
                failureCount++;
                const errorMessage = error instanceof Error ? error.message : String(error);
                const embedReference = embed.section
                    ? `${embed.noteName}#${embed.section}`
                    : embed.noteName;

                console.error(
                    `[NOTED] Failed to process ${embed.type} embed '${embedReference}':`,
                    {
                        error: errorMessage,
                        embedType: embed.type,
                        noteName: embed.noteName,
                        section: embed.section,
                        displayText: embed.displayText
                    }
                );

                // Replace with error placeholder instead of crashing
                replacement = `\n\n> ❌ **Error rendering ${embed.type}**: \`${embedReference}\`\n> _${errorMessage}_\n\n`;
            }

            // Build content parts: text after this embed + replacement
            parts.unshift(content.substring(embedEnd, lastIndex));
            parts.unshift(replacement);
            lastIndex = embed.index;
        }

        // Add the content before the first embed (or entire content if no embeds)
        parts.unshift(content.substring(0, lastIndex));

        // Log processing summary
        if (embedMatches.length > 0) {
            console.log(
                `[NOTED] Embed processing complete: ${successCount} succeeded, ${failureCount} failed (${embedMatches.length} total)`
            );
        }

        // Join all parts to create final processed content
        return parts.join('');
    }

    /**
     * Render an embedded image for webview display
     */
    private async renderEmbeddedImageForWebview(
        imagePath: string,
        webview: vscode.Webview,
        currentDocumentPath?: string,
        isDiagram: boolean = false
    ): Promise<string> {
        const resolvedPath = await this.resolveImagePath(imagePath, currentDocumentPath);

        if (!resolvedPath) {
            // Image/diagram not found, render a placeholder
            const icon = isDiagram ? '📊' : '📷';
            const type = isDiagram ? 'Diagram' : 'Image';
            return `\n\n> ${icon} **${type} not found:** \`${imagePath}\`\n\n`;
        }

        try {
            // Check if this is a raw diagram file (not exported as .svg or .png)
            const lowerPath = resolvedPath.toLowerCase();
            const isRawDiagram = (lowerPath.endsWith('.drawio') || lowerPath.endsWith('.excalidraw'))
                && !lowerPath.endsWith('.svg') && !lowerPath.endsWith('.png');

            if (isRawDiagram) {
                // Raw diagram files need to be opened in their respective editors
                const filename = path.basename(resolvedPath);
                const diagramType = lowerPath.endsWith('.drawio') ? 'Draw.io' : 'Excalidraw';
                return `\n\n> 📊 **${diagramType} diagram:** [\`${filename}\`](command:vscode.open?${encodeURIComponent(JSON.stringify(vscode.Uri.file(resolvedPath)))})\n> _Click to open in ${diagramType} editor_\n\n`;
            }

            // Convert to webview URI for images and exported diagram files (.svg, .png)
            const imageUri = webview.asWebviewUri(vscode.Uri.file(resolvedPath));
            const filename = path.basename(resolvedPath);

            // Return markdown image syntax
            return `\n\n![${filename}](${imageUri.toString()})\n\n`;
        } catch (error) {
            console.error('[NOTED] Error processing embedded image/diagram:', imagePath, error);
            return `\n\n> ⚠️ **Error loading:** \`${imagePath}\`\n\n`;
        }
    }

    /**
     * Render an embedded note for webview display
     */
    private async renderEmbeddedNoteForWebview(
        noteName: string,
        section?: string,
        displayText?: string
    ): Promise<string> {
        try {
            // Resolve the note using link service
            const notePath = await this.linkService.resolveLink(noteName);

            if (!notePath) {
                // Note not found, render a placeholder
                return `\n\n> 📝 **Note not found:** \`${noteName}\`\n\n`;
            }

            // Read the note content (with optional section)
            const noteContent = await this.getEmbedContent(notePath, section);

            if (!noteContent) {
                return `\n\n> 📝 **Section not found:** \`${noteName}${section ? '#' + section : ''}\`\n\n`;
            }

            const filename = path.basename(notePath, path.extname(notePath));
            const displayName = displayText || (section ? `${filename}#${section}` : filename);

            // Process the note content:
            // 1. Remove frontmatter if present
            const contentWithoutFrontmatter = this.removeFrontmatter(noteContent);

            // 2. Create embedded note section using helper
            return this.generateEmbeddedNoteHtml(displayName, contentWithoutFrontmatter);
        } catch (error) {
            console.error('[NOTED] Error processing embedded note:', noteName, error);
            return `\n\n> ⚠️ **Error loading note:** \`${noteName}\`\n\n`;
        }
    }

    /**
     * Generate HTML structure for embedded note
     * @param displayName The display name/title for the embedded note
     * @param content The note content to embed
     * @returns HTML string for the embedded note
     */
    private generateEmbeddedNoteHtml(displayName: string, content: string): string {
        // Escape any HTML in the display name to prevent XSS
        const escapedDisplayName = this.escapeHtml(displayName);
        const trimmedContent = content.trim();

        return [
            '\n',
            '<div class="embedded-note">',
            '\n',
            `### 📄 ${escapedDisplayName}`,
            '\n\n',
            trimmedContent,
            '\n',
            '</div>',
            '\n'
        ].join('');
    }

    /**
     * Escape HTML special characters to prevent XSS
     */
    private escapeHtml(text: string): string {
        const htmlEscapes: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
    }

    /**
     * Remove YAML frontmatter from note content
     * Handles various edge cases:
     * - CRLF and LF line endings
     * - Leading/trailing whitespace
     * - Different spacing variations around delimiters
     */
    private removeFrontmatter(content: string): string {
        // Normalize line endings to LF for consistent processing
        const normalizedContent = content.replace(/\r\n/g, '\n');

        // Trim leading whitespace to find frontmatter at the start
        const trimmedContent = normalizedContent.trimStart();

        // Check if content starts with frontmatter delimiters (---)
        // Pattern explanation:
        // ^---         : Must start with exactly three hyphens at the beginning
        // [\s]*        : Optional whitespace after opening ---
        // \n           : Newline
        // ([\s\S]*?)   : Capture group for frontmatter content (non-greedy)
        // \n           : Newline before closing delimiter
        // ---          : Closing delimiter (exactly three hyphens)
        // [\s]*        : Optional whitespace after closing ---
        // (?:\n|$)     : Must be followed by newline or end of string
        const frontmatterRegex = /^---[\s]*\n([\s\S]*?)\n---[\s]*(?:\n|$)/;
        const match = trimmedContent.match(frontmatterRegex);

        if (match) {
            // Calculate how much leading whitespace was removed
            const leadingWhitespace = normalizedContent.length - trimmedContent.length;

            // Return content after frontmatter, preserving original line ending style
            const contentAfterFrontmatter = trimmedContent.substring(match[0].length);

            // If the original content had CRLF, restore it
            if (content.includes('\r\n')) {
                return contentAfterFrontmatter.replace(/\n/g, '\r\n');
            }

            return contentAfterFrontmatter;
        }

        // No frontmatter found, return original content
        return content;
    }
}
