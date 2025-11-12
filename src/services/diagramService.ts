import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getNotesPath } from './configService';

/**
 * Template for new Draw.io diagram files
 */
const NEW_DRAWIO_XML_TEMPLATE = (id: string) => `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="65bd71144e">
    <diagram id="${id}" name="Page-1">
        <mxGraphModel dx="800" dy="450" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
            </root>
        </mxGraphModel>
    </diagram>
</mxfile>`;

/**
 * Template for new Excalidraw diagram files
 */
const NEW_EXCALIDRAW_JSON_TEMPLATE = () => ({
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: [],
    appState: {
        gridSize: null,
        viewBackgroundColor: "#ffffff"
    },
    files: {}
});

/**
 * Represents a diagram file
 */
export interface DiagramFile {
    /** File name */
    name: string;
    /** Full file path */
    path: string;
    /** Diagram type: 'drawio' or 'excalidraw' */
    type: 'drawio' | 'excalidraw';
    /** File extension */
    extension: string;
    /** Whether this is an exported format (.svg, .png) */
    isExported: boolean;
    /** Number of notes that reference this diagram */
    usageCount?: number;
    /** Last modified timestamp */
    modified?: Date;
    /** File size in bytes */
    size?: number;
}

/**
 * Service for managing diagram files (Draw.io and Excalidraw)
 */
export class DiagramService {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * Get the workspace root, or null if no workspace is open
     */
    private getWorkspaceRoot(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Check if workspace is available
     */
    private ensureWorkspace(): string {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            throw new Error('No workspace folder is open. Please open a workspace to use diagram features.');
        }
        return workspaceRoot;
    }

    /**
     * Get the diagrams folder path
     * Creates diagrams folder as a sibling to the Notes folder
     * Returns null if neither notes path nor workspace is configured
     */
    getDiagramsFolder(): string | null {
        const notesPath = getNotesPath();

        if (!notesPath) {
            // Fallback to workspace root if notes path is not configured
            const workspaceRoot = this.getWorkspaceRoot();
            if (!workspaceRoot) {
                // No notes path and no workspace - can't determine diagrams folder
                return null;
            }
            const config = vscode.workspace.getConfiguration('noted');
            const diagramsFolderName = config.get<string>('diagramsFolder', 'Diagrams');
            return path.join(workspaceRoot, diagramsFolderName);
        }

        // Get parent directory of notes folder (e.g., /Users/jruecke/WorkNotes)
        const notesParentDir = path.dirname(notesPath);

        // Get diagrams folder name from config
        const config = vscode.workspace.getConfiguration('noted');
        const diagramsFolderName = config.get<string>('diagramsFolder', 'Diagrams');

        // Create diagrams folder as sibling to Notes folder
        return path.join(notesParentDir, diagramsFolderName);
    }

    /**
     * Ensure diagrams folder exists
     */
    async ensureDiagramsFolder(): Promise<void> {
        const diagramsFolder = this.getDiagramsFolder();
        if (!diagramsFolder) {
            throw new Error('Cannot determine diagrams folder location. Please configure a notes folder or open a workspace.');
        }
        try {
            await fs.access(diagramsFolder);
        } catch {
            // Folder doesn't exist, create it
            await fs.mkdir(diagramsFolder, { recursive: true });
        }
    }

    /**
     * Get all diagram files from the diagrams folder
     */
    async getAllDiagrams(): Promise<DiagramFile[]> {
        const diagramsFolder = this.getDiagramsFolder();

        if (!diagramsFolder) {
            // No workspace or notes folder configured - return empty array
            return [];
        }

        try {
            await fs.access(diagramsFolder);
        } catch {
            // Diagrams folder doesn't exist yet
            return [];
        }

        const diagrams: DiagramFile[] = [];

        try {
            const files = await fs.readdir(diagramsFolder, { withFileTypes: true });

            for (const file of files) {
                if (file.isDirectory()) {
                    // Skip directories for now (we can add subdirectory support later)
                    continue;
                }

                const filePath = path.join(diagramsFolder, file.name);
                const diagramFile = await this.getDiagramInfo(filePath);

                if (diagramFile) {
                    diagrams.push(diagramFile);
                }
            }
        } catch (error) {
            // Error reading diagrams folder
        }

        return diagrams;
    }

