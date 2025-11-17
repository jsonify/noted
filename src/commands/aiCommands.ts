import * as vscode from 'vscode';
import { getAvailableModels, formatModelForDisplay } from '../services/aiModelService';

/**
 * Command: Select preferred AI model for all AI features
 * Sets the global AI model preference used by templates, tagging, summarization, and search
 */
export async function handleSelectAIModel(): Promise<void> {
    try {
        // Get all available models
        const models = await getAvailableModels();

        if (models.length === 0) {
            vscode.window.showErrorMessage(
                'No AI models available. Please install GitHub Copilot, Claude, or another LLM extension.'
            );
            return;
        }

        // Get current preference (check both global and template-specific for backwards compatibility)
        const config = vscode.workspace.getConfiguration('noted');
        const currentModelId = config.get<string>('ai.preferredModel') || config.get<string>('templates.preferredModel') || '';

        // Build quick pick items
        interface ModelQuickPickItem extends vscode.QuickPickItem {
            modelId: string;
        }

        const items: ModelQuickPickItem[] = models.map(model => {
            const formatted = formatModelForDisplay(model);
            const isSelected = model.id === currentModelId;
            const icon = isSelected ? '$(check)' : '$(circle-outline)';

            return {
                modelId: model.id,
                label: `${icon} ${formatted.label}`,
                description: formatted.description,
                detail: formatted.detail,
                picked: isSelected
            };
        });

        // Add "Automatic" option at the top
        items.unshift({
            modelId: '',
            label: `${currentModelId === '' ? '$(check)' : '$(circle-outline)'} Automatic (Recommended)`,
            description: 'Smart selection based on availability',
            detail: 'Priority: Claude Sonnet → Opus → GPT-4 → Gemini',
            picked: currentModelId === ''
        });

        // Show picker
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select AI model for all AI features (templates, tagging, summarization, search)',
            title: 'AI Model Selection',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (!selected) {
            return;
        }

        // Save preference to global config
        await config.update('ai.preferredModel', selected.modelId, vscode.ConfigurationTarget.Global);

        const modelName = selected.modelId === '' ? 'Automatic selection' : selected.label.replace(/\$\(.*?\)\s/, '');
        vscode.window.showInformationMessage(
            `AI model set to: ${modelName}\n\nThis will be used for templates, tagging, summarization, and search.`
        );
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to select AI model: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to select AI model: Unknown error');
        }
    }
}
