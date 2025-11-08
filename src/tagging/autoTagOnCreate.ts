import * as vscode from 'vscode';
import { tagGenerator } from './TagGenerator';
import { tagManager } from './TagManager';

/**
 * Auto-tag a newly created note if the setting is enabled
 * This runs in the background without blocking the user
 *
 * @param filePath - Path to the newly created note
 */
export async function autoTagNewNote(filePath: string): Promise<void> {
    try {
        // Check if auto-tagging on create is enabled
        const config = vscode.workspace.getConfiguration('noted');
        const autoTagEnabled = config.get<boolean>('tagging.enabled', true);
        const autoTagOnCreate = config.get<boolean>('tagging.autoTagOnCreate', false);

        if (!autoTagEnabled || !autoTagOnCreate) {
            return;
        }

        // Run in background - don't block the user
        setTimeout(async () => {
            try {
                // Read the note content
                const document = await vscode.workspace.openTextDocument(filePath);
                const content = document.getText();

                // Skip if the note is too short (less than 50 characters)
                if (content.trim().length < 50) {
                    return;
                }

                // Generate tags
                const suggestedTags = await tagGenerator.generateTags(content, filePath);

                // Only apply high-confidence tags (>0.75) automatically
                const highConfidenceTags = suggestedTags.filter(t => t.confidence > 0.75);

                if (highConfidenceTags.length > 0) {
                    // Apply tags
                    await tagManager.tagNote(filePath, highConfidenceTags, true);

                    // Show subtle notification
                    const tagNames = highConfidenceTags.map(t => t.name).join(', ');
                    vscode.window.showInformationMessage(
                        `Auto-tagged note with: ${tagNames}`,
                        'View Tags'
                    ).then(selection => {
                        if (selection === 'View Tags') {
                            // Open the manage tags command
                            vscode.commands.executeCommand('noted.manageNoteTags');
                        }
                    });
                }
            } catch (error) {
                // Silently fail - don't interrupt the user with auto-tagging errors
                console.error('Auto-tagging error:', error);
            }
        }, 2000); // Wait 2 seconds before tagging to let user start writing

    } catch (error) {
        // Silently fail
        console.error('Auto-tagging setup error:', error);
    }
}

/**
 * Check if auto-tagging on create is enabled
 * Useful for showing UI hints
 */
export function isAutoTagOnCreateEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('noted');
    const autoTagEnabled = config.get<boolean>('tagging.enabled', true);
    const autoTagOnCreate = config.get<boolean>('tagging.autoTagOnCreate', false);
    return autoTagEnabled && autoTagOnCreate;
}
