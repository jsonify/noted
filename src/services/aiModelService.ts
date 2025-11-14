import * as vscode from 'vscode';

/**
 * Select the appropriate AI model based on user preference and availability
 * Defaults to latest Claude Sonnet for best structured output quality
 *
 * This is a shared utility used by:
 * - Template generation (TemplateGenerator)
 * - User story creation (templateCommands)
 * - Any other AI-powered features
 *
 * @returns Selected language model
 * @throws Error if no models are available
 */
export async function selectAIModel(): Promise<vscode.LanguageModelChat> {
    const config = vscode.workspace.getConfiguration('noted');
    const preferredModelId = config.get<string>('templates.preferredModel');

    // Get all available models
    const allModels = await vscode.lm.selectChatModels({});

    if (allModels.length === 0) {
        throw new Error('No AI models available. Please install GitHub Copilot, Claude, or another LLM extension.');
    }

    // Try to use preferred model if set
    if (preferredModelId) {
        const preferred = allModels.find(m => m.id === preferredModelId);
        if (preferred) {
            return preferred;
        }
        // If preferred model not found, fall through to automatic selection
    }

    // Priority 1: Claude Sonnet (best for structured output)
    // Look for all Sonnet models and pick the latest version
    const sonnetModels = allModels.filter(m =>
        (m.vendor === 'copilot' || m.vendor === 'anthropic') &&
        (m.family.toLowerCase().includes('sonnet') || m.id.toLowerCase().includes('sonnet'))
    );

    if (sonnetModels.length > 0) {
        // Sort by ID to get the latest version (e.g., sonnet-4-5 > sonnet-3-5)
        const latestSonnet = sonnetModels.sort((a, b) => b.id.localeCompare(a.id))[0];
        return latestSonnet;
    }

    // Priority 2: Claude Opus (most capable)
    const opus = allModels.find(m =>
        (m.vendor === 'copilot' || m.vendor === 'anthropic') &&
        (m.family.toLowerCase().includes('opus') || m.id.toLowerCase().includes('opus'))
    );
    if (opus) {
        return opus;
    }

    // Priority 3: Any other Claude model
    const anyClaude = allModels.find(m =>
        m.vendor === 'copilot' && m.family.toLowerCase().includes('claude')
    );
    if (anyClaude) {
        return anyClaude;
    }

    // Priority 4: Direct Anthropic vendor
    const anthropic = allModels.find(m => m.vendor === 'anthropic');
    if (anthropic) {
        return anthropic;
    }

    // Priority 5: GPT-4 models (good fallback)
    const gpt4 = allModels.find(m =>
        m.vendor === 'copilot' &&
        (m.family.toLowerCase().includes('gpt-4') || m.family.toLowerCase().includes('gpt4'))
    );
    if (gpt4) {
        return gpt4;
    }

    // Priority 6: Any GPT model
    const anyGPT = allModels.find(m =>
        m.vendor === 'copilot' && m.family.toLowerCase().includes('gpt')
    );
    if (anyGPT) {
        return anyGPT;
    }

    // Priority 7: Gemini models
    const gemini = allModels.find(m =>
        m.vendor === 'copilot' && m.family.toLowerCase().includes('gemini')
    );
    if (gemini) {
        return gemini;
    }

    // Last resort: Return first available model
    return allModels[0];
}