    /**
     * Get diagram file information
     */
    async getDiagramInfo(filePath: string): Promise<DiagramFile | null> {
        const fileName = path.basename(filePath);
        const lowerName = fileName.toLowerCase();

        // Check if this is a diagram file
        let type: 'drawio' | 'excalidraw' | null = null;
        let isExported = false;
        let extension = '';

        if (lowerName.endsWith('.drawio')) {
            type = 'drawio';
            extension = '.drawio';
        } else if (lowerName.endsWith('.excalidraw.svg')) {
            type = 'excalidraw';
            extension = '.excalidraw.svg';
            isExported = true;
        } else if (lowerName.endsWith('.excalidraw.png')) {
            type = 'excalidraw';
            extension = '.excalidraw.png';
            isExported = true;
        } else if (lowerName.endsWith('.excalidraw')) {
            type = 'excalidraw';
            extension = '.excalidraw';
        } else {
            // Not a diagram file
            return null;
        }

        try {
            const stats = await fs.stat(filePath);

            return {
                name: fileName,
                path: filePath,
                type,
                extension,
                isExported,
                modified: stats.mtime,
                size: stats.size
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Get diagrams grouped by type
     */
    async getDiagramsGroupedByType(): Promise<{ drawio: DiagramFile[]; excalidraw: DiagramFile[] }> {
        const allDiagrams = await this.getAllDiagrams();

        const drawio = allDiagrams.filter(d => d.type === 'drawio');
        const excalidraw = allDiagrams.filter(d => d.type === 'excalidraw');

        // Sort by name
        drawio.sort((a, b) => a.name.localeCompare(b.name));
        excalidraw.sort((a, b) => a.name.localeCompare(b.name));

        return { drawio, excalidraw };
    }

    /**
     * Generic helper to create a diagram file
     * @private
     */
    private async createDiagram(
        name: string,
        type: 'drawio' | 'excalidraw'
    ): Promise<string> {
        await this.ensureDiagramsFolder();

        const diagramsFolder = this.getDiagramsFolder();
        if (!diagramsFolder) {
            throw new Error('Cannot determine diagrams folder location. Please configure a notes folder or open a workspace.');
        }

        // Sanitize name and build file path
        const sanitizedName = this.sanitizeDiagramName(name);
        const extension = type === 'drawio' ? '.drawio' : '.excalidraw';
        const fileName = `${sanitizedName}${extension}`;
        const filePath = path.join(diagramsFolder, fileName);

        // Check if file already exists
        try {
            await fs.access(filePath);
            throw new Error(`Diagram "${fileName}" already exists`);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // Generate content based on type
        let content: string;
        if (type === 'drawio') {
            content = NEW_DRAWIO_XML_TEMPLATE(this.generateId());
        } else {
            content = JSON.stringify(NEW_EXCALIDRAW_JSON_TEMPLATE(), null, 2);
        }

        // Write file
        await fs.writeFile(filePath, content, 'utf-8');

        return filePath;
    }

    /**
     * Create a new Draw.io diagram
     */
    async createDrawioDiagram(name: string): Promise<string> {
        return this.createDiagram(name, 'drawio');
    }

    /**
     * Create a new Excalidraw diagram
     */
    async createExcalidrawDiagram(name: string): Promise<string> {
        return this.createDiagram(name, 'excalidraw');
    }

    /**
     * Sanitize diagram name (remove invalid characters)
     */
    private sanitizeDiagramName(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-_]/g, '')
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
    }

    /**
     * Generate a unique ID for diagram elements
     */
    private generateId(): string {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Get embed syntax for a diagram
     */
    getEmbedSyntax(diagramFile: DiagramFile): string {
        const workspaceRoot = this.ensureWorkspace();
        // Use workspace-relative path
        const relativePath = path.relative(workspaceRoot, diagramFile.path);

        return `![[${relativePath}]]`;
    }

    /**
     * Get simple embed syntax (just filename if in Diagrams folder)
     */
    getSimpleEmbedSyntax(diagramFile: DiagramFile): string {
        return `![[${diagramFile.name}]]`;
    }

    /**
     * Copy embed syntax to clipboard
     */
    async copyEmbedSyntaxToClipboard(diagramFile: DiagramFile): Promise<void> {
        const embedSyntax = this.getSimpleEmbedSyntax(diagramFile);
        await vscode.env.clipboard.writeText(embedSyntax);
    }

    /**
     * Open diagram in its respective editor
     */
    async openDiagram(diagramFile: DiagramFile): Promise<void> {
        const uri = vscode.Uri.file(diagramFile.path);
        await vscode.commands.executeCommand('vscode.open', uri);
    }

    /**
     * Get diagram usage count (how many notes reference it)
     */
    async getDiagramUsageCount(diagramFile: DiagramFile): Promise<number> {
        // This would require searching all notes for embeds
        // For now, return 0 (we can implement this later with a cache)
        return 0;
    }

    /**
     * Check if required editor extension is installed
     */
    isDrawioExtensionInstalled(): boolean {
        const extension = vscode.extensions.getExtension('hediet.vscode-drawio');
        // Check if extension exists in the extensions list
        if (extension !== undefined) {
            return true;
        }
        // Fallback: Check all extensions (sometimes getExtension fails to find it)
        return vscode.extensions.all.some(ext => ext.id === 'hediet.vscode-drawio');
    }

    /**
     * Check if Excalidraw extension is installed
     */
    isExcalidrawExtensionInstalled(): boolean {
        const extensionId = 'pomdtr.excalidraw-editor';
        const extension = vscode.extensions.getExtension(extensionId);

        // Check if extension exists in the extensions list
        if (extension !== undefined) {
            return true;
        }

        // Fallback: Check all extensions (sometimes getExtension fails to find it)
        return vscode.extensions.all.some(ext => ext.id === extensionId);
    }

    /**
     * Check if user has chosen to suppress extension warnings
     */
    private shouldSuppressWarning(type: 'drawio' | 'excalidraw'): boolean {
        const key = `noted.suppressExtensionWarning.${type}`;
        return this.context.globalState.get<boolean>(key, false);
    }

    /**
     * Set whether to suppress extension warnings
     */
    private setSuppressWarning(type: 'drawio' | 'excalidraw', suppress: boolean): void {
        const key = `noted.suppressExtensionWarning.${type}`;
        this.context.globalState.update(key, suppress);
    }

    /**
     * Show warning if required extension is not installed
     */
    async showExtensionWarning(type: 'drawio' | 'excalidraw'): Promise<'install' | 'proceed' | 'dismiss'> {
        // Check if user has previously chosen to suppress this warning
        if (this.shouldSuppressWarning(type)) {
            return 'proceed'; // Automatically proceed without showing warning
        }

        const extensionName = type === 'drawio' ? 'Draw.io Integration' : 'Excalidraw';
        const extensionId = type === 'drawio' ? 'hediet.vscode-drawio' : 'pomdtr.excalidraw-editor';

        const selection = await vscode.window.showWarningMessage(
            `${extensionName} extension is not available. Install or enable it to edit ${type} diagrams.`,
            { modal: true },
            'Install Extension',
            'Create Anyway',
            "Don't Ask Again",
            'Dismiss'
        );

        if (selection === 'Install Extension') {
            await vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId);
            return 'install';
        } else if (selection === 'Create Anyway') {
            return 'proceed';
        } else if (selection === "Don't Ask Again") {
            this.setSuppressWarning(type, true);
            return 'proceed';
        }
        return 'dismiss';
    }
}
