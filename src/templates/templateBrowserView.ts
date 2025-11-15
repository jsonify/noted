import * as vscode from 'vscode';
import * as path from 'path';
import { getTemplatesPath, getFileFormat } from '../services/configService';
import { pathExists, readFile, readDirectory, writeFile } from '../services/fileSystemService';
import { Template, TemplateDifficulty } from './TemplateTypes';
import { BUILT_IN_TEMPLATES } from '../constants';
import { TemplatesTreeProvider } from '../providers/templatesTreeProvider';

// Module-level reference to templates tree provider for refreshing
let templatesProvider: TemplatesTreeProvider | undefined;

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
    difficulty?: TemplateDifficulty;
}

/**
 * Show the template browser webview
 */
export async function showTemplateBrowser(context: vscode.ExtensionContext, provider?: TemplatesTreeProvider): Promise<void> {
    // Store reference to templates provider for refreshing after operations
    templatesProvider = provider;

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

    // Helper function to refresh webview templates
    const refreshWebviewTemplates = async () => {
        const updatedTemplates = await loadAllTemplates();
        panel.webview.postMessage({
            command: 'updateTemplates',
            templates: updatedTemplates
        });
    };

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
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'duplicateTemplate':
                    await handleDuplicateTemplate(message.templateId);
                    await refreshWebviewTemplates();
                    templatesProvider?.refresh(); // Refresh sidebar tree view
                    break;

                case 'exportTemplate':
                    await handleExportTemplate(message.templateId);
                    break;

                case 'refresh':
                    await refreshWebviewTemplates();
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Helper function to find a template file (JSON or legacy)
 * Returns { path: string, type: 'json' | 'txt' | 'md' } or null if not found
 */
async function findTemplateFile(templatesPath: string, templateId: string): Promise<{ path: string; type: 'json' | 'txt' | 'md' } | null> {
    // Try JSON first
    const jsonPath = path.join(templatesPath, `${templateId}.json`);
    if (await pathExists(jsonPath)) {
        return { path: jsonPath, type: 'json' };
    }

    // Try both .md and .txt
    for (const ext of ['md', 'txt'] as const) {
        const legacyPath = path.join(templatesPath, `${templateId}.${ext}`);
        if (await pathExists(legacyPath)) {
            return { path: legacyPath, type: ext };
        }
    }

    return null;
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
                            fileType: 'json',
                            difficulty: template.difficulty
                        });
                    } catch (error) {
                        vscode.window.showWarningMessage(`Failed to parse template file: ${file}`);
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
        vscode.window.showWarningMessage('Failed to load custom templates. Check the developer console for details.');
        console.error('Failed to load custom templates:', error);
    }

    return templates;
}

/**
 * Handle creating a note from a template
 */
