/**
 * Undo Service for Noted Extension
 * Provides undo/redo functionality for destructive operations
 *
 * Architecture:
 * - Operations are stored as a stack with max size limit
 * - Each operation contains the data needed to reverse it
 * - Supports both single and bulk operations
 * - Automatically cleans up old operations beyond stack limit
 */

import * as vscode from 'vscode';
import * as path from 'path';
import {
    deleteFile,
    renameFile,
    copyFile,
    createDirectory,
    deleteDirectory,
    writeFile,
    readFile,
    pathExists
} from './fileSystemService';
import { LinkService } from './linkService';

/**
 * Types of operations that can be undone
 */
export enum OperationType {
    DELETE_NOTE = 'DELETE_NOTE',
    DELETE_FOLDER = 'DELETE_FOLDER',
    RENAME_NOTE = 'RENAME_NOTE',
    RENAME_FOLDER = 'RENAME_FOLDER',
    MOVE_NOTE = 'MOVE_NOTE',
    BULK_DELETE = 'BULK_DELETE',
    BULK_MOVE = 'BULK_MOVE',
    BULK_ARCHIVE = 'BULK_ARCHIVE',
    BULK_MERGE = 'BULK_MERGE',
    ARCHIVE_NOTE = 'ARCHIVE_NOTE',
    TAG_DELETE = 'TAG_DELETE',
    TAG_RENAME = 'TAG_RENAME'
}

/**
 * Base interface for all undo operations
 */
export interface UndoOperation {
    type: OperationType;
    timestamp: number;
    description: string;
}

/**
 * Single note deletion operation
 */
export interface DeleteNoteOperation extends UndoOperation {
    type: OperationType.DELETE_NOTE;
    filePath: string;
    content: string;
    fileName: string;
}

/**
 * Folder deletion operation
 */
export interface DeleteFolderOperation extends UndoOperation {
    type: OperationType.DELETE_FOLDER;
    folderPath: string;
    folderName: string;
    files: Array<{ relativePath: string; content: string }>;
}

/**
 * Note rename operation
 */
export interface RenameNoteOperation extends UndoOperation {
    type: OperationType.RENAME_NOTE;
    oldPath: string;
    newPath: string;
    oldName: string;
    newName: string;
}

/**
 * Folder rename operation
 */
export interface RenameFolderOperation extends UndoOperation {
    type: OperationType.RENAME_FOLDER;
    oldPath: string;
    newPath: string;
    oldName: string;
    newName: string;
}

/**
 * Note move operation
 */
export interface MoveNoteOperation extends UndoOperation {
    type: OperationType.MOVE_NOTE;
    oldPath: string;
    newPath: string;
    fileName: string;
}

/**
 * Bulk delete operation
 */
export interface BulkDeleteOperation extends UndoOperation {
    type: OperationType.BULK_DELETE;
    files: Array<{ filePath: string; content: string; fileName: string }>;
}

/**
 * Bulk move operation
 */
export interface BulkMoveOperation extends UndoOperation {
    type: OperationType.BULK_MOVE;
    files: Array<{ oldPath: string; newPath: string; fileName: string }>;
}

/**
 * Bulk archive operation
 */
export interface BulkArchiveOperation extends UndoOperation {
    type: OperationType.BULK_ARCHIVE;
    files: Array<{ oldPath: string; newPath: string; fileName: string }>;
}

/**
 * Bulk merge operation
 */
export interface BulkMergeOperation extends UndoOperation {
    type: OperationType.BULK_MERGE;
    targetPath: string;
    targetWasNew: boolean;
    targetOriginalContent: string;
    mergedContent: string;
    sourceNotes: Array<{ path: string; content: string }>;
}

/**
 * Archive note operation
 */
export interface ArchiveNoteOperation extends UndoOperation {
    type: OperationType.ARCHIVE_NOTE;
    oldPath: string;
    newPath: string;
    fileName: string;
}

/**
 * Tag deletion operation
 */
export interface TagDeleteOperation extends UndoOperation {
    type: OperationType.TAG_DELETE;
    tag: string;
    fileChanges: Array<{ filePath: string; oldContent: string; newContent: string }>;
}

/**
 * Tag rename operation
 */
export interface TagRenameOperation extends UndoOperation {
    type: OperationType.TAG_RENAME;
    oldTag: string;
    newTag: string;
    fileChanges: Array<{ filePath: string; oldContent: string; newContent: string }>;
}

