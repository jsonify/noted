/**
 * Tag management command handlers
 * All commands are designed to be registered in extension.ts
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { TagService } from '../services/tagService';
import { readFile, writeFile, readDirectoryWithTypes } from '../services/fileSystemService';
import { extractTagsFromContent, isValidTag, normalizeTag, formatTagForDisplay } from '../utils/tagHelpers';
import { SUPPORTED_EXTENSIONS } from '../constants';

/**
 * Rename a tag across all notes
 * @param tagService The tag service instance
 * @param notesPath The path to the notes directory
 */
export async function renameTag(tagService: TagService, notesPath: string): Promise<void> {
  try {
    // Get all available tags
    const allTags = tagService.getAllTags('alphabetical');

    if (allTags.length === 0) {
      vscode.window.showInformationMessage('No tags found');
      return;
    }

    // Ask for old tag name
    const oldTagInput = await vscode.window.showInputBox({
      prompt: 'Enter the tag to rename (without #)',
      placeHolder: 'bug',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Tag name cannot be empty';
        }
        const normalized = normalizeTag(value);
        if (!tagService.hasTag(normalized)) {
          return 'Tag not found';
        }
        return null;
      }
    });

    if (!oldTagInput) {
      return; // User cancelled
    }

    const oldTag = normalizeTag(oldTagInput);

    // Ask for new tag name
    const newTagInput = await vscode.window.showInputBox({
      prompt: 'Enter the new tag name (without #)',
      placeHolder: 'defect',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Tag name cannot be empty';
        }
        const normalized = normalizeTag(value);
        if (!isValidTag(normalized)) {
          return 'Invalid tag name (must start with letter, contain only lowercase letters, numbers, and hyphens)';
        }
        if (normalized === oldTag) {
          return 'New tag name must be different from old tag';
        }
        return null;
      }
    });

    if (!newTagInput) {
      return; // User cancelled
    }

    const newTag = normalizeTag(newTagInput);

    // Double-check validation (in case mocked in tests)
    if (!isValidTag(newTag)) {
      vscode.window.showErrorMessage('Invalid tag name');
      return;
    }

    if (newTag === oldTag) {
      vscode.window.showErrorMessage('New tag name must be different from old tag');
      return;
    }

    // Get notes with the old tag
    const notesWithTag = tagService.getNotesWithTag(oldTag);

    if (notesWithTag.length === 0) {
      vscode.window.showErrorMessage(`Tag "${oldTag}" not found in any notes`);
      return;
    }

    // Store original content for rollback
    const originalContents = new Map<string, string>();

    try {
      // Update all notes
      for (const notePath of notesWithTag) {
        const content = await readFile(notePath);
        originalContents.set(notePath, content);

        // Replace old tag with new tag in metadata section
        const updatedContent = replaceTagInContent(content, oldTag, newTag);
        await writeFile(notePath, updatedContent);
      }

      // Rebuild tag index
      await tagService.buildTagIndex();

      vscode.window.showInformationMessage(
        `Renamed tag "${formatTagForDisplay(oldTag)}" to "${formatTagForDisplay(newTag)}" in ${notesWithTag.length} notes`
      );
    } catch (error) {
      // Rollback on error
      vscode.window.showErrorMessage(
        `Failed to rename tag: ${error instanceof Error ? error.message : String(error)}. Rolling back changes...`
      );

      // Restore original content
      for (const [notePath, originalContent] of originalContents.entries()) {
        try {
          await writeFile(notePath, originalContent);
        } catch (rollbackError) {
          console.error(`[NOTED] Failed to rollback ${notePath}:`, rollbackError);
        }
      }

      // Rebuild tag index to ensure consistency
      await tagService.buildTagIndex();
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to rename tag: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Merge two tags into one across all notes
 * @param tagService The tag service instance
 * @param notesPath The path to the notes directory
 */
export async function mergeTags(tagService: TagService, notesPath: string): Promise<void> {
  try {
    // Get all available tags
    const allTags = tagService.getAllTags('frequency');

    if (allTags.length < 2) {
      vscode.window.showInformationMessage('Need at least 2 tags to merge');
      return;
    }

    // Create quick pick items
    const quickPickItems = allTags.map(tag => ({
      label: formatTagForDisplay(tag.name),
      description: `${tag.count} notes`,
      tag: tag.name
    }));

    // Ask for target tag (the one to keep)
    const targetSelection = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: 'Select the tag to keep (target tag)',
      canPickMany: false
    });

    if (!targetSelection) {
      return; // User cancelled
    }

    const targetTag = targetSelection.tag;

    // Ask for source tag (the one to merge and remove)
    const sourceSelection = await vscode.window.showQuickPick(
      quickPickItems.filter(item => item.tag !== targetTag),
      {
        placeHolder: 'Select the tag to merge into the target',
        canPickMany: false
      }
    );

    if (!sourceSelection) {
      return; // User cancelled
    }

    const sourceTag = sourceSelection.tag;

    // Validate selection
    if (sourceTag === targetTag) {
      vscode.window.showErrorMessage('Cannot merge a tag into itself');
      return;
    }

    // Get all notes with either tag
    const notesWithSource = new Set(tagService.getNotesWithTag(sourceTag));
    const notesWithTarget = new Set(tagService.getNotesWithTag(targetTag));
    const allAffectedNotes = new Set([...notesWithSource, ...notesWithTarget]);

    // Store original content for rollback
    const originalContents = new Map<string, string>();

    try {
      // Update all affected notes
      for (const notePath of allAffectedNotes) {
        const content = await readFile(notePath);
        originalContents.set(notePath, content);

        // Replace source tag with target tag and remove duplicates
        let updatedContent = replaceTagInContent(content, sourceTag, targetTag);
        updatedContent = removeDuplicateTags(updatedContent);
        await writeFile(notePath, updatedContent);
      }

      // Rebuild tag index
      await tagService.buildTagIndex();

      vscode.window.showInformationMessage(
        `Merged "${formatTagForDisplay(sourceTag)}" into "${formatTagForDisplay(targetTag)}" in ${allAffectedNotes.size} notes`
      );
    } catch (error) {
      // Rollback on error
      vscode.window.showErrorMessage(
        `Failed to merge tags: ${error instanceof Error ? error.message : String(error)}. Rolling back changes...`
      );

      // Restore original content
      for (const [notePath, originalContent] of originalContents.entries()) {
        try {
          await writeFile(notePath, originalContent);
        } catch (rollbackError) {
          console.error(`[NOTED] Failed to rollback ${notePath}:`, rollbackError);
        }
      }

      // Rebuild tag index to ensure consistency
      await tagService.buildTagIndex();
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to merge tags: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Delete a tag from all notes
 * @param tagService The tag service instance
 * @param notesPath The path to the notes directory
 */
export async function deleteTag(tagService: TagService, notesPath: string): Promise<void> {
  try {
    // Get all available tags
    const allTags = tagService.getAllTags('frequency');

    if (allTags.length === 0) {
      vscode.window.showInformationMessage('No tags found');
      return;
    }

    // Create quick pick items
    const quickPickItems = allTags.map(tag => ({
      label: formatTagForDisplay(tag.name),
      description: `${tag.count} notes`,
      tag: tag.name
    }));

    // Ask for tag to delete
    const selection = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: 'Select tag to delete',
      canPickMany: false
    });

    if (!selection) {
      return; // User cancelled
    }

    const tagToDelete = selection.tag;
    const notesWithTag = tagService.getNotesWithTag(tagToDelete);

    // Confirm deletion
    const answer = await vscode.window.showWarningMessage(
      `Delete tag "${formatTagForDisplay(tagToDelete)}" from ${notesWithTag.length} notes?`,
      { modal: true },
      'Delete',
      'Cancel'
    );

    if (answer !== 'Delete') {
      return;
    }

    // Store original content for rollback
    const originalContents = new Map<string, string>();

    try {
      // Update all notes
      for (const notePath of notesWithTag) {
        const content = await readFile(notePath);
        originalContents.set(notePath, content);

        // Remove tag from content
        const updatedContent = removeTagFromContent(content, tagToDelete);
        await writeFile(notePath, updatedContent);
      }

      // Rebuild tag index
      await tagService.buildTagIndex();

      vscode.window.showInformationMessage(
        `Deleted tag "${formatTagForDisplay(tagToDelete)}" from ${notesWithTag.length} notes`
      );
    } catch (error) {
      // Rollback on error
      vscode.window.showErrorMessage(
        `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}. Rolling back changes...`
      );

      // Restore original content
      for (const [notePath, originalContent] of originalContents.entries()) {
        try {
          await writeFile(notePath, originalContent);
        } catch (rollbackError) {
          console.error(`[NOTED] Failed to rollback ${notePath}:`, rollbackError);
        }
      }

      // Rebuild tag index to ensure consistency
      await tagService.buildTagIndex();
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to delete tag: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Export all tags to JSON format
 * @param tagService The tag service instance
 */
export async function exportTags(tagService: TagService): Promise<void> {
  try {
    const allTags = tagService.getAllTags('frequency');

    const exportData = {
      exportDate: new Date().toISOString(),
      total: allTags.length,
      tags: allTags.map(tag => ({
        name: tag.name,
        count: tag.count,
        notes: tag.notes
      }))
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    // Show in information message with formatted output
    await vscode.window.showInformationMessage(
      `Tag Export (${allTags.length} tags)\n\n\`\`\`json\n${jsonString}\n\`\`\``,
      { modal: true }
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to export tags: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Replace a tag with another tag in note content
 * Only replaces tags in the metadata section (first 10 lines)
 */
function replaceTagInContent(content: string, oldTag: string, newTag: string): string {
  const lines = content.split('\n');
  const metadataLineLimit = 10;

  // Process only metadata section
  for (let i = 0; i < Math.min(lines.length, metadataLineLimit); i++) {
    const line = lines[i];
    if (line.trim().toLowerCase().startsWith('tags:')) {
      // Replace old tag with new tag in this line
      const oldTagPattern = new RegExp(`#${oldTag}(?=\\s|$)`, 'gi');
      lines[i] = line.replace(oldTagPattern, `#${newTag}`);
    }
  }

  return lines.join('\n');
}

/**
 * Remove a tag from note content
 * Only removes tags from the metadata section (first 10 lines)
 */
function removeTagFromContent(content: string, tagToRemove: string): string {
  const lines = content.split('\n');
  const metadataLineLimit = 10;

  // Process only metadata section
  for (let i = 0; i < Math.min(lines.length, metadataLineLimit); i++) {
    const line = lines[i];
    if (line.trim().toLowerCase().startsWith('tags:')) {
      // Remove the tag from this line
      const tagPattern = new RegExp(`#${tagToRemove}(?=\\s|$)`, 'gi');
      let updatedLine = line.replace(tagPattern, '');

      // Clean up extra whitespace
      updatedLine = updatedLine.replace(/\s+/g, ' ').trim();

      // If line only has "tags:" left with no tags, remove the line
      if (updatedLine.toLowerCase() === 'tags:' || updatedLine.toLowerCase() === 'tags: ') {
        lines[i] = '';
      } else {
        lines[i] = updatedLine;
      }
    }
  }

  // Clean up empty lines at the start
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }

  return lines.join('\n');
}

/**
 * Remove duplicate tags from note content
 * Only processes the metadata section (first 10 lines)
 */
function removeDuplicateTags(content: string): string {
  const lines = content.split('\n');
  const metadataLineLimit = 10;

  // Process only metadata section
  for (let i = 0; i < Math.min(lines.length, metadataLineLimit); i++) {
    const line = lines[i];
    if (line.trim().toLowerCase().startsWith('tags:')) {
      // Extract all tags from the line
      const tags = extractTagsFromContent(line);

      // Create unique set of tags
      const uniqueTags = Array.from(new Set(tags));

      // Reconstruct the tags line
      if (uniqueTags.length > 0) {
        lines[i] = 'tags: ' + uniqueTags.map(t => formatTagForDisplay(t)).join(' ');
      } else {
        lines[i] = '';
      }
    }
  }

  // Clean up empty lines at the start
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }

  return lines.join('\n');
}
