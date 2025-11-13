import * as vscode from 'vscode';
import * as path from 'path';
import { getTemplatesPath, getFileFormat } from '../services/configService';
import { pathExists, readFile, readDirectory, writeFile } from '../services/fileSystemService';
import { Template } from './TemplateTypes';
import { BUILT_IN_TEMPLATES } from '../constants';

/**
 * Template display info for the browser
 */
interface TemplateDisplayInfo {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    version: string;
    author?: string;
    usage_count?: number;
    created?: string;
    modified?: string;
    isBuiltIn: boolean;
    fileType: 'json' | 'txt' | 'md' | 'builtin';
}

/**
 * Show the template browser webview
 */
export async function showTemplateBrowser(context: vscode.ExtensionContext): Promise<void> {
    const templatesPath = getTemplatesPath();

    const panel = vscode.window.createWebviewPanel(
        'notedTemplateBrowser',
        'Template Browser',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Load all templates
    const templates = await loadAllTemplates();

    // Set the initial HTML
    panel.webview.html = getTemplateBrowserHtml(templates);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'createFromTemplate':
                    await handleCreateFromTemplate(message.templateId);
                    break;

                case 'editTemplate':
                    await handleEditTemplate(message.templateId);
                    break;

                case 'deleteTemplate':
                    await handleDeleteTemplate(message.templateId);
                    // Reload templates after deletion
                    const updatedTemplates = await loadAllTemplates();
                    panel.webview.postMessage({
                        command: 'updateTemplates',
                        templates: updatedTemplates
                    });
                    break;

                case 'duplicateTemplate':
                    await handleDuplicateTemplate(message.templateId);
                    // Reload templates after duplication
                    const refreshedTemplates = await loadAllTemplates();
                    panel.webview.postMessage({
                        command: 'updateTemplates',
                        templates: refreshedTemplates
                    });
                    break;

                case 'exportTemplate':
                    await handleExportTemplate(message.templateId);
                    break;

                case 'refresh':
                    const allTemplates = await loadAllTemplates();
                    panel.webview.postMessage({
                        command: 'updateTemplates',
                        templates: allTemplates
                    });
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Load all templates (built-in, JSON, and legacy)
 */
async function loadAllTemplates(): Promise<TemplateDisplayInfo[]> {
    const templates: TemplateDisplayInfo[] = [];

    // Add built-in templates
    const builtInNames = Object.keys(BUILT_IN_TEMPLATES);
    for (const name of builtInNames) {
        templates.push({
            id: name,
            name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
            description: `Built-in ${name} template`,
            category: 'Built-in',
            tags: ['built-in'],
            version: '1.0.0',
            isBuiltIn: true,
            fileType: 'builtin'
        });
    }

    // Load custom templates
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        return templates;
    }

    try {
        if (await pathExists(templatesPath)) {
            const files = await readDirectory(templatesPath);

            for (const file of files) {
                const ext = path.extname(file);
                const baseName = path.basename(file, ext);

                // Skip bundle files
                if (file.endsWith('.bundle.json')) {
                    continue;
                }

                if (ext === '.json') {
                    // Load JSON template
                    try {
                        const content = await readFile(path.join(templatesPath, file));
                        const template: Template = JSON.parse(content);

                        templates.push({
                            id: template.id || baseName,
                            name: template.name,
                            description: template.description,
                            category: template.category,
                            tags: template.tags,
                            version: template.version,
                            author: template.author,
                            usage_count: template.usage_count,
                            created: template.created,
                            modified: template.modified,
                            isBuiltIn: false,
                            fileType: 'json'
                        });
                    } catch (error) {
                        console.error(`Failed to parse JSON template ${file}:`, error);
                    }
                } else if (ext === '.txt' || ext === '.md') {
                    // Load legacy template
                    // Check if a JSON version exists (skip if it does)
                    const jsonPath = path.join(templatesPath, `${baseName}.json`);
                    if (await pathExists(jsonPath)) {
                        continue; // JSON version takes precedence
                    }

                    templates.push({
                        id: baseName,
                        name: baseName.charAt(0).toUpperCase() + baseName.slice(1).replace(/-/g, ' '),
                        description: `Legacy ${ext} template`,
                        category: 'Custom',
                        tags: ['custom', 'legacy'],
                        version: '1.0.0',
                        isBuiltIn: false,
                        fileType: ext === '.txt' ? 'txt' : 'md'
                    });
                }
            }
        }
    } catch (error) {
        console.error('Failed to load custom templates:', error);
    }

    return templates;
}

/**
 * Handle creating a note from a template
 */
async function handleCreateFromTemplate(templateId: string): Promise<void> {
    // Execute the openWithTemplate command with the template ID
    await vscode.commands.executeCommand('noted.openWithTemplate');
}

/**
 * Handle editing a template
 */
async function handleEditTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    // Try JSON first, then fall back to legacy format
    const jsonPath = path.join(templatesPath, `${templateId}.json`);
    if (await pathExists(jsonPath)) {
        const document = await vscode.workspace.openTextDocument(jsonPath);
        await vscode.window.showTextDocument(document);
        return;
    }

    // Try legacy formats
    const fileFormat = getFileFormat();
    const legacyPath = path.join(templatesPath, `${templateId}.${fileFormat}`);
    if (await pathExists(legacyPath)) {
        const document = await vscode.workspace.openTextDocument(legacyPath);
        await vscode.window.showTextDocument(document);
        return;
    }

    vscode.window.showErrorMessage(`Template not found: ${templateId}`);
}

