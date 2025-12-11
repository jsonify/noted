/**
 * AI-powered action items extraction service using VS Code Language Model API
 * Extracts actionable items from selected text using GitHub Copilot
 */

import * as vscode from 'vscode';
import { selectAIModel } from './aiModelService';

/**
 * Format options for action items
 */
export type ActionItemFormat = 'checkboxes' | 'bullets';

/**
 * Service for extracting action items from text using AI
 */
export class ActionItemsService {
    /**
     * Check if Language Model API is available
     */
    private async isLanguageModelAvailable(): Promise<boolean> {
        try {
            await selectAIModel();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if AI features are enabled
     */
    private isAIEnabled(): boolean {
        const config = vscode.workspace.getConfiguration('noted.ai');
        return config.get<boolean>('enabled', true);
    }

    /**
     * Build prompt for action item extraction
     */
    private buildActionItemsPrompt(selectedText: string, format: ActionItemFormat): string {
        const formatInstruction = format === 'checkboxes'
            ? 'Use checkbox format: - [ ] Action item description'
            : 'Use bullet point format: - Action item description';

        return `Analyze the following text and extract any actionable items, tasks, or to-dos.

Text to analyze:
---
${selectedText}
---

Instructions:
- Extract clear, specific action items from the text
- ${formatInstruction}
- Include any mentioned deadlines, assignees, or priorities in parentheses
- Group related items together if applicable
- If no clear action items can be identified, respond with exactly: "No action items identified"
- Do not include any preamble or explanation, only the action items list

Action items:`;
    }

    /**
     * Extract action items from selected text
     * @param selectedText The text to analyze for action items
     * @param format The format for action items (checkboxes or bullets)
     * @param token Cancellation token
     * @returns Extracted action items or "No action items identified"
     */
    async extractActionItems(
        selectedText: string,
        format: ActionItemFormat,
        token: vscode.CancellationToken
    ): Promise<string> {
        // Check if AI is enabled
        if (!this.isAIEnabled()) {
            throw new Error('AI features are disabled. Enable them in settings: noted.ai.enabled');
        }

        // Check if Language Model API is available
        if (!(await this.isLanguageModelAvailable())) {
            throw new Error('GitHub Copilot is not available. Please install and enable GitHub Copilot to use AI features.');
        }

        // Truncate if too large
        const maxChars = 16000;
        const truncatedText = selectedText.length > maxChars
            ? selectedText.substring(0, maxChars) + '\n\n[Text truncated for analysis]'
            : selectedText;

        // Build prompt
        const prompt = this.buildActionItemsPrompt(truncatedText, format);

        // Call Language Model API
        try {
            const model = await selectAIModel();
            const messages = [vscode.LanguageModelChatMessage.User(prompt)];

            const response = await model.sendRequest(messages, {}, token);

            let result = '';
            for await (const chunk of response.text) {
                result += chunk;
            }

            return result.trim();

        } catch (error) {
            throw new Error(`Failed to extract action items: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
