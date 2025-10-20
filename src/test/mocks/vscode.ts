/**
 * Mock VS Code API for unit testing
 */

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2
}

export class Uri {
  static file(path: string): Uri {
    return new Uri(path);
  }

  constructor(public fsPath: string) {}

  toString(): string {
    return this.fsPath;
  }
}

export class ThemeIcon {
  constructor(public id: string) {}
}

export class TreeItem {
  label?: string;
  iconPath?: ThemeIcon;
  collapsibleState?: TreeItemCollapsibleState;
  resourceUri?: Uri;
  contextValue?: string;

  constructor(label: string, collapsibleState?: TreeItemCollapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}

export class EventEmitter<T> {
  private listeners: ((e: T) => any)[] = [];

  fire(data?: T): void {
    this.listeners.forEach(listener => listener(data as T));
  }

  get event(): (listener: (e: T) => any) => { dispose: () => void } {
    return (listener: (e: T) => any) => {
      this.listeners.push(listener);
      return {
        dispose: () => {
          const index = this.listeners.indexOf(listener);
          if (index > -1) {
            this.listeners.splice(index, 1);
          }
        }
      };
    };
  }
}

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3
}

export const workspace = {
  workspaceFolders: undefined as any,
  getConfiguration: (section: string) => ({
    get: (key: string, defaultValue?: any) => defaultValue,
    update: (key: string, value: any, target: ConfigurationTarget) => Promise.resolve()
  })
};

export const window = {
  showInputBox: () => Promise.resolve(''),
  showQuickPick: () => Promise.resolve(undefined),
  showInformationMessage: () => Promise.resolve(undefined),
  showWarningMessage: () => Promise.resolve(undefined),
  showErrorMessage: () => Promise.resolve(undefined),
  createStatusBarItem: () => ({
    show: () => undefined,
    hide: () => undefined,
    dispose: () => undefined
  })
};

export const commands = {
  executeCommand: (command: string, ...args: any[]) => Promise.resolve()
};

// Export Event class which is used by VS Code API
export class Event<T> {
  constructor(private listener: (e: T) => any) {}

  static None = new Event(() => undefined);
}

// Position class for text document positions
export class Position {
  constructor(public line: number, public character: number) {}
}

// Range class for text document ranges
export class Range {
  public start: Position;
  public end: Position;

  constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);
  constructor(start: Position, end: Position);
  constructor(
    startOrLine: Position | number,
    endOrCharacter: Position | number,
    endLine?: number,
    endCharacter?: number
  ) {
    if (typeof startOrLine === 'number' && typeof endOrCharacter === 'number') {
      this.start = new Position(startOrLine, endOrCharacter);
      this.end = new Position(endLine!, endCharacter!);
    } else {
      this.start = startOrLine as Position;
      this.end = endOrCharacter as Position;
    }
  }
}

// EndOfLine enum
export enum EndOfLine {
  LF = 1,
  CRLF = 2
}

// CompletionItemKind enum
export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17
}

// CompletionItem class
export class CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string | MarkdownString;
  insertText?: string;

  constructor(label: string, kind?: CompletionItemKind) {
    this.label = label;
    this.kind = kind;
  }
}

// MarkdownString class for formatted text
export class MarkdownString {
  value: string;
  isTrusted?: boolean;

  constructor(value?: string, isTrusted?: boolean) {
    this.value = value || '';
    this.isTrusted = isTrusted;
  }

  appendText(value: string): MarkdownString {
    this.value += value;
    return this;
  }

  appendMarkdown(value: string): MarkdownString {
    this.value += value;
    return this;
  }

  appendCodeblock(value: string, language?: string): MarkdownString {
    this.value += '```' + (language || '') + '\n' + value + '\n```\n';
    return this;
  }
}
