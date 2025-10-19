import * as vscode from 'vscode';
import { TagService } from './tagService';

/**
 * Metadata section limit for tag completion
 * Only provide completions in first 10 lines
 */
const METADATA_LINE_LIMIT = 10;

/**
 * Provides tag completion suggestions when typing in note metadata sections
 */
export class TagCompletionProvider implements vscode.CompletionItemProvider {
  private tagService: TagService;

  constructor(tagService: TagService) {
    this.tagService = tagService;
  }

  /**
   * Provide completion items for tags
   * Triggers when user types # in the metadata section
   */
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context?: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    // Only provide completions in metadata section (first 10 lines)
    if (position.line >= METADATA_LINE_LIMIT) {
      return [];
    }

    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Check if we're in a tags: line
    if (!textBeforeCursor.toLowerCase().includes('tags:')) {
      return [];
    }

    // Find the last # before cursor position
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    if (lastHashIndex === -1) {
      return [];
    }

    // Get the partial tag input after the last #
    const partialTag = textBeforeCursor.substring(lastHashIndex + 1).trim();

    // Get already used tags in the current line
    const usedTags = this.extractExistingTagsFromLine(lineText);

    // Get all available tags sorted by frequency
    const allTags = this.tagService.getAllTags('frequency');

    // Filter tags based on partial input and exclude already used tags
    const filteredTags = allTags.filter(tagInfo => {
      const tagName = tagInfo.name;

      // Exclude already used tags (case-insensitive)
      if (usedTags.some(used => used.toLowerCase() === tagName.toLowerCase())) {
        return false;
      }

      // If there's partial input, filter by prefix match
      if (partialTag.length > 0) {
        return tagName.toLowerCase().startsWith(partialTag.toLowerCase());
      }

      return true;
    });

    // Create completion items
    const completionItems = filteredTags.map(tagInfo => {
      const item = new vscode.CompletionItem(
        tagInfo.name,
        vscode.CompletionItemKind.Text
      );

      item.insertText = `#${tagInfo.name}`;
      item.detail = `Used in ${tagInfo.count} note${tagInfo.count !== 1 ? 's' : ''}`;
      item.documentation = new vscode.MarkdownString(
        `Tag **#${tagInfo.name}** appears in ${tagInfo.count} note${tagInfo.count !== 1 ? 's' : ''}`
      );

      // Set sort text to maintain frequency order
      // Pad with zeros to ensure proper sorting
      const sortOrder = (10000 - tagInfo.count).toString().padStart(5, '0');
      item.sortText = `${sortOrder}-${tagInfo.name}`;

      return item;
    });

    return completionItems;
  }

  /**
   * Extract existing tags from a line
   * @param line The line text to parse
   * @returns Array of tag names (without # prefix)
   */
  private extractExistingTagsFromLine(line: string): string[] {
    const tags: string[] = [];
    const tagPattern = /#([a-z0-9]+(?:-[a-z0-9]+)*)/gi;
    let match;

    while ((match = tagPattern.exec(line)) !== null) {
      tags.push(match[1].toLowerCase());
    }

    return tags;
  }
}
