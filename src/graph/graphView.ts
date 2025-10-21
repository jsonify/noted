import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getNotesPath } from '../services/configService';
import { GraphService } from '../services/graphService';
import { LinkService } from '../services/linkService';

/**
 * Show the graph view webview
 */
export async function showGraphView(context: vscode.ExtensionContext, linkService: LinkService): Promise<void> {
    const notesPath = getNotesPath();
    if (!notesPath) {
        vscode.window.showErrorMessage('Please configure a notes folder first');
        return;
    }

    const graphService = new GraphService(linkService);

    // Build the graph data
    const graphData = await graphService.buildGraph();
    const stats = await graphService.getGraphStats();

    const panel = vscode.window.createWebviewPanel(
        'notedGraph',
        'Note Graph',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview')),
                vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))
            ]
        }
    );

    // Set the initial HTML
    panel.webview.html = await getGraphHtml(context, panel.webview, graphData, stats);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'openNote':
                    try {
                        const document = await vscode.workspace.openTextDocument(message.filePath);
                        await vscode.window.showTextDocument(document);
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to open note: ${error}`);
                    }
                    break;

                case 'search':
                    const searchResults = await graphService.searchNodes(message.query);
                    panel.webview.postMessage({
                        command: 'searchResults',
                        results: searchResults
                    });
                    break;

                case 'getConnected':
                    const connected = await graphService.getConnectedNodes(message.nodePath);
                    panel.webview.postMessage({
                        command: 'connectedNodes',
                        nodes: connected
                    });
                    break;

                case 'refresh':
                    // Rebuild the graph and update the view
                    const newGraphData = await graphService.buildGraph();
                    const newStats = await graphService.getGraphStats();
                    panel.webview.postMessage({
                        command: 'updateGraph',
                        graphData: newGraphData,
                        stats: newStats
                    });
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Generate the HTML content for the graph webview by loading external resources
 */
async function getGraphHtml(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    graphData: any,
    stats: any
): Promise<string> {
    // Get file paths
    const webviewPath = path.join(context.extensionPath, 'src', 'webview');
    const htmlPath = path.join(webviewPath, 'graph.html');
    const cssPath = path.join(webviewPath, 'graph.css');
    const jsPath = path.join(webviewPath, 'graph.js');

    // Find vis-network library
    const visNetworkPath = path.join(
        context.extensionPath,
        'node_modules',
        'vis-network',
        'dist',
        'vis-network.min.js'
    );

    // Create webview URIs for resources
    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(jsPath));
    const visNetworkUri = webview.asWebviewUri(vscode.Uri.file(visNetworkPath));

    // Read the HTML template
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Replace placeholders with actual values
    html = html
        .replace(/{{cspSource}}/g, webview.cspSource)
        .replace(/{{cssUri}}/g, cssUri.toString())
        .replace(/{{scriptUri}}/g, scriptUri.toString())
        .replace(/{{visNetworkUri}}/g, visNetworkUri.toString())
        .replace(/{{noteCount}}/g, stats.totalNotes.toString())
        .replace(/{{linkCount}}/g, stats.totalLinks.toString())
        .replace(/{{orphanCount}}/g, stats.orphanNotes.toString())
        .replace(/{{avgConnections}}/g, stats.averageConnections.toFixed(1))
        .replace(/{{totalNotes}}/g, graphData.totalNotes.toString())
        .replace(/{{noLinksClass}}/g, graphData.edges.length === 0 ? '' : 'hidden')
        .replace(/{{graphDataJson}}/g, JSON.stringify({ nodes: graphData.nodes, edges: graphData.edges }));

    return html;
}
