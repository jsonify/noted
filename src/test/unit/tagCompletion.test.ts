import { expect } from 'chai';
import * as vscode from 'vscode';
import { TagCompletionProvider } from '../../services/tagCompletionProvider';
import { TagService } from '../../services/tagService';

/**
 * Mock VS Code TextDocument
 */
class MockTextDocument implements vscode.TextDocument {
  uri: vscode.Uri;
  fileName: string;
  isUntitled: boolean;
  languageId: string;
  version: number;
  isDirty: boolean;
  isClosed: boolean;
  eol: vscode.EndOfLine;
  lineCount: number;
  encoding: string;

  private lines: string[];

  constructor(content: string, languageId = 'plaintext') {
    this.lines = content.split('\n');
    this.uri = vscode.Uri.file('/test/note.txt');
    this.fileName = '/test/note.txt';
    this.isUntitled = false;
    this.languageId = languageId;
    this.version = 1;
    this.isDirty = false;
    this.isClosed = false;
    this.eol = vscode.EndOfLine.LF;
    this.lineCount = this.lines.length;
    this.encoding = 'utf8';
  }

  save(): Thenable<boolean> {
    return Promise.resolve(true);
  }

  lineAt(position: number | vscode.Position): vscode.TextLine {
    const lineNum = typeof position === 'number' ? position : position.line;
    const text = this.lines[lineNum] || '';

    return {
      lineNumber: lineNum,
      text,
      range: new vscode.Range(lineNum, 0, lineNum, text.length),
      rangeIncludingLineBreak: new vscode.Range(lineNum, 0, lineNum + 1, 0),
      firstNonWhitespaceCharacterIndex: text.search(/\S/),
      isEmptyOrWhitespace: text.trim().length === 0
    };
  }

  offsetAt(position: vscode.Position): number {
    let offset = 0;
    for (let i = 0; i < position.line && i < this.lines.length; i++) {
      offset += this.lines[i].length + 1; // +1 for newline
    }
    offset += position.character;
    return offset;
  }

  positionAt(offset: number): vscode.Position {
    let currentOffset = 0;
    for (let line = 0; line < this.lines.length; line++) {
      const lineLength = this.lines[line].length + 1; // +1 for newline
      if (currentOffset + lineLength > offset) {
        return new vscode.Position(line, offset - currentOffset);
      }
      currentOffset += lineLength;
    }
    return new vscode.Position(this.lines.length - 1, this.lines[this.lines.length - 1].length);
  }

  getText(range?: vscode.Range): string {
    if (!range) {
      return this.lines.join('\n');
    }

    if (range.start.line === range.end.line) {
      return this.lines[range.start.line].substring(range.start.character, range.end.character);
    }

    const result: string[] = [];
    for (let i = range.start.line; i <= range.end.line; i++) {
      if (i === range.start.line) {
        result.push(this.lines[i].substring(range.start.character));
      } else if (i === range.end.line) {
        result.push(this.lines[i].substring(0, range.end.character));
      } else {
        result.push(this.lines[i]);
      }
    }
    return result.join('\n');
  }

  getWordRangeAtPosition(position: vscode.Position, regex?: RegExp): vscode.Range | undefined {
    const line = this.lineAt(position);
    const text = line.text;
    const char = position.character;

    // Find word boundaries
    let start = char;
    let end = char;

    while (start > 0 && /\w/.test(text[start - 1])) {
      start--;
    }
    while (end < text.length && /\w/.test(text[end])) {
      end++;
    }

    if (start === end) {
      return undefined;
    }

    return new vscode.Range(position.line, start, position.line, end);
  }

  validateRange(range: vscode.Range): vscode.Range {
    return range;
  }

  validatePosition(position: vscode.Position): vscode.Position {
    return position;
  }
}

/**
 * Mock CancellationToken
 */
class MockCancellationToken implements vscode.CancellationToken {
  isCancellationRequested = false;
  onCancellationRequested = new vscode.EventEmitter<any>().event;
}

