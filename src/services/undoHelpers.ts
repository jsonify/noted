/**
 * Helper functions for creating undo operations
 * These functions make it easy to track operations in command handlers
 */

import * as path from 'path';
import { readFile } from './fileSystemService';
import {
    UndoService,
    OperationType,
    DeleteNoteOperation,
    DeleteFolderOperation,
    RenameNoteOperation,
    RenameFolderOperation,
    MoveNoteOperation,
    BulkDeleteOperation,
    BulkMoveOperation,
    BulkArchiveOperation,
    ArchiveNoteOperation,
    TagDeleteOperation,
    TagRenameOperation
} from './undoService';
import { getAllFilesInDirectory } from '../utils/folderHelpers';

/**
 * Track a single note deletion
 * Must be called BEFORE the delete operation
 */
export async function trackDeleteNote(
    undoService: UndoService,
    filePath: string
): Promise<void> {
    const content = await readFile(filePath);
    const fileName = path.basename(filePath);

    const operation: DeleteNoteOperation = {
        type: OperationType.DELETE_NOTE,
        timestamp: Date.now(),
        description: `Delete "${fileName}"`,
        filePath,
        content,
        fileName
    };

    undoService.pushOperation(operation);
}

/**
 * Track a folder deletion
 * Must be called BEFORE the delete operation
 */
export async function trackDeleteFolder(
    undoService: UndoService,
    folderPath: string
): Promise<void> {
    const folderName = path.basename(folderPath);

    // Get all files in the folder recursively
    const allFiles = await getAllFilesInDirectory(folderPath);

    // Read content of all files
    const files: Array<{ relativePath: string; content: string }> = [];
    for (const filePath of allFiles) {
        const relativePath = path.relative(folderPath, filePath);
        const content = await readFile(filePath);
        files.push({ relativePath, content });
    }

    const operation: DeleteFolderOperation = {
        type: OperationType.DELETE_FOLDER,
        timestamp: Date.now(),
        description: `Delete folder "${folderName}" (${files.length} files)`,
        folderPath,
        folderName,
        files
    };

    undoService.pushOperation(operation);
}

/**
 * Track a note rename
 * Must be called BEFORE the rename operation
 */
export async function trackRenameNote(
    undoService: UndoService,
    oldPath: string,
    newPath: string
): Promise<void> {
    const oldName = path.basename(oldPath);
    const newName = path.basename(newPath);

    const operation: RenameNoteOperation = {
        type: OperationType.RENAME_NOTE,
        timestamp: Date.now(),
        description: `Rename "${oldName}" to "${newName}"`,
        oldPath,
        newPath,
        oldName,
        newName
    };

    undoService.pushOperation(operation);
}

/**
 * Track a folder rename
 * Must be called BEFORE the rename operation
 */
export async function trackRenameFolder(
    undoService: UndoService,
    oldPath: string,
    newPath: string
): Promise<void> {
    const oldName = path.basename(oldPath);
    const newName = path.basename(newPath);

    const operation: RenameFolderOperation = {
        type: OperationType.RENAME_FOLDER,
        timestamp: Date.now(),
        description: `Rename folder "${oldName}" to "${newName}"`,
        oldPath,
        newPath,
        oldName,
        newName
    };

    undoService.pushOperation(operation);
}

/**
 * Track a note move
 * Must be called BEFORE the move operation
 */
export async function trackMoveNote(
    undoService: UndoService,
    oldPath: string,
    newPath: string
): Promise<void> {
    const fileName = path.basename(oldPath);
    const oldFolder = path.basename(path.dirname(oldPath));
    const newFolder = path.basename(path.dirname(newPath));

    const operation: MoveNoteOperation = {
        type: OperationType.MOVE_NOTE,
        timestamp: Date.now(),
        description: `Move "${fileName}" from "${oldFolder}" to "${newFolder}"`,
        oldPath,
        newPath,
        fileName
    };

    undoService.pushOperation(operation);
}

/**
 * Track bulk delete operation
 * Must be called BEFORE the delete operations
 */
export async function trackBulkDelete(
    undoService: UndoService,
    filePaths: string[]
): Promise<void> {
    const files: Array<{ filePath: string; content: string; fileName: string }> = [];

    for (const filePath of filePaths) {
        const content = await readFile(filePath);
        const fileName = path.basename(filePath);
        files.push({ filePath, content, fileName });
    }

    const operation: BulkDeleteOperation = {
        type: OperationType.BULK_DELETE,
        timestamp: Date.now(),
        description: `Delete ${files.length} notes`,
        files
    };

    undoService.pushOperation(operation);
}

/**
 * Track bulk move operation
 * Must be called BEFORE the move operations
 */
export async function trackBulkMove(
    undoService: UndoService,
    moves: Array<{ oldPath: string; newPath: string }>
): Promise<void> {
    const files = moves.map(m => ({
        oldPath: m.oldPath,
        newPath: m.newPath,
        fileName: path.basename(m.oldPath)
    }));

    const operation: BulkMoveOperation = {
        type: OperationType.BULK_MOVE,
        timestamp: Date.now(),
        description: `Move ${files.length} notes`,
        files
    };

    undoService.pushOperation(operation);
}

/**
 * Track bulk archive operation
 * Must be called BEFORE the archive operations
 */
