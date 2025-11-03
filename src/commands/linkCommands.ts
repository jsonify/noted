/**
 * Commands for wiki-style links and placeholders
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import { getNotesPath, getFileFormat } from '../services/configService';
import { generateTemplate } from '../services/templateService';
import { MONTH_NAMES } from '../constants';

export async function handleCreateNoteFromPlaceholder(
    linkText: string,
    refresh: () => void
) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured.');
        return;
    }

    try {
        // Ask user for confirmation
        const answer = await vscode.window.showInformationMessage(
            `Create new note "${linkText}"?`,
            'Create',
            'Cancel'
        );

        if (answer !== 'Create') {
            return;
        }

        // Get current date for folder structure
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const monthName = now.toLocaleString('en-US', { month: 'long' });
        const folderName = `${month}-${monthName}`;

        // Create folder structure if it doesn't exist
        const yearPath = path.join(notesPath, year);
        const monthPath = path.join(yearPath, folderName);

        if (!fs.existsSync(yearPath)) {
            fs.mkdirSync(yearPath, { recursive: true });
        }
        if (!fs.existsSync(monthPath)) {
            fs.mkdirSync(monthPath, { recursive: true });
        }

        // Get file format from config
        const fileFormat = getFileFormat();

        // Create the note file
        const fileName = `${linkText}.${fileFormat}`;
        const filePath = path.join(monthPath, fileName);

        // Check if file already exists
        if (fs.existsSync(filePath)) {
            vscode.window.showWarningMessage('Note already exists');
            // Open the existing note
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
            return;
        }

        // Create the file with basic content
        const content = await generateTemplate('quick', now, linkText);
        await fsp.writeFile(filePath, content, 'utf8');

        // Open the note
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`Created note: ${linkText}`);
        refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleOpenPlaceholderSource(filePath: string, lineNumber: number) {
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        // Navigate to the line where the placeholder appears
        const position = new vscode.Position(lineNumber, 0);
        const range = new vscode.Range(position, position);

        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleCreateNoteFromLink(
    linkText: string,
    refresh: () => void
) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Notes folder not configured.');
        return;
    }

    try {
        // Get current date for folder structure
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const monthName = MONTH_NAMES[now.getMonth()];
        const day = now.getDate().toString().padStart(2, '0');

        // Create the folder structure
        const folderName = `${month}-${monthName}`;
        const folderPath = path.join(notesPath, year, folderName);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Get file format
        const fileFormat = getFileFormat();

        // Check if this is a dated note (YYYY-MM-DD format)
        const dateMatch = linkText.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        let filePath: string;
        let templateContent: string;

        if (dateMatch) {
            // This is a daily note - create it with year/month folder structure
            const noteYear = dateMatch[1];
            const noteMonth = dateMatch[2];
            const noteDay = dateMatch[3];

            const monthIndex = parseInt(noteMonth) - 1;
            const noteMonthName = MONTH_NAMES[monthIndex];
            const noteFolderName = `${noteMonth}-${noteMonthName}`;

            const noteFolderPath = path.join(notesPath, noteYear, noteFolderName);

            if (!fs.existsSync(noteFolderPath)) {
                fs.mkdirSync(noteFolderPath, { recursive: true });
            }

            const fileName = `${linkText}.${fileFormat}`;
            filePath = path.join(noteFolderPath, fileName);

            // Use the date from the link for the template
            const linkDate = new Date(parseInt(noteYear), parseInt(noteMonth) - 1, parseInt(noteDay));
            templateContent = await generateTemplate('quick', linkDate, linkText);
        } else {
            // Regular note - use current date folder
            const fileName = `${linkText}.${fileFormat}`;
            filePath = path.join(folderPath, fileName);

            // Create the note with a simple template
            templateContent = await generateTemplate('quick', now, linkText);
        }

        // Check if file already exists
        if (fs.existsSync(filePath)) {
            vscode.window.showWarningMessage('Note already exists');
            // Open the existing note
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
            return;
        }

        // Write the file
        await fsp.writeFile(filePath, templateContent, 'utf8');

        // Open the note
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`Created note: ${linkText}`);
        refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create note: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function handleOpenLinkWithSection(filePath: string, sectionName: string) {
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);

        // Find the section in the document
        const text = document.getText();
        const lines = text.split('\n');

        let sectionLine = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match both markdown headers and text-style headings
            if (
                line.trim().startsWith('#') && line.toLowerCase().includes(sectionName.toLowerCase()) ||
                line.trim().toLowerCase() === sectionName.toLowerCase()
            ) {
                sectionLine = i;
                break;
            }
        }

        if (sectionLine >= 0) {
            const position = new vscode.Position(sectionLine, 0);
            const range = new vscode.Range(position, position);

            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                range,
                vscode.TextEditorRevealType.InCenter
            );
        } else {
            // Section not found - still open the file but show a message
            vscode.window.showWarningMessage(`Section "${sectionName}" not found in note`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open note: ${error instanceof Error ? error.message : String(error)}`);
    }
}