/**
 * Handle deleting a template
 */
async function handleDeleteTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    const answer = await vscode.window.showWarningMessage(
        `Delete template "${templateId}"?`,
        { modal: true },
        'Delete'
    );

    if (answer !== 'Delete') {
        return;
    }

    // Try to delete JSON first, then legacy format
    const jsonPath = path.join(templatesPath, `${templateId}.json`);
    if (await pathExists(jsonPath)) {
        await vscode.workspace.fs.delete(vscode.Uri.file(jsonPath));
        vscode.window.showInformationMessage(`Template "${templateId}" deleted`);
        return;
    }

    // Try legacy formats
    const fileFormat = getFileFormat();
    const legacyPath = path.join(templatesPath, `${templateId}.${fileFormat}`);
    if (await pathExists(legacyPath)) {
        await vscode.workspace.fs.delete(vscode.Uri.file(legacyPath));
        vscode.window.showInformationMessage(`Template "${templateId}" deleted`);
        return;
    }

    vscode.window.showErrorMessage(`Template not found: ${templateId}`);
}

/**
 * Handle duplicating a template
 */
async function handleDuplicateTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    const newName = await vscode.window.showInputBox({
        prompt: 'Enter name for the duplicated template',
        value: `${templateId}-copy`,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Template name cannot be empty';
            }
            return null;
        }
    });

    if (!newName) {
        return;
    }

    // Try JSON first
    const jsonPath = path.join(templatesPath, `${templateId}.json`);
    if (await pathExists(jsonPath)) {
        const content = await readFile(jsonPath);
        const template: Template = JSON.parse(content);

        // Update template metadata
        template.id = newName;
        template.name = newName.charAt(0).toUpperCase() + newName.slice(1).replace(/-/g, ' ');
        template.created = new Date().toISOString();
        template.modified = new Date().toISOString();

        const newPath = path.join(templatesPath, `${newName}.json`);
        await writeFile(newPath, JSON.stringify(template, null, 2));
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
        return;
    }

    // Try legacy format
    const fileFormat = getFileFormat();
    const legacyPath = path.join(templatesPath, `${templateId}.${fileFormat}`);
    if (await pathExists(legacyPath)) {
        const content = await readFile(legacyPath);
        const newPath = path.join(templatesPath, `${newName}.${fileFormat}`);
        await writeFile(newPath, content);
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
        return;
    }

    vscode.window.showErrorMessage(`Template not found: ${templateId}`);
}

