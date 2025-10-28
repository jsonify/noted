import * as vscode from 'vscode';
import * as path from 'path';
import { readFileSync } from 'fs';
import markdownItRegex from 'markdown-it-regex';
import { EmbedService } from '../../services/embedService';
import { LinkService } from '../../services/linkService';

/**
 * Regex to match wiki-style embed syntax: ![[file-name]]
 * Captures the entire embed including optional parameters
 */
export const WIKILINK_EMBED_REGEX = /!\[\[([^\]]+?)\]\]/;

/**
 * Markdown-it plugin to handle wiki-style embeds in markdown preview
 * Supports images, diagrams (.drawio, .excalidraw), and note embeds
 */
export const markdownItWikilinkEmbed = (
    md: any,
    embedService: EmbedService,
    linkService: LinkService
) => {
    return md.use(markdownItRegex, {
        name: 'embed-wikilinks',
        regex: WIKILINK_EMBED_REGEX,
        replace: (embedMatch: string) => {
            try {
                // Extract the file/note name from ![[filename]]
                const match = embedMatch.match(/!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/);
                if (!match) {
                    return embedMatch;
                }

                const fileName = match[1].trim();
                const displayText = match[2] ? match[2].trim() : undefined;

                // Determine the type of embed
                const isImage = embedService.isImageFile(fileName);
                const isDiagram = embedService.isDiagramFile(fileName);

                if (isImage || isDiagram) {
                    // Handle image and diagram embeds
                    return renderImageOrDiagramEmbed(fileName, displayText, embedService, md);
                } else {
                    // Handle note embeds
                    return renderNoteEmbed(fileName, displayText, linkService, md);
                }
            } catch (error) {
                console.error('[NOTED] Error processing embed in markdown preview:', embedMatch, error);
                return embedMatch;
            }
        }
    });
};

/**
 * Render an image or diagram embed for markdown preview
 */
function renderImageOrDiagramEmbed(
    fileName: string,
    displayText: string | undefined,
    embedService: EmbedService,
    md: any
): string {
    // Get the current active document to use as context for path resolution
    const activeEditor = vscode.window.activeTextEditor;
    const currentDocPath = activeEditor?.document.uri.fsPath;

    // Try to resolve the path synchronously
    // Note: This is a limitation - we can't do async resolution during markdown rendering
    // We'll need to use a synchronous path resolution strategy
    const resolvedPath = resolvePathSync(fileName, currentDocPath, embedService);

    if (!resolvedPath) {
        // File not found - show a placeholder
        const icon = embedService.isDiagramFile(fileName) ? '📊' : '📷';
        return `<div class="noted-embed-not-found">
            ${icon} <strong>File not found:</strong> <code>${escapeHtml(fileName)}</code>
        </div>`;
    }

    // Check if this is a raw diagram file (not exported)
    const lowerPath = resolvedPath.toLowerCase();
    const isRawDiagram = (lowerPath.endsWith('.drawio') || lowerPath.endsWith('.excalidraw'))
        && !lowerPath.endsWith('.svg') && !lowerPath.endsWith('.png');

    if (isRawDiagram) {
        // Raw diagram files can't be embedded directly - show a link
        const baseName = path.basename(resolvedPath);
        const diagramType = lowerPath.endsWith('.drawio') ? 'Draw.io' : 'Excalidraw';
        return `<div class="noted-diagram-link">
            📊 <strong>${diagramType} diagram:</strong> <code>${escapeHtml(baseName)}</code><br/>
            <em>Export as .svg or .png to embed in preview</em>
        </div>`;
    }

    // For images and exported diagrams, use markdown-it's link normalizer
    // Convert to a path that markdown preview can understand
    const normalizedPath = md.normalizeLink(resolvedPath);
    const alt = displayText || path.basename(fileName, path.extname(fileName));

    return `<img src="${normalizedPath}" alt="${escapeHtml(alt)}" class="noted-embedded-image">`;
}

/**
 * Render a note embed for markdown preview
 */
function renderNoteEmbed(
    noteName: string,
    displayText: string | undefined,
    linkService: LinkService,
    md: any
): string {
    // For note embeds in markdown preview, we can't easily inline the content
    // Instead, show a styled link to the note
    const label = displayText || noteName;

    // Try to resolve the note path
    // Since we can't do async here, we'll show a link regardless
    return `<div class="noted-note-embed">
        📄 <strong>Note:</strong> <code>${escapeHtml(label)}</code>
    </div>`;
}

/**
 * Synchronously resolve a file path for images and diagrams
 * This uses a cache and workspace scanning strategy
 */
function resolvePathSync(
    fileName: string,
    currentDocPath: string | undefined,
    embedService: EmbedService
): string | undefined {
    // Check cache first
    const cached = pathResolutionCache.get(fileName);
    if (cached) {
        return cached;
    }

    // Try to resolve synchronously by scanning workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return undefined;
    }

    for (const folder of workspaceFolders) {
        const resolved = findFileSync(folder.uri.fsPath, fileName);
        if (resolved) {
            pathResolutionCache.set(fileName, resolved);
            return resolved;
        }
    }

    return undefined;
}

/**
 * Synchronously search for a file in a directory tree
 * This is a simplified version that doesn't recurse deeply for performance
 */
function findFileSync(directory: string, fileName: string): string | undefined {
    try {
        const fs = require('fs');
        const entries = fs.readdirSync(directory, { withFileTypes: true });

        // Check files in current directory
        for (const entry of entries) {
            if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
                return path.join(directory, entry.name);
            }
        }

        // Recurse into subdirectories (limit depth for performance)
        for (const entry of entries) {
            if (entry.isDirectory()) {
                // Skip common ignore directories
                if (['node_modules', '.git', '.vscode', 'out', 'dist'].includes(entry.name)) {
                    continue;
                }

                const found = findFileSync(path.join(directory, entry.name), fileName);
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
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

// Cache for resolved paths to avoid repeated file system scans
const pathResolutionCache = new Map<string, string>();

/**
 * Clear the path resolution cache (called when files change)
 */
export function clearPathResolutionCache() {
    pathResolutionCache.clear();
}

/**
 * Warm up the cache by scanning for common file types
 * This can be called on extension activation or workspace change
 */
export async function warmUpPathCache(embedService: EmbedService) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    try {
        // Scan workspace for images and diagrams
        for (const folder of workspaceFolders) {
            await scanDirectoryForCache(folder.uri.fsPath, embedService);
        }
        console.log('[NOTED] Path cache warmed up with', pathResolutionCache.size, 'files');
    } catch (error) {
        console.error('[NOTED] Error warming up path cache:', error);
    }
}

/**
 * Recursively scan directory and cache file paths
 */
async function scanDirectoryForCache(directory: string, embedService: EmbedService) {
    try {
        const fs = require('fs').promises;
        const entries = await fs.readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile()) {
                const fileName = entry.name;
                if (embedService.isImageFile(fileName) || embedService.isDiagramFile(fileName)) {
                    const fullPath = path.join(directory, fileName);
                    pathResolutionCache.set(fileName, fullPath);
                }
            } else if (entry.isDirectory()) {
                // Skip common ignore directories
                if (['node_modules', '.git', '.vscode', 'out', 'dist'].includes(entry.name)) {
                    continue;
                }

                await scanDirectoryForCache(path.join(directory, entry.name), embedService);
            }
        }
    } catch (error) {
        // Silently fail for directories we can't read
    }
}
