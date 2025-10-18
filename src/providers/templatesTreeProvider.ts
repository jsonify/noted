import * as vscode from 'vscode';
import { TreeItem } from './treeItems';

/**
 * Tree data provider for templates view
 * Currently empty - templates are shown via viewsWelcome in package.json
 */
export class TemplatesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
    }

    // Return empty array - templates are shown via viewsWelcome
    getChildren(_element?: TreeItem): Thenable<TreeItem[]> {
        return Promise.resolve([]);
    }
}