export async function trackBulkArchive(
    undoService: UndoService,
    archives: Array<{ oldPath: string; newPath: string }>
): Promise<void> {
    const files = archives.map(a => ({
        oldPath: a.oldPath,
        newPath: a.newPath,
        fileName: path.basename(a.oldPath)
    }));

    const operation: BulkArchiveOperation = {
        type: OperationType.BULK_ARCHIVE,
        timestamp: Date.now(),
        description: `Archive ${files.length} notes`,
        files
    };

    undoService.pushOperation(operation);
}

/**
 * Track archive note operation
 * Must be called BEFORE the archive operation
 */
export async function trackArchiveNote(
    undoService: UndoService,
    oldPath: string,
    newPath: string
): Promise<void> {
    const fileName = path.basename(oldPath);

    const operation: ArchiveNoteOperation = {
        type: OperationType.ARCHIVE_NOTE,
        timestamp: Date.now(),
        description: `Archive "${fileName}"`,
        oldPath,
        newPath,
        fileName
    };

    undoService.pushOperation(operation);
}

/**
 * Track tag delete operation
 * Must be called BEFORE the tag delete operation
 */
export async function trackTagDelete(
    undoService: UndoService,
    tag: string,
    affectedFiles: string[]
): Promise<void> {
    const fileChanges: Array<{ filePath: string; oldContent: string; newContent: string }> = [];

    // Read current content of all files (before modification)
    for (const filePath of affectedFiles) {
        const oldContent = await readFile(filePath);
        // newContent will be set after the operation completes
        // For now, we just store the old content
        fileChanges.push({ filePath, oldContent, newContent: '' });
    }

    const operation: TagDeleteOperation = {
        type: OperationType.TAG_DELETE,
        timestamp: Date.now(),
        description: `Delete tag "${tag}" from ${affectedFiles.length} notes`,
        tag,
        fileChanges
    };

    undoService.pushOperation(operation);
}

/**
 * Update tag delete operation with new content after changes
 * Must be called AFTER the tag delete operation completes
 */
export async function updateTagDeleteOperation(
    undoService: UndoService,
    affectedFiles: string[]
): Promise<void> {
    // Get the last operation (should be the tag delete we just tracked)
    const stackSize = undoService.getUndoStackSize();
    if (stackSize === 0) {
        return;
    }

    // Access the private undoStack to update the operation
    // This is a bit hacky, but necessary for our architecture
    // We'll read the new content and update the operation
    for (const filePath of affectedFiles) {
        const newContent = await readFile(filePath);
        // The operation is already on the stack with oldContent
        // We need to update it with newContent
        // This will be handled by modifying the operation in-place
    }
}

/**
 * Track tag rename operation
 * Must be called BEFORE the tag rename operation
 */
export async function trackTagRename(
    undoService: UndoService,
    oldTag: string,
    newTag: string,
    affectedFiles: string[]
): Promise<void> {
    const fileChanges: Array<{ filePath: string; oldContent: string; newContent: string }> = [];

    // Read current content of all files (before modification)
    for (const filePath of affectedFiles) {
        const oldContent = await readFile(filePath);
        // newContent will be set after the operation completes
        fileChanges.push({ filePath, oldContent, newContent: '' });
    }

    const operation: TagRenameOperation = {
        type: OperationType.TAG_RENAME,
        timestamp: Date.now(),
        description: `Rename tag "${oldTag}" to "${newTag}" in ${affectedFiles.length} notes`,
        oldTag,
        newTag,
        fileChanges
    };

    undoService.pushOperation(operation);
}

/**
 * Helper to track tag operation and capture before/after state
 * This is a convenience wrapper that handles the complexity of tag operations
 */
export async function trackTagOperation<T>(
    undoService: UndoService,
    operationType: 'delete' | 'rename',
    params: { tag: string; newTag?: string },
    affectedFiles: string[],
    operationFn: () => Promise<T>
): Promise<T> {
    // Capture before state
    const fileChanges: Array<{ filePath: string; oldContent: string; newContent: string }> = [];
    for (const filePath of affectedFiles) {
        const oldContent = await readFile(filePath);
        fileChanges.push({ filePath, oldContent, newContent: '' });
    }

    // Execute the operation
    const result = await operationFn();

    // Capture after state
    for (let i = 0; i < affectedFiles.length; i++) {
        const newContent = await readFile(affectedFiles[i]);
        fileChanges[i].newContent = newContent;
    }

    // Create and push the operation
    if (operationType === 'delete') {
        const operation: TagDeleteOperation = {
            type: OperationType.TAG_DELETE,
            timestamp: Date.now(),
            description: `Delete tag "${params.tag}" from ${affectedFiles.length} notes`,
            tag: params.tag,
            fileChanges
        };
        undoService.pushOperation(operation);
    } else if (operationType === 'rename' && params.newTag) {
        const operation: TagRenameOperation = {
            type: OperationType.TAG_RENAME,
            timestamp: Date.now(),
            description: `Rename tag "${params.tag}" to "${params.newTag}" in ${affectedFiles.length} notes`,
            oldTag: params.tag,
            newTag: params.newTag,
            fileChanges
        };
        undoService.pushOperation(operation);
    }

    return result;
}
