import * as path from 'path';
import * as vscode from 'vscode';
import { TemplateBundle, BundleNote, TemplateVariable } from './TemplateTypes';
import { getNotesPath, getTemplatesPath, getFileFormat } from '../services/configService';
import { pathExists, readFile, writeFile, createDirectory } from '../services/fileSystemService';
import { generateTemplate } from '../services/templateService';

/**
 * Service for managing multi-note workflow bundles
 */
export class BundleService {
    private bundlesPath: string;

    constructor() {
        const templatesPath = getTemplatesPath();
        this.bundlesPath = path.join(templatesPath, 'bundles');
    }

    /**
     * Load a bundle from JSON file
     */
    async loadBundle(bundleId: string): Promise<TemplateBundle> {
        const bundlePath = path.join(this.bundlesPath, `${bundleId}.bundle.json`);

        if (!await pathExists(bundlePath)) {
            throw new Error(`Bundle not found: ${bundleId}`);
        }

        const content = await readFile(bundlePath);
        const bundle: TemplateBundle = JSON.parse(content);

        return bundle;
    }

    /**
     * Get all available bundles
     */
    async getAllBundles(): Promise<TemplateBundle[]> {
        if (!await pathExists(this.bundlesPath)) {
            return [];
        }

        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(this.bundlesPath));
        const bundles: TemplateBundle[] = [];

        for (const [filename, fileType] of files) {
            if (fileType === vscode.FileType.File && filename.endsWith('.bundle.json')) {
                const bundleId = filename.replace('.bundle.json', '');
                try {
                    const bundle = await this.loadBundle(bundleId);
                    bundles.push(bundle);
                } catch (error) {
                    console.error(`Failed to load bundle ${bundleId}:`, error);
                }
            }
        }

