import * as vscode from 'vscode';

/**
 * Service for watching files and notifying listeners of changes
 * Used for live transclusion - updating embedded content when source files change
 */
export class FileWatcherService {
    private watchers: Map<string, vscode.FileSystemWatcher> = new Map();
    private listeners: Map<string, Set<(uri: vscode.Uri) => void>> = new Map();
    private _onDidChangeFile: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter<vscode.Uri>();

    /** Event fired when a watched file changes */
    public readonly onDidChangeFile: vscode.Event<vscode.Uri> = this._onDidChangeFile.event;

    /**
     * Watch a specific file for changes
     * @param filePath The absolute path to the file to watch
     * @param callback Optional callback to invoke when the file changes
     */
    watchFile(filePath: string, callback?: (uri: vscode.Uri) => void): void {
        // If we're already watching this file, just add the callback
        if (this.watchers.has(filePath)) {
            if (callback) {
                this.addListener(filePath, callback);
            }
            return;
        }

        // Create a file system watcher for this specific file
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(filePath, ''), // Watch the specific file
            false, // Don't ignore create events
            false, // Don't ignore change events
            false  // Don't ignore delete events
        );

        // Listen for changes to the file
        watcher.onDidChange(uri => {
            this._onDidChangeFile.fire(uri);
            this.notifyListeners(filePath, uri);
        });

        // Listen for file creation (in case file was deleted and recreated)
        watcher.onDidCreate(uri => {
            this._onDidChangeFile.fire(uri);
            this.notifyListeners(filePath, uri);
        });

        // Listen for file deletion
        watcher.onDidDelete(uri => {
            this._onDidChangeFile.fire(uri);
            this.notifyListeners(filePath, uri);
        });

        this.watchers.set(filePath, watcher);

        if (callback) {
            this.addListener(filePath, callback);
        }
    }

    /**
     * Stop watching a specific file
     * @param filePath The absolute path to the file to stop watching
     */
    unwatchFile(filePath: string): void {
        const watcher = this.watchers.get(filePath);
        if (watcher) {
            watcher.dispose();
            this.watchers.delete(filePath);
            this.listeners.delete(filePath);
        }
    }

    /**
     * Watch multiple files
     * @param filePaths Array of absolute file paths to watch
     * @param callback Optional callback to invoke when any file changes
     */
    watchFiles(filePaths: string[], callback?: (uri: vscode.Uri) => void): void {
        for (const filePath of filePaths) {
            this.watchFile(filePath, callback);
        }
    }

    /**
     * Stop watching multiple files
     * @param filePaths Array of absolute file paths to stop watching
     */
    unwatchFiles(filePaths: string[]): void {
        for (const filePath of filePaths) {
            this.unwatchFile(filePath);
        }
    }

    /**
     * Stop watching all files
     */
    unwatchAll(): void {
        for (const [filePath, watcher] of this.watchers) {
            watcher.dispose();
        }
        this.watchers.clear();
        this.listeners.clear();
    }

    /**
     * Get all currently watched file paths
     */
    getWatchedFiles(): string[] {
        return Array.from(this.watchers.keys());
    }

    /**
     * Check if a file is being watched
     */
    isWatching(filePath: string): boolean {
        return this.watchers.has(filePath);
    }

    /**
     * Add a listener for a specific file
     */
    private addListener(filePath: string, callback: (uri: vscode.Uri) => void): void {
        if (!this.listeners.has(filePath)) {
            this.listeners.set(filePath, new Set());
        }
        this.listeners.get(filePath)!.add(callback);
    }

    /**
     * Notify all listeners for a specific file
     */
    private notifyListeners(filePath: string, uri: vscode.Uri): void {
        const fileListeners = this.listeners.get(filePath);
        if (fileListeners) {
            for (const listener of fileListeners) {
                try {
                    listener(uri);
                } catch (error) {
                    // Error in listener
                }
            }
        }
    }

    /**
     * Dispose of all watchers and listeners
     */
    dispose(): void {
        this.unwatchAll();
        this._onDidChangeFile.dispose();
    }
}