/**
 * Handle exporting a template
 */
async function handleExportTemplate(templateId: string): Promise<void> {
    const templatesPath = getTemplatesPath();
    if (!templatesPath) {
        vscode.window.showErrorMessage('Templates folder not configured');
        return;
    }

    // Try JSON first
    const jsonPath = path.join(templatesPath, `${templateId}.json`);
    if (await pathExists(jsonPath)) {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${templateId}.json`),
            filters: {
                'JSON': ['json']
            }
        });

        if (uri) {
            const content = await readFile(jsonPath);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Template exported to ${uri.fsPath}`);
        }
        return;
    }

    // Try legacy format
    const fileFormat = getFileFormat();
    const legacyPath = path.join(templatesPath, `${templateId}.${fileFormat}`);
    if (await pathExists(legacyPath)) {
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${templateId}.${fileFormat}`),
            filters: {
                'Text': ['txt', 'md']
            }
        });

        if (uri) {
            const content = await readFile(legacyPath);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Template exported to ${uri.fsPath}`);
        }
        return;
    }

    vscode.window.showErrorMessage(`Template not found: ${templateId}`);
}

/**
 * Generate the HTML content for the template browser webview
 */
function getTemplateBrowserHtml(templates: TemplateDisplayInfo[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Template Browser</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .header h1 {
            font-size: 24px;
            font-weight: 600;
        }

        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .search-box {
            flex: 1;
            min-width: 300px;
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-size: 14px;
        }

        .view-toggle {
            display: flex;
            gap: 5px;
        }

        .btn {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }

        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        .filter-btn {
            padding: 6px 12px;
            background: transparent;
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }

        .filter-btn.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-background);
        }

        .templates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .templates-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .template-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .template-card:hover {
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .template-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .template-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .template-category {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            display: inline-block;
            padding: 2px 8px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
        }

        .template-description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
            line-height: 1.5;
        }

        .template-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
        }

        .tag {
            font-size: 11px;
            padding: 3px 8px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border-radius: 3px;
        }

        .template-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
        }

        .template-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .action-btn {
            flex: 1;
            min-width: fit-content;
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
        }

        .action-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .action-btn.primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .action-btn.primary:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .action-btn.danger {
            background: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .empty-state-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 6px;
        }

        .stat-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 600;
        }

        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Template Browser</h1>
        <button class="btn" onclick="refresh()">🔄 Refresh</button>
    </div>

    <div class="controls">
        <input
            type="text"
            class="search-box"
            placeholder="Search templates by name, description, or tags..."
            oninput="filterTemplates()"
            id="searchInput"
        />
        <div class="view-toggle">
            <button class="btn btn-secondary" onclick="setView('grid')" id="gridBtn">Grid</button>
            <button class="btn btn-secondary" onclick="setView('list')" id="listBtn">List</button>
        </div>
    </div>

    <div class="filters" id="filters"></div>

    <div class="stats" id="stats"></div>

    <div class="templates-grid" id="templatesContainer"></div>

    <script>
        const vscode = acquireVsCodeApi();
        let templates = ${JSON.stringify(templates)};
        let currentView = 'grid';
        let activeCategory = 'all';
        let searchQuery = '';

        // Initialize
        renderFilters();
        renderStats();
        renderTemplates();

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateTemplates':
                    templates = message.templates;
                    renderFilters();
                    renderStats();
                    renderTemplates();
                    break;
            }
        });

        function renderFilters() {
            const categories = ['all', ...new Set(templates.map(t => t.category))];
            const filtersContainer = document.getElementById('filters');
            filtersContainer.innerHTML = categories.map(cat =>
                \`<button
                    class="filter-btn \${cat === activeCategory ? 'active' : ''}"
                    onclick="setCategory('\${cat}')"
                >
                    \${cat.charAt(0).toUpperCase() + cat.slice(1)} (\${cat === 'all' ? templates.length : templates.filter(t => t.category === cat).length})
                </button>\`
            ).join('');
        }

        function renderStats() {
            const stats = {
                total: templates.length,
                custom: templates.filter(t => !t.isBuiltIn).length,
                builtin: templates.filter(t => t.isBuiltIn).length
            };

            const statsContainer = document.getElementById('stats');
            statsContainer.innerHTML = \`
                <div class="stat-item">
                    <div class="stat-value">\${stats.total}</div>
                    <div class="stat-label">Total Templates</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">\${stats.custom}</div>
                    <div class="stat-label">Custom</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">\${stats.builtin}</div>
                    <div class="stat-label">Built-in</div>
                </div>
            \`;
        }

        function renderTemplates() {
            const filteredTemplates = templates.filter(t => {
                const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
                const matchesSearch = !searchQuery ||
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesCategory && matchesSearch;
            });

            const container = document.getElementById('templatesContainer');
            container.className = currentView === 'grid' ? 'templates-grid' : 'templates-list';

            if (filteredTemplates.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">No templates found</div>
                        <div>Try adjusting your search or filters</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filteredTemplates.map(t => \`
                <div class="template-card">
                    <div class="template-header">
                        <div>
                            <div class="template-title">\${t.name}</div>
                            <span class="template-category">\${t.category}</span>
                        </div>
                    </div>
                    <div class="template-description">\${t.description}</div>
                    <div class="template-tags">
                        \${t.tags.map(tag => \`<span class="tag">#\${tag}</span>\`).join('')}
                    </div>
                    <div class="template-meta">
                        <span>v\${t.version}</span>
                        \${t.usage_count ? \`<span>Used \${t.usage_count} times</span>\` : ''}
                    </div>
                    <div class="template-actions">
                        <button class="action-btn primary" onclick="createFromTemplate('\${t.id}')">Create</button>
                        \${!t.isBuiltIn ? \`
                            <button class="action-btn" onclick="editTemplate('\${t.id}')">Edit</button>
                            <button class="action-btn" onclick="duplicateTemplate('\${t.id}')">Duplicate</button>
                            <button class="action-btn" onclick="exportTemplate('\${t.id}')">Export</button>
                            <button class="action-btn danger" onclick="deleteTemplate('\${t.id}')">Delete</button>
                        \` : ''}
                    </div>
                </div>
            \`).join('');
        }

        function setView(view) {
            currentView = view;
            document.getElementById('gridBtn').classList.toggle('btn-secondary', view !== 'grid');
            document.getElementById('gridBtn').classList.toggle('btn', view === 'grid');
            document.getElementById('listBtn').classList.toggle('btn-secondary', view !== 'list');
            document.getElementById('listBtn').classList.toggle('btn', view === 'list');
            renderTemplates();
        }

        function setCategory(category) {
            activeCategory = category;
            renderFilters();
            renderTemplates();
        }

        function filterTemplates() {
            searchQuery = document.getElementById('searchInput').value;
            renderTemplates();
        }

        function createFromTemplate(templateId) {
            vscode.postMessage({
                command: 'createFromTemplate',
                templateId: templateId
            });
        }

        function editTemplate(templateId) {
            vscode.postMessage({
                command: 'editTemplate',
                templateId: templateId
            });
        }

        function deleteTemplate(templateId) {
            vscode.postMessage({
                command: 'deleteTemplate',
                templateId: templateId
            });
        }

        function duplicateTemplate(templateId) {
            vscode.postMessage({
                command: 'duplicateTemplate',
                templateId: templateId
            });
        }

        function exportTemplate(templateId) {
            vscode.postMessage({
                command: 'exportTemplate',
                templateId: templateId
            });
        }

        function refresh() {
            vscode.postMessage({
                command: 'refresh'
            });
        }
    </script>
</body>
</html>`;
}