/**
 * Union type of all operation types
 */
export type AnyUndoOperation =
    | DeleteNoteOperation
    | DeleteFolderOperation
    | RenameNoteOperation
    | RenameFolderOperation
    | MoveNoteOperation
    | BulkDeleteOperation
    | BulkMoveOperation
    | BulkArchiveOperation
    | BulkMergeOperation
    | ArchiveNoteOperation
    | TagDeleteOperation
    | TagRenameOperation;

/**
 * Service for managing undo/redo operations
 */
export class UndoService {
    private undoStack: AnyUndoOperation[] = [];
    private redoStack: AnyUndoOperation[] = [];
    private readonly maxStackSize: number = 50;
    private _onDidChangeUndoState = new vscode.EventEmitter<void>();
    private linkService?: LinkService;

    /**
     * Event fired when undo/redo state changes
     */
    readonly onDidChangeUndoState = this._onDidChangeUndoState.event;

    /**
     * Set the link service for handling link updates during undo/redo
     */
    setLinkService(linkService: LinkService): void {
        this.linkService = linkService;
    }

    /**
     * Add an operation to the undo stack
     * Clears the redo stack as new operations invalidate redo history
     */
    pushOperation(operation: AnyUndoOperation): void {
        this.undoStack.push(operation);

        // Clear redo stack when new operation is performed
        this.redoStack = [];

        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        this._onDidChangeUndoState.fire();
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Get description of the next undo operation
     */
    getUndoDescription(): string | null {
        if (!this.canUndo()) {
            return null;
        }
        return this.undoStack[this.undoStack.length - 1].description;
    }

    /**
     * Get description of the next redo operation
     */
    getRedoDescription(): string | null {
        if (!this.canRedo()) {
            return null;
        }
        return this.redoStack[this.redoStack.length - 1].description;
    }

    /**
     * Undo the last operation
     */
    async undo(): Promise<boolean> {
        if (!this.canUndo()) {
            vscode.window.showInformationMessage('Nothing to undo');
            return false;
        }

        const operation = this.undoStack.pop()!;

        try {
            await this.reverseOperation(operation);
            this.redoStack.push(operation);
            this._onDidChangeUndoState.fire();

            vscode.window.showInformationMessage(`Undone: ${operation.description}`);
            return true;
        } catch (error) {
            // If undo fails, put operation back on stack
            this.undoStack.push(operation);
            this._onDidChangeUndoState.fire();

            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to undo: ${message}`);
            return false;
        }
    }

    /**
     * Redo the last undone operation
     */
    async redo(): Promise<boolean> {
        if (!this.canRedo()) {
            vscode.window.showInformationMessage('Nothing to redo');
            return false;
        }

        const operation = this.redoStack.pop()!;

        try {
            await this.reapplyOperation(operation);
            this.undoStack.push(operation);
            this._onDidChangeUndoState.fire();

            vscode.window.showInformationMessage(`Redone: ${operation.description}`);
            return true;
        } catch (error) {
            // If redo fails, put operation back on redo stack
            this.redoStack.push(operation);
            this._onDidChangeUndoState.fire();

            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to redo: ${message}`);
            return false;
        }
    }

    /**
     * Clear all undo/redo history
     */
    clear(): void {
        this.undoStack = [];
        this.redoStack = [];
        this._onDidChangeUndoState.fire();
    }

    /**
     * Get the number of operations in undo stack
     */
    getUndoStackSize(): number {
        return this.undoStack.length;
    }

    /**
     * Get the number of operations in redo stack
     */
    getRedoStackSize(): number {
        return this.redoStack.length;
    }

    /**
     * Reverse an operation (undo it)
     */
    private async reverseOperation(operation: AnyUndoOperation): Promise<void> {
        switch (operation.type) {
            case OperationType.DELETE_NOTE:
                await this.undoDeleteNote(operation);
                break;
            case OperationType.DELETE_FOLDER:
                await this.undoDeleteFolder(operation);
                break;
            case OperationType.RENAME_NOTE:
                await this.undoRenameNote(operation);
                break;
            case OperationType.RENAME_FOLDER:
                await this.undoRenameFolder(operation);
                break;
            case OperationType.MOVE_NOTE:
                await this.undoMoveNote(operation);
                break;
            case OperationType.BULK_DELETE:
                await this.undoBulkDelete(operation);
                break;
            case OperationType.BULK_MOVE:
                await this.undoBulkMove(operation);
                break;
            case OperationType.BULK_ARCHIVE:
                await this.undoBulkArchive(operation);
                break;
            case OperationType.BULK_MERGE:
                await this.undoBulkMerge(operation);
                break;
            case OperationType.ARCHIVE_NOTE:
                await this.undoArchiveNote(operation);
                break;
            case OperationType.TAG_DELETE:
                await this.undoTagDelete(operation);
                break;
            case OperationType.TAG_RENAME:
                await this.undoTagRename(operation);
                break;
        }
    }

