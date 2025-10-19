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

  event(listener: (e: T) => any): { dispose: () => void } {
    this.listeners.push(listener);
    return {
      dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      }
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

// Export Event class which is used by VS Code API
export class Event<T> {
  constructor(private listener: (e: T) => any) {}

  static None = new Event(() => undefined);
}
