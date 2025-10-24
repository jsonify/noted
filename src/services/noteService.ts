import * as vscode from 'vscode';
import * as path from 'path';
import { SUPPORTED_EXTENSIONS } from '../constants';
import { getNotesPath, getFileFormat } from './configService';
import { pathExists, createDirectory, writeFile, readFile, readDirectoryWithTypes, getFileStats } from './fileSystemService';
import { generateTemplate } from './templateService';
import { getYear, getMonth, getMonthName, getDay, getFolderName, getTimeForFilename } from '../utils/dateHelpers';
import { TagService } from './tagService';

/**
 * Open or create today's daily note
 */
export async function openDailyNote(templateType?: string): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        const fileFormat = getFileFormat();
        const now = new Date();

        const year = getYear(now);
        const month = getMonth(now);
        const monthName = getMonthName(now);
        const folderName = `${month}-${monthName}`;
        const day = getDay(now);
        const fileName = `${year}-${month}-${day}.${fileFormat}`;

        const noteFolder = path.join(notesPath, year, folderName);
        const filePath = path.join(noteFolder, fileName);

        if (!(await pathExists(noteFolder))) {
            await createDirectory(noteFolder);
        }

        if (!(await pathExists(filePath))) {
            const content = await generateTemplate(templateType, now);
            await writeFile(filePath, content);
        }

        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        const lastLine = document.lineCount - 1;
        const lastCharacter = document.lineAt(lastLine).text.length;
        editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open daily note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Create a new note from a template
 */
export async function createNoteFromTemplate(templateType: string): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        // Ask for note name
        const noteName = await vscode.window.showInputBox({
            prompt: 'Enter note name',
            placeHolder: 'my-note'
        });

        if (!noteName) {
            return;
        }

        // Sanitize filename: replace spaces with dashes, remove special chars
        const sanitizedName = noteName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_]/g, '');

        const fileFormat = getFileFormat();
        const now = new Date();

        // All non-daily notes go to Inbox folder
        const noteFolder = path.join(notesPath, 'Inbox');
        const fileName = `${sanitizedName}.${fileFormat}`;
        const filePath = path.join(noteFolder, fileName);

        // Create Inbox folder if it doesn't exist
        if (!(await pathExists(noteFolder))) {
            await createDirectory(noteFolder);
        }

        if (await pathExists(filePath)) {
            vscode.window.showWarningMessage('A note with this name already exists');
            return;
        }

        const content = await generateTemplate(templateType, now, fileName);
        await writeFile(filePath, content);

        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        const lastLine = document.lineCount - 1;
        const lastCharacter = document.lineAt(lastLine).text.length;
        editor.selection = new vscode.Selection(lastLine, lastCharacter, lastLine, lastCharacter);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Parse tag queries from search string
 * Returns object with extracted tags and remaining text search query
 */
function parseTagQueries(query: string): { tags: string[], textQuery: string } {
    const tags: string[] = [];
    let textQuery = query;

    // Match all tag:tagname patterns (case-insensitive)
    const tagPattern = /tag:\s*(\S+)/gi;
    let match;

    while ((match = tagPattern.exec(query)) !== null) {
        const tagName = match[1].toLowerCase().trim();
        if (tagName) {
            tags.push(tagName);
        }
    }

    // Remove all tag: queries from the search string
    textQuery = query.replace(/tag:\s*\S+/gi, '').trim();

    return { tags, textQuery };
}

/**
 * Search for a query string in all notes
 * Supports tag-based search with "tag:tagname" syntax
 */
