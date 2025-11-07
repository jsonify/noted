# Phase 3 Code Changes - Complete Reference

## File 1: src/services/noteService.ts

### Import Addition (Line 9)
```typescript
import { SummarizationService } from './summarizationService';
```

### Function Signature Change (Lines 281-285)
```typescript
export async function exportNotesToFile(
    range: string,
    summarizationService?: SummarizationService,
    includeSummaries: boolean = false
): Promise<void> {
```

### Main Implementation (Lines 314-439)
```typescript
// Collect all notes first
const notesToExport: Array<{ name: string; path: string; content: string }> = [];

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
                        notesToExport.push({
                            name: entry.name,
                            path: fullPath,
                            content
                        });
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
    // First, collect all notes
    await collectNotes(notesPath);

    if (notesToExport.length === 0) {
        vscode.window.showInformationMessage('No notes found in the selected range');
        return;
    }

    // Build export content with optional summaries
    let combinedContent = `Exported Notes - ${range}\n${'='.repeat(50)}\n`;
    combinedContent += `Export Date: ${now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    })}\n`;
    combinedContent += `Total Notes: ${notesToExport.length}\n`;

    if (includeSummaries && summarizationService) {
        combinedContent += `AI Summaries: Included\n`;
    }

    combinedContent += `${'='.repeat(50)}\n\n`;

    // Process notes with or without summaries
    if (includeSummaries && summarizationService) {
        // Use withProgress with cancellation support
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Exporting notes with AI summaries',
                cancellable: true
            },
            async (progress, token) => {
                for (let i = 0; i < notesToExport.length; i++) {
                    // Check for cancellation
                    if (token.isCancellationRequested) {
                        throw new Error('Export cancelled by user');
                    }

                    const note = notesToExport[i];

                    // Update progress
                    progress.report({
                        message: `Exporting ${i + 1} of ${notesToExport.length} notes (generating summaries)...`,
                        increment: (100 / notesToExport.length)
                    });

                    combinedContent += `\n\n${'='.repeat(50)}\n`;
                    combinedContent += `${note.name}\n`;
                    combinedContent += `${'='.repeat(50)}\n\n`;

                    // Generate summary
                    try {
                        const summary = await summarizationService.summarizeNote(note.path, {
                            maxLength: 'medium',
                            format: 'structured',
                            includeActionItems: true
                        });

                        combinedContent += `## AI Summary\n\n${summary}\n\n`;
                        combinedContent += `## Note Content\n\n${note.content}\n`;
                    } catch (error) {
                        // If summary fails, include note without summary
                        combinedContent += `## AI Summary\n\n[Summary generation failed: ${error instanceof Error ? error.message : String(error)}]\n\n`;
                        combinedContent += `## Note Content\n\n${note.content}\n`;
                    }
                }
            }
        );
    } else {
        // Export without summaries (original behavior)
        for (const note of notesToExport) {
            combinedContent += `\n\n--- ${note.name} ---\n\n${note.content}`;
        }
    }

    // Write export file
    const exportPath = path.join(rootPath, `notes-export-${Date.now()}.txt`);
    await writeFile(exportPath, combinedContent);

    // Open the exported file
    const document = await vscode.workspace.openTextDocument(exportPath);
    await vscode.window.showTextDocument(document);

    const summaryInfo = includeSummaries ? ' with AI summaries' : '';
    vscode.window.showInformationMessage(`Exported ${notesToExport.length} note(s)${summaryInfo} to ${path.basename(exportPath)}`);
} catch (error) {
    vscode.window.showErrorMessage(`Failed to export notes: ${error instanceof Error ? error.message : String(error)}`);
}
```

---

## File 2: src/commands/commands.ts

### Complete Function Replacement (Lines 797-831)
```typescript
export async function handleExportNotes(summarizationService?: any) {
    const options = await vscode.window.showQuickPick(
        ['This Week', 'This Month', 'All Notes'],
        { placeHolder: 'Select export range' }
    );

    if (!options) {
        return;
    }

    // Ask if user wants to include AI summaries
    let includeSummaries = false;

    if (summarizationService) {
        const summaryChoice = await vscode.window.showQuickPick(
            [
                { label: 'No', description: 'Export notes without summaries', value: false },
                { label: 'Yes', description: 'Include AI-generated summaries for each note', value: true }
            ],
            {
                placeHolder: 'Include AI summaries in export?',
                title: 'Export Options'
            }
        );

        if (summaryChoice === undefined) {
            // User cancelled
            return;
        }

        includeSummaries = summaryChoice.value;
    }

    await exportNotesToFile(options, summarizationService, includeSummaries);
}
```

---

## File 3: src/extension.ts

### Command Registration Update (Lines 1383-1386)
```typescript
// Command to export notes
let exportNotes = vscode.commands.registerCommand('noted.exportNotes', async () => {
    const { handleExportNotes } = await import('./commands/commands');
    await handleExportNotes(summarizationService);
});
```

### Local exportNotesToFile Function Update (Lines 2515-2669)
Same implementation as in noteService.ts, but uses `fsp` (fs.promises) instead of the fileSystemService wrappers:

```typescript
async function exportNotesToFile(range: string, summarizationService?: SummarizationService, includeSummaries: boolean = false) {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please open a workspace folder first');
        return;
    }

    try {
        await fsp.access(notesPath);
    } catch {
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

    // Collect all notes first
    const notesToExport: Array<{ name: string; path: string; content: string }> = [];

    async function collectNotes(dir: string) {
        try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await collectNotes(fullPath);
                } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
                    try {
                        const stat = await fsp.stat(fullPath);
                        if (stat.mtime >= filterDate) {
                            const content = await fsp.readFile(fullPath, 'utf8');
                            notesToExport.push({
                                name: entry.name,
                                path: fullPath,
                                content
                            });
                        }
                    } catch (error) {
                        // Error processing file
                    }
                }
            }
        } catch (error) {
            // Error reading directory
        }
    }

    try {
        // First, collect all notes
        await collectNotes(notesPath);

        if (notesToExport.length === 0) {
            vscode.window.showInformationMessage('No notes found in the selected range');
            return;
        }

        // Build export content with optional summaries
        let combinedContent = `Exported Notes - ${range}\n${'='.repeat(50)}\n`;
        combinedContent += `Export Date: ${now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })}\n`;
        combinedContent += `Total Notes: ${notesToExport.length}\n`;

        if (includeSummaries && summarizationService) {
            combinedContent += `AI Summaries: Included\n`;
        }

        combinedContent += `${'='.repeat(50)}\n\n`;

        // Process notes with or without summaries
        if (includeSummaries && summarizationService) {
            // Use withProgress with cancellation support
            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Exporting notes with AI summaries',
                    cancellable: true
                },
                async (progress, token) => {
                    for (let i = 0; i < notesToExport.length; i++) {
                        // Check for cancellation
                        if (token.isCancellationRequested) {
                            throw new Error('Export cancelled by user');
                        }

                        const note = notesToExport[i];

                        // Update progress
                        progress.report({
                            message: `Exporting ${i + 1} of ${notesToExport.length} notes (generating summaries)...`,
                            increment: (100 / notesToExport.length)
                        });

                        combinedContent += `\n\n${'='.repeat(50)}\n`;
                        combinedContent += `${note.name}\n`;
                        combinedContent += `${'='.repeat(50)}\n\n`;

                        // Generate summary
                        try {
                            const summary = await summarizationService.summarizeNote(note.path, {
                                maxLength: 'medium',
                                format: 'structured',
                                includeActionItems: true
                            });

                            combinedContent += `## AI Summary\n\n${summary}\n\n`;
                            combinedContent += `## Note Content\n\n${note.content}\n`;
                        } catch (error) {
                            // If summary fails, include note without summary
                            combinedContent += `## AI Summary\n\n[Summary generation failed: ${error instanceof Error ? error.message : String(error)}]\n\n`;
                            combinedContent += `## Note Content\n\n${note.content}\n`;
                        }
                    }
                }
            );
        } else {
            // Export without summaries (original behavior)
            for (const note of notesToExport) {
                combinedContent += `\n\n--- ${note.name} ---\n\n${note.content}`;
            }
        }

        const exportPath = path.join(rootPath, `notes-export-${Date.now()}.txt`);
        await fsp.writeFile(exportPath, combinedContent);

        const document = await vscode.workspace.openTextDocument(exportPath);
        await vscode.window.showTextDocument(document);

        const summaryInfo = includeSummaries ? ' with AI summaries' : '';
        vscode.window.showInformationMessage(`Exported ${notesToExport.length} note(s)${summaryInfo} to ${path.basename(exportPath)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to export notes: ${error instanceof Error ? error.message : String(error)}`);
    }
}
```

---

## Key Differences Between Files

### noteService.ts vs extension.ts
Both have the same logic but different file I/O methods:

| Aspect | noteService.ts | extension.ts |
|--------|---------------|--------------|
| File reading | `readFile()` from fileSystemService | `fsp.readFile()` |
| Directory reading | `readDirectoryWithTypes()` | `fsp.readdir()` |
| File writing | `writeFile()` from fileSystemService | `fsp.writeFile()` |
| File stats | `getFileStats()` | `fsp.stat()` |
| Extension checking | `SUPPORTED_EXTENSIONS.some()` | Hardcoded `.txt` or `.md` |

---

## Summary of Changes

### Total Lines Changed
- **noteService.ts**: ~164 lines modified/added
- **commands.ts**: ~35 lines modified/added
- **extension.ts**: ~157 lines modified/added (function) + 3 lines (registration)

### Total Files Modified: 3
### Total New Documentation Files: 3
- export-format-example.md
- PHASE3_IMPLEMENTATION_SUMMARY.md
- PHASE3_CODE_CHANGES.md (this file)

### Compilation Status
✅ No errors - Ready for testing