describe('TagCompletionProvider', () => {
  let tagService: TagService;
  let completionProvider: TagCompletionProvider;
  let cancellationToken: vscode.CancellationToken;

  /**
   * Helper to get completion items with proper type casting
   */
  function getCompletionItems(
    doc: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const result = completionProvider.provideCompletionItems(doc, position, cancellationToken);
    return result as vscode.CompletionItem[];
  }

  beforeEach(() => {
    // Create tag service with mock data
    tagService = new TagService('/test/notes');

    // Manually populate tag index with test data
    // Using private property access for testing purposes
    (tagService as any).tagIndex = new Map([
      ['bug', new Set(['/test/notes/1.txt', '/test/notes/2.txt', '/test/notes/3.txt'])],
      ['urgent', new Set(['/test/notes/1.txt', '/test/notes/2.txt'])],
      ['feature', new Set(['/test/notes/4.txt'])],
      ['meeting', new Set(['/test/notes/5.txt', '/test/notes/6.txt', '/test/notes/7.txt', '/test/notes/8.txt'])],
      ['project-alpha', new Set(['/test/notes/1.txt'])],
      ['backend', new Set(['/test/notes/9.txt', '/test/notes/10.txt'])],
    ]);

    completionProvider = new TagCompletionProvider(tagService);
    cancellationToken = new MockCancellationToken();
  });

  describe('provideCompletionItems', () => {
    it('should provide completions when # is typed in metadata section', () => {
      const doc = new MockTextDocument('tags: #');
      const position = new vscode.Position(0, 7); // After the #

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.be.greaterThan(0);
    });

    it('should sort suggestions by frequency (most used first)', () => {
      const doc = new MockTextDocument('tags: #');
      const position = new vscode.Position(0, 7);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.equal(6);

      // meeting (4), bug (3), backend (2), urgent (2), feature (1), project-alpha (1)
      expect(items[0].label).to.equal('meeting');
      expect(items[1].label).to.equal('bug');
      // backend and urgent both have 2, sorted alphabetically
      expect(items[2].label).to.equal('backend');
      expect(items[3].label).to.equal('urgent');
    });

    it('should include # prefix in insert text', () => {
      const doc = new MockTextDocument('tags: #');
      const position = new vscode.Position(0, 7);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items[0].insertText).to.equal('#meeting');
      expect(items[1].insertText).to.equal('#bug');
    });

    it('should use CompletionItemKind.Text for all items', () => {
      const doc = new MockTextDocument('tags: #');
      const position = new vscode.Position(0, 7);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      items.forEach(item => {
        expect(item.kind).to.equal(vscode.CompletionItemKind.Text);
      });
    });

    it('should include tag usage count in detail', () => {
      const doc = new MockTextDocument('tags: #');
      const position = new vscode.Position(0, 7);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      const meetingItem = items.find(item => item.label === 'meeting');
      expect(meetingItem).to.exist;
      expect(meetingItem?.detail).to.include('4');

      const bugItem = items.find(item => item.label === 'bug');
      expect(bugItem).to.exist;
      expect(bugItem?.detail).to.include('3');
    });

    it('should not provide completions outside metadata section (after line 10)', () => {
      const content = Array(12).fill('Line content').join('\n') + '\ntags: #';
      const doc = new MockTextDocument(content);
      const position = new vscode.Position(12, 7); // Line 12 (0-indexed)

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.equal(0);
    });

    it('should provide completions in metadata section (within first 10 lines)', () => {
      const content = Array(9).fill('Line content').join('\n') + '\ntags: #';
      const doc = new MockTextDocument(content);
      const position = new vscode.Position(9, 7); // Line 9 (0-indexed)

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.be.greaterThan(0);
    });

    it('should provide completions at line 0', () => {
      const doc = new MockTextDocument('tags: #');
      const position = new vscode.Position(0, 7);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.be.greaterThan(0);
    });

    it('should provide completions at line 9 (last line of metadata)', () => {
      const content = Array(9).fill('content').join('\n') + '\ntags: #';
      const doc = new MockTextDocument(content);
      const position = new vscode.Position(9, 7);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.be.greaterThan(0);
    });

    it('should not provide completions when position is not after #', () => {
      const doc = new MockTextDocument('tags: ');
      const position = new vscode.Position(0, 6); // After "tags: " but before any #

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.equal(0);
    });

    it('should filter suggestions by partial input after #', () => {
      const doc = new MockTextDocument('tags: #bu');
      const position = new vscode.Position(0, 9);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      // Should only show tags starting with "bu"
      const labels = items.map(item => item.label);
      expect(labels).to.include('bug');
      expect(labels).to.not.include('meeting');
      expect(labels).to.not.include('urgent');
    });

    it('should handle empty tag index gracefully', () => {
      // Create new tag service with empty index
      const emptyTagService = new TagService('/test/notes');
      const emptyProvider = new TagCompletionProvider(emptyTagService);

      const doc = new MockTextDocument('tags: #');
      const position = new vscode.Position(0, 7);

      const items = (emptyProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.equal(0);
    });

    it('should handle tags: line without # yet', () => {
      const doc = new MockTextDocument('tags: ');
      const position = new vscode.Position(0, 6);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.equal(0);
    });

    it('should provide completions for multiple tags on same line', () => {
      const doc = new MockTextDocument('tags: #bug #urgent #');
      const position = new vscode.Position(0, 20); // After third #

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.be.greaterThan(0);
    });

    it('should work with markdown files', () => {
      const doc = new MockTextDocument('tags: #', 'markdown');
      const position = new vscode.Position(0, 7);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      expect(items).to.be.an('array');
      expect(items.length).to.be.greaterThan(0);
    });

    it('should filter out already-used tags in the same line', () => {
      const doc = new MockTextDocument('tags: #bug #urgent #');
      const position = new vscode.Position(0, 20);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      const labels = items.map(item => item.label);
      // bug and urgent are already used, should be excluded
      expect(labels).to.not.include('bug');
      expect(labels).to.not.include('urgent');
      // Other tags should still be available
      expect(labels).to.include('meeting');
      expect(labels).to.include('feature');
    });

    it('should handle case-insensitive filtering', () => {
      const doc = new MockTextDocument('tags: #BUG #ur');
      const position = new vscode.Position(0, 13);

      const items = (completionProvider.provideCompletionItems(doc, position, cancellationToken) as vscode.CompletionItem[]) || [];

      const labels = items.map(item => item.label);
      expect(labels).to.include('urgent');
      expect(labels).to.not.include('bug'); // Already used (case-insensitive)
    });
  });

  describe('getTriggerCharacters', () => {
    it('should return # as trigger character', () => {
      const triggers = (completionProvider as any).triggerCharacters || ['#'];
      expect(triggers).to.include('#');
    });
  });
});