        return bundles;
    }

    /**
     * Save a bundle to JSON file
     */
    async saveBundle(bundle: TemplateBundle): Promise<void> {
        // Ensure bundles directory exists
        if (!await pathExists(this.bundlesPath)) {
            await createDirectory(this.bundlesPath);
        }

        const bundlePath = path.join(this.bundlesPath, `${bundle.id}.bundle.json`);
        const content = JSON.stringify(bundle, null, 2);

        await writeFile(bundlePath, content);
    }

    /**
     * Collect variable values from user via multi-step input
     */
    async collectVariables(variables: TemplateVariable[]): Promise<Record<string, any>> {
        const values: Record<string, any> = {};

        for (const variable of variables) {
            const value = await this.collectSingleVariable(variable);

            if (value === undefined && variable.required) {
                throw new Error(`Required variable not provided: ${variable.name}`);
            }

            values[variable.name] = value ?? variable.default;
        }

        return values;
    }

    /**
     * Collect a single variable value from user
     */
    private async collectSingleVariable(variable: TemplateVariable): Promise<any> {
        const prompt = variable.prompt || `Enter ${variable.name}`;
        const placeHolder = variable.description || variable.prompt;

        switch (variable.type) {
            case 'string':
                return await vscode.window.showInputBox({
                    prompt,
                    placeHolder,
                    value: variable.default as string,
                    validateInput: (value) => {
                        if (variable.required && !value) {
                            return `${variable.name} is required`;
                        }
                        return null;
                    }
                });

            case 'number':
                const numInput = await vscode.window.showInputBox({
                    prompt,
                    placeHolder,
                    value: variable.default?.toString(),
                    validateInput: (value) => {
                        if (variable.required && !value) {
                            return `${variable.name} is required`;
                        }
                        if (value && isNaN(Number(value))) {
                            return 'Please enter a valid number';
                        }
                        return null;
                    }
                });
                return numInput ? Number(numInput) : undefined;

            case 'boolean':
                const boolChoice = await vscode.window.showQuickPick(
                    ['Yes', 'No'],
                    { placeHolder: prompt }
                );
                return boolChoice === 'Yes';

            case 'enum':
                if (!variable.values || variable.values.length === 0) {
                    throw new Error(`Enum variable ${variable.name} has no values defined`);
                }
                return await vscode.window.showQuickPick(variable.values, {
                    placeHolder: prompt
                });

            case 'date':
                const dateInput = await vscode.window.showInputBox({
                    prompt: `${prompt} (YYYY-MM-DD)`,
                    placeHolder: 'YYYY-MM-DD',
                    value: variable.default as string,
                    validateInput: (value) => {
                        if (variable.required && !value) {
                            return `${variable.name} is required`;
                        }
                        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                            return 'Please enter a valid date (YYYY-MM-DD)';
                        }
                        return null;
                    }
                });
                return dateInput;

            default:
                throw new Error(`Unsupported variable type: ${variable.type}`);
        }
    }

    /**
     * Replace variables in a string with their values
     */
    replaceVariables(text: string, variables: Record<string, any>): string {
        let result = text;

        for (const [name, value] of Object.entries(variables)) {
            const placeholder = `{${name}}`;
            result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
        }

        return result;
    }

    /**
     * Add wiki-links to other notes in the bundle
     */
    private addBundleLinks(content: string, links: string[] | undefined, variables: Record<string, any>): string {
        if (!links || links.length === 0) {
            return content;
        }

        const linkSection = '\n\n## Related Notes\n\n' +
            links.map(link => {
                const resolvedLink = this.replaceVariables(link, variables);
                return `- [[${resolvedLink}]]`;
            }).join('\n');

        return content + linkSection;
    }

    /**
     * Create all notes from a bundle
     */
    async createFromBundle(bundleId: string): Promise<string[]> {
        const bundle = await this.loadBundle(bundleId);

        // Show bundle info
        const confirm = await vscode.window.showInformationMessage(
            `Create "${bundle.name}"?\n\n${bundle.description}\n\nThis will create ${bundle.notes.length} note(s).`,
            'Create', 'Cancel'
        );

        if (confirm !== 'Create') {
            return [];
        }

        // Collect variable values
        const variables = await this.collectVariables(bundle.variables);

        const createdPaths: string[] = [];
        const noteNames: Map<string, string> = new Map(); // Original name -> resolved name

        // First pass: resolve all note names
        for (const note of bundle.notes) {
            const resolvedName = this.replaceVariables(note.name, variables);
            noteNames.set(note.name, resolvedName);
        }

        // Second pass: create notes
        for (const note of bundle.notes) {
            try {
                const noteName = noteNames.get(note.name)!;
                const folder = this.replaceVariables(note.folder, variables);

                // Generate content from template
                const templateContent = await generateTemplate(note.template, new Date(), noteName);
                const processedContent = this.replaceVariables(templateContent, variables);

                // Resolve links to other notes in bundle
                const resolvedLinks = note.links?.map(link => noteNames.get(link) || link);
                const finalContent = this.addBundleLinks(processedContent, resolvedLinks, variables);

                // Create the note file
                const filePath = await this.createNote(folder, noteName, finalContent);
                createdPaths.push(filePath);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to create note "${note.name}": ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        // Post-creation actions
        if (bundle.post_create) {
            await this.executePostCreateActions(bundle.post_create, variables, createdPaths, noteNames);
        }

        // Show success message
        const defaultMessage = `Created ${createdPaths.length} note(s) from bundle "${bundle.name}"`;
        vscode.window.showInformationMessage(bundle.post_create?.message || defaultMessage);

        return createdPaths;
    }

    /**
     * Create a single note file
     */
    private async createNote(folder: string, noteName: string, content: string): Promise<string> {
        const notesPath = getNotesPath();
        const fileFormat = getFileFormat();

        // Build full folder path
        const fullFolderPath = path.join(notesPath, folder);

        // Ensure folder exists
        if (!await pathExists(fullFolderPath)) {
            await createDirectory(fullFolderPath);
        }

        // Create note file
        const fileName = `${noteName}.${fileFormat}`;
        const filePath = path.join(fullFolderPath, fileName);

        // Check if file already exists
        if (await pathExists(filePath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `Note "${noteName}" already exists. Overwrite?`,
                'Overwrite', 'Skip'
            );

            if (overwrite !== 'Overwrite') {
                return filePath;
            }
        }

        await writeFile(filePath, content);
        return filePath;
    }

    /**
     * Execute post-creation actions
     */
    private async executePostCreateActions(
        postCreate: { open_notes?: string[]; message?: string },
        variables: Record<string, any>,
        createdPaths: string[],
        noteNames: Map<string, string>
    ): Promise<void> {
        if (postCreate.open_notes && postCreate.open_notes.length > 0) {
            const fileFormat = getFileFormat();

            for (const noteName of postCreate.open_notes) {
                const resolvedName = this.replaceVariables(noteName, variables);

                // Find the created file path
                const matchingPath = createdPaths.find(p =>
                    p.endsWith(`${resolvedName}.${fileFormat}`)
                );

                if (matchingPath) {
                    const doc = await vscode.workspace.openTextDocument(matchingPath);
                    await vscode.window.showTextDocument(doc);
                }
            }
        }
    }

    /**
     * Create a bundle from selected templates
     */
    async createBundleFromTemplates(templateIds: string[]): Promise<TemplateBundle | null> {
        // Get bundle metadata
        const bundleName = await vscode.window.showInputBox({
            prompt: 'Bundle name',
            placeHolder: 'my-workflow',
            validateInput: (value) => {
                if (!value) {
                    return 'Bundle name is required';
                }
                if (!/^[a-z0-9-_]+$/.test(value)) {
                    return 'Bundle name can only contain lowercase letters, numbers, hyphens, and underscores';
                }
                return null;
            }
        });

        if (!bundleName) {
            return null;
        }

        const bundleDescription = await vscode.window.showInputBox({
            prompt: 'Bundle description',
            placeHolder: 'Brief description of this workflow'
        });

        if (!bundleDescription) {
            return null;
        }

        // Create bundle structure
        const bundle: TemplateBundle = {
            id: bundleName.toLowerCase().replace(/\s+/g, '-'),
            name: bundleName,
            description: bundleDescription,
            version: '1.0.0',
            variables: [],
            notes: templateIds.map(templateId => ({
                name: templateId,
                template: templateId,
                folder: 'Notes',
                links: []
            })),
            post_create: {
                open_notes: [templateIds[0]], // Open first note by default
                message: `Created notes from "${bundleName}" bundle`
            }
        };

        // Save bundle
        await this.saveBundle(bundle);

        vscode.window.showInformationMessage(
            `Bundle "${bundleName}" created successfully! Edit the bundle file to customize variables and relationships.`
        );

        return bundle;
    }
}

// Export singleton instance
export const bundleService = new BundleService();
