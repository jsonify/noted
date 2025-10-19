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

export const workspace = {
  workspaceFolders: undefined as any,
  getConfiguration: (section: string) => ({
    get: (key: string, defaultValue?: any) => defaultValue
  })
};