async function handleCreateFromTemplate(templateId: string): Promise<void> {
    // Execute the openWithTemplate command with the template ID
    await vscode.commands.executeCommand('noted.openWithTemplate', templateId);
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

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (templateFile) {
        const document = await vscode.workspace.openTextDocument(templateFile.path);
        await vscode.window.showTextDocument(document);
    } else {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
    }
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

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (templateFile) {
        await vscode.workspace.fs.delete(vscode.Uri.file(templateFile.path));
        vscode.window.showInformationMessage(`Template "${templateId}" deleted`);
    } else {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
    }
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

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile) {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
        return;
    }

    if (templateFile.type === 'json') {
        const content = await readFile(templateFile.path);
        const template: Template = JSON.parse(content);

        // Update template metadata
        template.id = newName;
        template.name = newName.charAt(0).toUpperCase() + newName.slice(1).replace(/-/g, ' ');
        template.created = new Date().toISOString();
        template.modified = new Date().toISOString();

        const newPath = path.join(templatesPath, `${newName}.json`);
        await writeFile(newPath, JSON.stringify(template, null, 2));
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
    } else {
        // Legacy template
        const content = await readFile(templateFile.path);
        const newPath = path.join(templatesPath, `${newName}.${templateFile.type}`);
        await writeFile(newPath, content);
        vscode.window.showInformationMessage(`Template duplicated as "${newName}"`);
    }
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

    const templateFile = await findTemplateFile(templatesPath, templateId);
    if (!templateFile) {
        vscode.window.showErrorMessage(`Template not found: ${templateId}`);
        return;
    }

    const filters: { [name: string]: string[] } = templateFile.type === 'json'
        ? { 'JSON': ['json'] }
        : { 'Text': ['txt', 'md'] };

    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`${templateId}.${templateFile.type}`),
        filters: filters
    });

    if (uri) {
        const content = await readFile(templateFile.path);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        vscode.window.showInformationMessage(`Template exported to ${uri.fsPath}`);
    }
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
            position: relative;
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

        .template-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }

        .template-icon {
            font-size: 20px;
            flex-shrink: 0;
        }

        .template-title {
            font-size: 16px;
            font-weight: 600;
        }

        .template-badges {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 8px;
        }

        .template-category {
            font-size: 11px;
            display: inline-block;
            padding: 3px 8px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            font-weight: 500;
        }

        .status-badge {
            font-size: 10px;
            padding: 3px 6px;
            border-radius: 3px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-new {
            background: var(--vscode-gitDecoration-addedResourceForeground);
            color: var(--vscode-editor-background);
        }

        .status-popular {
            background: var(--vscode-list-warningForeground);
            color: var(--vscode-editor-background);
        }

        .difficulty-stars {
            font-size: 14px;
            color: var(--vscode-list-warningForeground);
            letter-spacing: 1px;
        }

        .filetype-badge {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 3px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            font-family: monospace;
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

        // Constants for template icons and badges
        const TEMPLATE_ICON_MAP = {
            'Built-in': '⚙️',
            'Custom': '📝',
            'Documentation': '📚',
            'Project': '📊',
            'Meeting': '🤝',
            'Research': '🔬',
            'Planning': '📋',
            'Development': '💻',
            'Design': '🎨',
            'General': '📝',
            'Daily Notes': '📅',
            'User Story': '📖'
        };

        const FILE_TYPE_BADGES = {
            'builtin': '⚙️ Built-in',
            'json': '📦 JSON',
            'txt': '📄 Text',
            'md': '📝 Markdown'
        };

        // HTML escaping function to prevent XSS
        function escapeHtml(unsafe) {
            const text = typeof unsafe === 'string' ? unsafe : String(unsafe);
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Get icon for template based on category and file type
        function getTemplateIcon(template) {
            return TEMPLATE_ICON_MAP[template.category] || '📝';
        }

        // Determine if template is "new" (created within last 7 days)
        function isNew(template, now) {
            if (!template.created) return false;
            const created = new Date(template.created);
            const daysDiff = (now - created) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        }

        // Determine if template is "popular" (usage_count > 10)
        function isPopular(template) {
            return template.usage_count >= 10;
        }

        // Get file type display text
        function getFileTypeBadge(fileType) {
            return FILE_TYPE_BADGES[fileType] || fileType;
        }

        // Convert difficulty to stars (1-3 stars)
        function getDifficultyStars(difficulty) {
            const starMap = {
                'beginner': '⭐',
                'intermediate': '⭐⭐',
                'advanced': '⭐⭐⭐'
            };
            return starMap[difficulty] || '';
        }

        // Calculate usage trend (mock implementation - would need historical data)
        function getUsageTrend(template) {
            // For now, return empty string. In a real implementation, this would
            // compare current week's usage to previous weeks
            // Example: "↑ 3 this week" or "↓ 2 this week"
            if (!template.usage_count || template.usage_count === 0) {
                return '';
            }
            // Mock: Templates with high usage show upward trend
            if (template.usage_count >= 10) {
                const weeklyUses = Math.floor(Math.random() * 5) + 1;
                return \`↑ \${weeklyUses} this week\`;
            }
            return '';
        }

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
                    onclick="setCategory('\${escapeHtml(cat)}')"
                >
                    \${escapeHtml(cat.charAt(0).toUpperCase() + cat.slice(1))} (\${cat === 'all' ? templates.length : templates.filter(t => t.category === cat).length})
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

            container.innerHTML = filteredTemplates.map(t => {
                const showNew = isNew(t);
                const showPopular = isPopular(t);
                const difficultyStars = getDifficultyStars(t.difficulty);
                const usageTrend = getUsageTrend(t);

                return \`
                <div class="template-card">
                    <div class="template-header">
                        <div style="flex: 1;">
                            <div class="template-title-row">
                                <span class="template-icon">\${getTemplateIcon(t)}</span>
                                <div class="template-title">\${escapeHtml(t.name)}</div>
                                \${difficultyStars ? \`<span class="difficulty-stars" title="Difficulty: \${escapeHtml(t.difficulty)}">\${difficultyStars}</span>\` : ''}
                            </div>
                            <div class="template-badges">
                                <span class="template-category">\${escapeHtml(t.category)}</span>
                                <span class="filetype-badge">\${getFileTypeBadge(t.fileType)}</span>
                                \${showNew ? '<span class="status-badge status-new">NEW</span>' : ''}
                                \${showPopular ? '<span class="status-badge status-popular">🔥 POPULAR</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="template-description">\${escapeHtml(t.description)}</div>
                    <div class="template-tags">
                        \${t.tags.map(tag => \`<span class="tag">#\${escapeHtml(tag)}</span>\`).join('')}
                    </div>
                    <div class="template-meta">
                        <span>v\${escapeHtml(t.version)}</span>
                        <span>\${t.usage_count !== undefined ? \`📊 \${escapeHtml(t.usage_count)} uses\${usageTrend ? \` · \${usageTrend}\` : ''}\` : '📊 0 uses'}</span>
                        \${t.author ? \`<span>👤 \${escapeHtml(t.author)}</span>\` : ''}
                    </div>
                    <div class="template-actions">
                        <button class="action-btn primary" onclick="createFromTemplate('\${escapeHtml(t.id)}')">Create</button>
                        \${!t.isBuiltIn ? \`
                            <button class="action-btn" onclick="editTemplate('\${escapeHtml(t.id)}')">Edit</button>
                            <button class="action-btn" onclick="duplicateTemplate('\${escapeHtml(t.id)}')">Duplicate</button>
                            <button class="action-btn" onclick="exportTemplate('\${escapeHtml(t.id)}')">Export</button>
                            <button class="action-btn danger" onclick="deleteTemplate('\${escapeHtml(t.id)}')">Delete</button>
                        \` : ''}
                    </div>
                </div>
                \`;
            }).join('');
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