    /**
     * Reapply an operation (redo it)
     */
    private async reapplyOperation(operation: AnyUndoOperation): Promise<void> {
        switch (operation.type) {
            case OperationType.DELETE_NOTE:
                await this.redoDeleteNote(operation);
                break;
            case OperationType.DELETE_FOLDER:
                await this.redoDeleteFolder(operation);
                break;
            case OperationType.RENAME_NOTE:
                await this.redoRenameNote(operation);
                break;
            case OperationType.RENAME_FOLDER:
                await this.redoRenameFolder(operation);
                break;
            case OperationType.MOVE_NOTE:
                await this.redoMoveNote(operation);
                break;
            case OperationType.BULK_DELETE:
                await this.redoBulkDelete(operation);
                break;
            case OperationType.BULK_MOVE:
                await this.redoBulkMove(operation);
                break;
            case OperationType.BULK_ARCHIVE:
                await this.redoBulkArchive(operation);
                break;
            case OperationType.BULK_MERGE:
                await this.redoBulkMerge(operation);
                break;
            case OperationType.ARCHIVE_NOTE:
                await this.redoArchiveNote(operation);
                break;
            case OperationType.TAG_DELETE:
                await this.redoTagDelete(operation);
                break;
            case OperationType.TAG_RENAME:
                await this.redoTagRename(operation);
                break;
        }
    }

    // ============================================================================
    // Undo operation implementations
    // ============================================================================

    private async undoDeleteNote(op: DeleteNoteOperation): Promise<void> {
        // Restore the deleted file
        const dir = path.dirname(op.filePath);
        if (!(await pathExists(dir))) {
            await createDirectory(dir);
        }
        await writeFile(op.filePath, op.content);
    }

    private async undoDeleteFolder(op: DeleteFolderOperation): Promise<void> {
        // Recreate folder structure
        await createDirectory(op.folderPath);

        // Restore all files
        for (const file of op.files) {
            const fullPath = path.join(op.folderPath, file.relativePath);
            const dir = path.dirname(fullPath);
            if (!(await pathExists(dir))) {
                await createDirectory(dir);
            }
            await writeFile(fullPath, file.content);
        }
    }

    private async undoRenameNote(op: RenameNoteOperation): Promise<void> {
        // Rename back to original name
        await renameFile(op.newPath, op.oldPath);
    }

    private async undoRenameFolder(op: RenameFolderOperation): Promise<void> {
        // Rename folder back to original name
        await renameFile(op.newPath, op.oldPath);
    }

    private async undoMoveNote(op: MoveNoteOperation): Promise<void> {
        // Move file back to original location
        const oldDir = path.dirname(op.oldPath);
        if (!(await pathExists(oldDir))) {
            await createDirectory(oldDir);
        }
        await renameFile(op.newPath, op.oldPath);
    }

    private async undoBulkDelete(op: BulkDeleteOperation): Promise<void> {
        // Restore all deleted files
        for (const file of op.files) {
            const dir = path.dirname(file.filePath);
            if (!(await pathExists(dir))) {
                await createDirectory(dir);
            }
            await writeFile(file.filePath, file.content);
        }
    }

    private async undoBulkMove(op: BulkMoveOperation): Promise<void> {
        // Move all files back to original locations
        for (const file of op.files) {
            const oldDir = path.dirname(file.oldPath);
            if (!(await pathExists(oldDir))) {
                await createDirectory(oldDir);
            }
            await renameFile(file.newPath, file.oldPath);
        }
    }

    private async undoBulkArchive(op: BulkArchiveOperation): Promise<void> {
        // Unarchive all files
        for (const file of op.files) {
            const oldDir = path.dirname(file.oldPath);
            if (!(await pathExists(oldDir))) {
                await createDirectory(oldDir);
            }
            await renameFile(file.newPath, file.oldPath);
        }
    }

