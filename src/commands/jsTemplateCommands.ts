import * as vscode from 'vscode';
import * as path from 'path';
import { getTemplatesPath, getFileFormat } from '../services/configService';
import { pathExists, readFile, writeFile, readDirectory } from '../services/fileSystemService';
import { getCustomTemplates } from '../services/templateService';

/**
 * Convert a static template to JavaScript template format
 * Replaces {placeholders} with <%= note.vars.placeholder %>
 */
export async function convertTemplateToJS(): Promise<void> {
    try {
        // Get list of existing custom templates
        const templates = await getCustomTemplates();

        if (templates.length === 0) {
            vscode.window.showInformationMessage(
                'No custom templates found. Create a custom template first using "Noted: Create Custom Template".'
            );
            return;
        }

        // Let user select a template to convert
        const selected = await vscode.window.showQuickPick(templates, {
            placeHolder: 'Select a template to convert to JavaScript',
            title: 'Convert Template to JavaScript'
        });

        if (!selected) {
            return;
        }

        // Read the template file
        const templatesPath = getTemplatesPath();
        if (!templatesPath) {
            vscode.window.showErrorMessage('Templates folder path is not configured.');
            return;
        }

        const fileFormat = getFileFormat();
        const templatePath = path.join(templatesPath, `${selected}.${fileFormat}`);

        if (!await pathExists(templatePath)) {
            vscode.window.showErrorMessage(`Template file not found: ${templatePath}`);
            return;
        }

        const content = await readFile(templatePath);

        // Convert placeholders to JavaScript template syntax
        const jsContent = convertPlaceholdersToJS(content);

        // Generate the JavaScript template
        const jsTemplate = generateJSTemplate(selected, jsContent);

        // Ask for output name
        const outputName = await vscode.window.showInputBox({
            prompt: 'Enter name for the JavaScript template (without extension)',
            value: `${selected}-js`,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Template name cannot be empty';
                }
                if (!/^[a-z0-9-_]+$/i.test(value)) {
                    return 'Template name can only contain letters, numbers, hyphens, and underscores';
                }
                return undefined;
            }
        });

        if (!outputName) {
            return;
        }

        // Save the JavaScript template
        const jsTemplatePath = path.join(templatesPath, `${outputName}.js.template`);

        if (await pathExists(jsTemplatePath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `Template "${outputName}.js.template" already exists. Overwrite?`,
                'Yes', 'No'
            );

            if (overwrite !== 'Yes') {
                return;
            }
        }

        await writeFile(jsTemplatePath, jsTemplate);

        // Show success message with option to open
        const action = await vscode.window.showInformationMessage(
            `JavaScript template "${outputName}.js.template" created successfully!`,
            'Open Template', 'Open in Editor'
        );

        if (action === 'Open Template') {
            const doc = await vscode.workspace.openTextDocument(jsTemplatePath);
            await vscode.window.showTextDocument(doc);
        } else if (action === 'Open in Editor') {
            const doc = await vscode.workspace.openTextDocument(jsTemplatePath);
            await vscode.window.showTextDocument(doc, { preview: false });
        }

    } catch (error) {
        vscode.window.showErrorMessage(
            `Error converting template: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Convert static template placeholders to JavaScript template expressions
 */
function convertPlaceholdersToJS(content: string): string {
    // Map of placeholder patterns to their JS equivalents
    // Using the actual variable names provided by the executor
    const placeholderMap: Record<string, string> = {
        '{filename}': '${filename}',
        '{date}': '${dateString}',
        '{time}': '${timeString}',
        '{year}': '${year}',
        '{month}': '${month}',
        '{day}': '${day}',
        '{weekday}': '${weekday}',
        '{month_name}': '${monthName}',
        '{user}': '${user}',
        '{workspace}': '${workspace}'
    };

    let result = content;

    // Replace each placeholder
    for (const [placeholder, jsExpr] of Object.entries(placeholderMap)) {
        // Use a regex with global flag to replace all occurrences
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        result = result.replace(regex, jsExpr);
    }

    return result;
}

/**
 * Generate a complete JavaScript template file
 */
function generateJSTemplate(originalName: string, convertedContent: string): string {
    // Escape backticks and ${} in the content
    const escapedContent = convertedContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');

    const template = `/**
 * Template: ${capitalizeWords(originalName)}
 * Description: Converted from static template "${originalName}"
 * Auto-generated by template converter
 */

module.exports = (note) => {
  // Destructure available variables from note object
  const {
    filename,
    dateString,
    timeString,
    year,
    month,
    day,
    weekday,
    monthName,
    user,
    workspace,
    date,
    dateHelper,
    timeHelper
  } = note;

  // Generate the template content
  const content = \`${escapedContent}\`;

  return content;
};
`;

    return template;
}

/**
 * Capitalize words in a string
 */
function capitalizeWords(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Show JavaScript template documentation and examples
 */
export async function showJSTemplateHelp(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'jsTemplateHelp',
        'JavaScript Templates Help',
        vscode.ViewColumn.One,
        { enableScripts: false }
    );

    panel.webview.html = getHelpHTML();
}

/**
 * Generate help HTML
 */
function getHelpHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Templates Help</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
        }
        h1 { color: #007acc; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        h2 { color: #4a90e2; margin-top: 30px; }
        h3 { color: #666; }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .example {
            background: #e8f4f8;
            border-left: 4px solid #4a90e2;
            padding: 15px;
            margin: 15px 0;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
        }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>JavaScript Templates Guide</h1>

    <h2>What are JavaScript Templates?</h2>
    <p>
        JavaScript templates are programmable note templates that use JavaScript code to generate
        dynamic content. Unlike static templates with simple placeholders, JavaScript templates can:
    </p>
    <ul>
        <li>Execute conditional logic (if/else statements)</li>
        <li>Use loops to generate repeated content</li>
        <li>Perform calculations and date manipulations</li>
        <li>Access note history and metadata</li>
        <li>Create context-aware templates</li>
    </ul>

    <h2>Basic Structure</h2>
    <div class="example">
        <pre><code>/**
 * Template: My Custom Template
 * Description: What this template does
 */

module.exports = (note) => {
  // Access variables from note object
  const { filename, dateString, timeString, user } = note;

  // Build content
  let content = \`# \${filename}\\n\\n\`;
  content += \`Created by \${user} on \${dateString}\\n\\n\`;

  // Return the generated content
  return content;
};</code></pre>
    </div>

    <h2>Available Context</h2>
    <h3>Variables (note object)</h3>
    <ul>
        <li><code>filename</code> - Note file name</li>
        <li><code>dateString</code> - Full date string (e.g., "Sunday, October 25, 2025")</li>
        <li><code>timeString</code> - 12-hour time with AM/PM</li>
        <li><code>year</code>, <code>month</code>, <code>day</code> - Date components</li>
        <li><code>weekday</code> - Day name (Mon, Tue, etc.)</li>
        <li><code>monthName</code> - Full month name</li>
        <li><code>user</code> - System username</li>
        <li><code>workspace</code> - VS Code workspace name</li>
        <li><code>date</code> - JavaScript Date object</li>
        <li><code>dateHelper</code> - Date manipulation helper</li>
        <li><code>timeHelper</code> - Time formatting helper</li>
    </ul>

    <h2>Example: Day-Aware Template</h2>
    <div class="example">
        <pre><code>module.exports = (note) => {
  const { weekday, dateString } = note;

  let content = \`# Daily Note\\n\\n\`;

  if (weekday === 'Mon') {
    content += \`## Week Start\\n\`;
    content += \`Time to plan the week!\\n\\n\`;
  } else if (weekday === 'Fri') {
    content += \`## Week End\\n\`;
    content += \`Time to review and wrap up!\\n\\n\`;
  } else {
    content += \`## \${weekday}\\n\\n\`;
  }

  return content;
};</code></pre>
    </div>

    <h2>Converting Static Templates</h2>
    <p>
        Use the <strong>"Noted: Convert Template to JavaScript"</strong> command to automatically
        convert your existing static templates. The converter will:
    </p>
    <ol>
        <li>Replace <code>{placeholders}</code> with JavaScript variables</li>
        <li>Wrap content in a JavaScript function</li>
        <li>Save as a <code>.js.template</code> file</li>
    </ol>

    <div class="warning">
        <strong>Security Note:</strong> JavaScript templates are disabled by default. Enable them
        in VS Code settings: <code>"noted.enableJavaScriptTemplates": true</code>
    </div>

    <h2>Examples</h2>
    <p>
        Check out the example templates in <code>.templates/examples/</code>:
    </p>
    <ul>
        <li><code>daily-smart.js.template</code> - Context-aware daily notes</li>
        <li><code>weekly-review.js.template</code> - Fetches last week's notes</li>
        <li><code>meeting-smart.js.template</code> - Detects recurring meetings</li>
        <li><code>project-kickoff.js.template</code> - Generates project IDs</li>
        <li><code>standup.js.template</code> - Smart daily standup format</li>
    </ul>

    <h2>Learn More</h2>
    <p>
        For complete documentation, visit:
        <a href="https://jsonify.github.io/noted/posts/javascript-templates/">
            JavaScript Templates Guide
        </a>
    </p>
</body>
</html>`;
}

/**
 * List all JavaScript templates
 */
export async function listJSTemplates(): Promise<void> {
    try {
        const templatesPath = getTemplatesPath();
        if (!templatesPath) {
            vscode.window.showInformationMessage('Templates folder not configured.');
            return;
        }

        if (!await pathExists(templatesPath)) {
            vscode.window.showInformationMessage('Templates folder does not exist.');
            return;
        }

        // Get all .js.template files
        const files = await readDirectory(templatesPath);
        const jsTemplates = files.filter(f => f.endsWith('.js.template'));

        if (jsTemplates.length === 0) {
            vscode.window.showInformationMessage(
                'No JavaScript templates found. Try converting a static template or creating a new one.'
            );
            return;
        }

        // Show templates
        const items = jsTemplates.map(file => ({
            label: path.basename(file, '.js.template'),
            description: file,
            detail: 'JavaScript Template'
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'JavaScript Templates',
            title: 'Available JavaScript Templates'
        });

        if (selected) {
            const fullPath = path.join(templatesPath, selected.description);
            const doc = await vscode.workspace.openTextDocument(fullPath);
            await vscode.window.showTextDocument(doc);
        }

    } catch (error) {
        vscode.window.showErrorMessage(
            `Error listing templates: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