export async function searchInNotes(
    query: string,
    tagService?: TagService,
    customNotesPath?: string
): Promise<Array<{file: string, preview: string}>> {
    // Use custom path for testing, or get from config
    const notesPath = customNotesPath || getNotesPath();
    if (!notesPath) {
        return [];
    }

    if (!(await pathExists(notesPath))) {
        return [];
    }

    // Parse tag queries from search string
    const { tags, textQuery } = parseTagQueries(query);

    // If tag queries exist and TagService is available, filter by tags first
    let tagFilteredFiles: Set<string> | null = null;
    if (tags.length > 0 && tagService) {
        const notesWithTags = tagService.getNotesWithTags(tags);
        tagFilteredFiles = new Set(notesWithTags);

        // If no notes match the tags, return empty results
        if (tagFilteredFiles.size === 0) {
            return [];
        }
    }

    const results: Array<{file: string, preview: string}> = [];
    const searchLower = textQuery.toLowerCase();
    const hasTextSearch = textQuery.length > 0;

    async function searchDir(dir: string) {
        try {
            const entries = await readDirectoryWithTypes(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await searchDir(fullPath);
                } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                    // Skip files not in tag filter if tag filtering is active
                    if (tagFilteredFiles && !tagFilteredFiles.has(fullPath)) {
                        continue;
                    }

                    try {
                        const content = await readFile(fullPath);

                        // If there's text search, check content matches
                        if (hasTextSearch && !content.toLowerCase().includes(searchLower)) {
                            continue;
                        }

                        // Generate preview
                        let preview = '';
                        if (hasTextSearch) {
                            // For text search, show the matching line
                            const lines = content.split('\n');
                            const matchLine = lines.find(l => l.toLowerCase().includes(searchLower));
                            preview = matchLine?.trim().substring(0, 80) || '';
                        } else if (tags.length > 0) {
                            // For tag-only search, show the tags line
                            const lines = content.split('\n');
                            const tagsLine = lines.find(l => l.toLowerCase().trim().startsWith('tags:'));
                            preview = tagsLine?.trim().substring(0, 80) || '';
                        }

                        results.push({
                            file: fullPath,
                            preview: preview
                        });
                    } catch (error) {
                        console.error('[NOTED] Error reading file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    await searchDir(notesPath);
    return results;
}

/**
 * Get note statistics
 */
export async function getNoteStats(): Promise<{total: number, thisWeek: number, thisMonth: number}> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    if (!(await pathExists(notesPath))) {
        return { total: 0, thisWeek: 0, thisMonth: 0 };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let total = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    async function countFiles(dir: string) {
        try {
            const entries = await readDirectoryWithTypes(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await countFiles(fullPath);
                } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                    total++;
                    try {
                        const stat = await getFileStats(fullPath);
                        if (stat.mtime >= weekAgo) {thisWeek++;}
                        if (stat.mtime >= monthStart) {thisMonth++;}
                    } catch (error) {
                        console.error('[NOTED] Error stating file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    await countFiles(notesPath);
    return { total, thisWeek, thisMonth };
}

/**
 * Export notes to a single file
 */
export async function exportNotesToFile(range: string): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    if (!(await pathExists(notesPath))) {
        vscode.window.showErrorMessage('No notes found');
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;

    const now = new Date();
    let filterDate: Date;

    if (range === 'This Week') {
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'This Month') {
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        filterDate = new Date(0);
    }

    let combinedContent = `Exported Notes - ${range}\n${'='.repeat(50)}\n\n`;

    async function collectNotes(dir: string) {
        try {
            const entries = await readDirectoryWithTypes(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await collectNotes(fullPath);
                } else if (SUPPORTED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                    try {
                        const stat = await getFileStats(fullPath);
                        if (stat.mtime >= filterDate) {
                            const content = await readFile(fullPath);
                            combinedContent += `\n\n--- ${entry.name} ---\n\n${content}`;
                        }
                    } catch (error) {
                        console.error('[NOTED] Error processing file:', fullPath, error);
                    }
                }
            }
        } catch (error) {
            console.error('[NOTED] Error reading directory:', dir, error);
        }
    }

    try {
        await collectNotes(notesPath);

        const exportPath = path.join(rootPath, `notes-export-${Date.now()}.txt`);
        await writeFile(exportPath, combinedContent);

        const document = await vscode.workspace.openTextDocument(exportPath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Exported to ${path.basename(exportPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to export notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}