    private async undoBulkMerge(op: BulkMergeOperation): Promise<void> {
        // Restore target note to original state (or delete if it was new)
        if (op.targetWasNew) {
            await deleteFile(op.targetPath);
        } else {
            await writeFile(op.targetPath, op.targetOriginalContent);
        }

        // Restore all source notes
        for (const sourceNote of op.sourceNotes) {
            const dir = path.dirname(sourceNote.path);
            if (!(await pathExists(dir))) {
                await createDirectory(dir);
            }
            await writeFile(sourceNote.path, sourceNote.content);
        }

        // Revert link updates: update links pointing to target back to source notes
        if (this.linkService) {
            for (const sourceNote of op.sourceNotes) {
                await this.linkService.updateLinksOnRename(op.targetPath, sourceNote.path);
            }
        }
    }

    private async undoArchiveNote(op: ArchiveNoteOperation): Promise<void> {
        // Unarchive the note
        const oldDir = path.dirname(op.oldPath);
        if (!(await pathExists(oldDir))) {
            await createDirectory(oldDir);
        }
        await renameFile(op.newPath, op.oldPath);
    }

    private async undoTagDelete(op: TagDeleteOperation): Promise<void> {
        // Restore old content to all modified files
        for (const change of op.fileChanges) {
            await writeFile(change.filePath, change.oldContent);
        }
    }

    private async undoTagRename(op: TagRenameOperation): Promise<void> {
        // Restore old content to all modified files
        for (const change of op.fileChanges) {
            await writeFile(change.filePath, change.oldContent);
        }
    }

    // ============================================================================
    // Redo operation implementations
    // ============================================================================

    private async redoDeleteNote(op: DeleteNoteOperation): Promise<void> {
        // Delete the file again
        await deleteFile(op.filePath);
    }

    private async redoDeleteFolder(op: DeleteFolderOperation): Promise<void> {
        // Delete the folder again
        await deleteDirectory(op.folderPath);
    }

    private async redoRenameNote(op: RenameNoteOperation): Promise<void> {
        // Rename to new name again
        await renameFile(op.oldPath, op.newPath);
    }

    private async redoRenameFolder(op: RenameFolderOperation): Promise<void> {
        // Rename folder to new name again
        await renameFile(op.oldPath, op.newPath);
    }

    private async redoMoveNote(op: MoveNoteOperation): Promise<void> {
        // Move file to new location again
        await renameFile(op.oldPath, op.newPath);
    }

    private async redoBulkDelete(op: BulkDeleteOperation): Promise<void> {
        // Delete all files again
        for (const file of op.files) {
            await deleteFile(file.filePath);
        }
    }

    private async redoBulkMove(op: BulkMoveOperation): Promise<void> {
        // Move all files to new locations again
        for (const file of op.files) {
            await renameFile(file.oldPath, file.newPath);
        }
    }

    private async redoBulkArchive(op: BulkArchiveOperation): Promise<void> {
        // Archive all files again
        for (const file of op.files) {
            await renameFile(file.oldPath, file.newPath);
        }
    }

    private async redoBulkMerge(op: BulkMergeOperation): Promise<void> {
        // Restore the merged content to target
        await writeFile(op.targetPath, op.mergedContent);

        // Re-apply link updates: update links from source notes to target
        if (this.linkService) {
            for (const sourceNote of op.sourceNotes) {
                await this.linkService.updateLinksOnRename(sourceNote.path, op.targetPath);
            }
        }

        // Delete all source notes again
        for (const sourceNote of op.sourceNotes) {
            if (await pathExists(sourceNote.path)) {
                await deleteFile(sourceNote.path);
            }
        }
    }

    private async redoArchiveNote(op: ArchiveNoteOperation): Promise<void> {
        // Archive the note again
        await renameFile(op.oldPath, op.newPath);
    }

    private async redoTagDelete(op: TagDeleteOperation): Promise<void> {
        // Apply new content to all modified files
        for (const change of op.fileChanges) {
            await writeFile(change.filePath, change.newContent);
        }
    }

    private async redoTagRename(op: TagRenameOperation): Promise<void> {
        // Apply new content to all modified files
        for (const change of op.fileChanges) {
            await writeFile(change.filePath, change.newContent);
        }
    }
}
