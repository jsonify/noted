import * as vscode from 'vscode';

/**
 * Service for managing bulk operations on notes
 * Tracks selection state and provides methods for bulk actions
 */
export class BulkOperationsService {
    private selectedNotes: Set<string> = new Set();
    private selectModeActive: boolean = false;
    private _onDidChangeSelection: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeSelection: vscode.Event<void> = this._onDidChangeSelection.event;

    /**
     * Check if select mode is active
     */
    isSelectModeActive(): boolean {
        return this.selectModeActive;
    }

    /**
     * Toggle select mode on/off
     */
    toggleSelectMode(): void {
        this.selectModeActive = !this.selectModeActive;

        // Clear selection when exiting select mode
        if (!this.selectModeActive) {
            this.clearSelection();
        }

        // Update context for conditional UI
        vscode.commands.executeCommand('setContext', 'noted.selectModeActive', this.selectModeActive);

        this._onDidChangeSelection.fire();
    }

    /**
     * Enter select mode
     */
    enterSelectMode(): void {
        if (!this.selectModeActive) {
            this.selectModeActive = true;
            vscode.commands.executeCommand('setContext', 'noted.selectModeActive', true);
            this._onDidChangeSelection.fire();
        }
    }

    /**
     * Exit select mode
     */
    exitSelectMode(): void {
        if (this.selectModeActive) {
            this.selectModeActive = false;
            this.clearSelection();
            vscode.commands.executeCommand('setContext', 'noted.selectModeActive', false);
            this._onDidChangeSelection.fire();
        }
    }

    /**
     * Check if a note is selected
     */
    isSelected(notePath: string): boolean {
        return this.selectedNotes.has(notePath);
    }

    /**
     * Toggle selection for a note
     */
    toggleSelection(notePath: string): void {
        if (this.selectedNotes.has(notePath)) {
            this.selectedNotes.delete(notePath);
        } else {
            this.selectedNotes.add(notePath);
        }

        // Update context for conditional UI
        vscode.commands.executeCommand('setContext', 'noted.hasSelectedNotes', this.selectedNotes.size > 0);

        this._onDidChangeSelection.fire();
    }

    /**
     * Select a note
     */
    select(notePath: string): void {
        if (!this.selectedNotes.has(notePath)) {
            this.selectedNotes.add(notePath);
            vscode.commands.executeCommand('setContext', 'noted.hasSelectedNotes', this.selectedNotes.size > 0);
            this._onDidChangeSelection.fire();
        }
    }

    /**
     * Deselect a note
     */
    deselect(notePath: string): void {
        if (this.selectedNotes.has(notePath)) {
            this.selectedNotes.delete(notePath);
            vscode.commands.executeCommand('setContext', 'noted.hasSelectedNotes', this.selectedNotes.size > 0);
            this._onDidChangeSelection.fire();
        }
    }

    /**
     * Select multiple notes
     */
    selectMultiple(notePaths: string[]): void {
        let changed = false;
        for (const path of notePaths) {
            if (!this.selectedNotes.has(path)) {
                this.selectedNotes.add(path);
                changed = true;
            }
        }

        if (changed) {
            vscode.commands.executeCommand('setContext', 'noted.hasSelectedNotes', this.selectedNotes.size > 0);
            this._onDidChangeSelection.fire();
        }
    }

    /**
     * Clear all selections
     */
    clearSelection(): void {
        if (this.selectedNotes.size > 0) {
            this.selectedNotes.clear();
            vscode.commands.executeCommand('setContext', 'noted.hasSelectedNotes', false);
            this._onDidChangeSelection.fire();
        }
    }

    /**
     * Get all selected note paths
     */
    getSelectedNotes(): string[] {
        return Array.from(this.selectedNotes);
    }

    /**
     * Get the count of selected notes
     */
    getSelectionCount(): number {
        return this.selectedNotes.size;
    }

    /**
     * Get a description of the current selection
     */
    getSelectionDescription(): string {
        const count = this.selectedNotes.size;
        if (count === 0) {
            return 'No notes selected';
        } else if (count === 1) {
            return '1 note selected';
        } else {
            return `${count} notes selected`;
        }
    }
}
