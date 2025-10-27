import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

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
    constructor() {
        // No initialization needed - we'll check for workspace on-demand
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
     */
    getDiagramsFolder(): string {
        const workspaceRoot = this.ensureWorkspace();
        const config = vscode.workspace.getConfiguration('noted');
        const diagramsFolderName = config.get<string>('diagramsFolder', 'Diagrams');
        return path.join(workspaceRoot, diagramsFolderName);
    }

    /**
     * Ensure diagrams folder exists
     */
    async ensureDiagramsFolder(): Promise<void> {
        const diagramsFolder = this.getDiagramsFolder();
        try {
            await fs.access(diagramsFolder);
        } catch {
            // Folder doesn't exist, create it
            await fs.mkdir(diagramsFolder, { recursive: true });
            console.log('[NOTED] Created diagrams folder:', diagramsFolder);
        }
    }

    /**
     * Get all diagram files from the diagrams folder
     */
    async getAllDiagrams(): Promise<DiagramFile[]> {
        const diagramsFolder = this.getDiagramsFolder();

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
            console.error('[NOTED] Error reading diagrams folder:', error);
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
            console.error('[NOTED] Error getting diagram info:', filePath, error);
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
     * Create a new Draw.io diagram
     */
    async createDrawioDiagram(name: string): Promise<string> {
        await this.ensureDiagramsFolder();

        // Sanitize name
        const sanitizedName = this.sanitizeDiagramName(name);
        const fileName = `${sanitizedName}.drawio`;
        const filePath = path.join(this.getDiagramsFolder(), fileName);

        // Check if file already exists
        try {
            await fs.access(filePath);
            throw new Error(`Diagram "${fileName}" already exists`);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // Create empty Draw.io XML structure
        const drawioContent = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="65bd71144e">
    <diagram id="${this.generateId()}" name="Page-1">
        <mxGraphModel dx="800" dy="450" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
            </root>
        </mxGraphModel>
    </diagram>
</mxfile>`;

        await fs.writeFile(filePath, drawioContent, 'utf-8');
        console.log('[NOTED] Created Draw.io diagram:', filePath);

        return filePath;
    }

    /**
     * Create a new Excalidraw diagram
     */
    async createExcalidrawDiagram(name: string): Promise<string> {
        await this.ensureDiagramsFolder();

        // Sanitize name
        const sanitizedName = this.sanitizeDiagramName(name);
        const fileName = `${sanitizedName}.excalidraw`;
        const filePath = path.join(this.getDiagramsFolder(), fileName);

        // Check if file already exists
        try {
            await fs.access(filePath);
            throw new Error(`Diagram "${fileName}" already exists`);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        // Create empty Excalidraw JSON structure
        const excalidrawContent = {
            type: "excalidraw",
            version: 2,
            source: "https://excalidraw.com",
            elements: [],
            appState: {
                gridSize: null,
                viewBackgroundColor: "#ffffff"
            },
            files: {}
        };

        await fs.writeFile(filePath, JSON.stringify(excalidrawContent, null, 2), 'utf-8');
        console.log('[NOTED] Created Excalidraw diagram:', filePath);

        return filePath;
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
        console.log('[NOTED] Copied to clipboard:', embedSyntax);
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
        return vscode.extensions.getExtension('hediet.vscode-drawio') !== undefined;
    }

    /**
     * Check if Excalidraw extension is installed
     */
    isExcalidrawExtensionInstalled(): boolean {
        return vscode.extensions.getExtension('pomdtr.excalidraw-editor') !== undefined;
    }

    /**
     * Show warning if required extension is not installed
     */
    showExtensionWarning(type: 'drawio' | 'excalidraw'): void {
        const extensionName = type === 'drawio' ? 'Draw.io Integration' : 'Excalidraw';
        const extensionId = type === 'drawio' ? 'hediet.vscode-drawio' : 'pomdtr.excalidraw-editor';

        vscode.window.showWarningMessage(
            `${extensionName} extension is not installed. Install it to create and edit ${type} diagrams.`,
            'Install Extension',
            'Dismiss'
        ).then(selection => {
            if (selection === 'Install Extension') {
                vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId);
            }
        });
    }
}
