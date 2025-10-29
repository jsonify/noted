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

    // Get user configuration settings
    const config = vscode.workspace.getConfiguration('noted');
    const graphConfig = {
        fontSize: config.get('graph.style.fontSize', 12),
        titleMaxLength: config.get('graph.titleMaxLength', 24),
        chargeStrength: config.get('graph.physics.chargeStrength', -120),
        linkDistance: config.get('graph.physics.linkDistance', 50),
        collisionPadding: config.get('graph.physics.collisionPadding', 1.5)
    };

    const panel = vscode.window.createWebviewPanel(
        'notedGraph',
        'Note Graph',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))
            ]
        }
    );

    // Set the initial HTML
    panel.webview.html = await getGraphHtml(context, panel.webview, graphData, stats, graphConfig);

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
    stats: any,
    graphConfig: any
): Promise<string> {
    // Get file paths
    const webviewPath = path.join(context.extensionPath, 'src', 'webview');
    const htmlPath = path.join(webviewPath, 'graph.html');
    const cssPath = path.join(webviewPath, 'graph.css');
    const jsPath = path.join(webviewPath, 'graph.js');

    // Find force-graph and d3 libraries (bundled with extension)
    const forceGraphPath = path.join(
        webviewPath,
        'lib',
        'force-graph.min.js'
    );
    const d3Path = path.join(
        webviewPath,
        'lib',
        'd3.v6.min.js'
    );

    // Create webview URIs for resources
    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(jsPath));
    const forceGraphUri = webview.asWebviewUri(vscode.Uri.file(forceGraphPath));
    const d3Uri = webview.asWebviewUri(vscode.Uri.file(d3Path));

    // Read the HTML template
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Replace placeholders with actual values
    html = html
        .replace(/{{cspSource}}/g, webview.cspSource)
        .replace(/{{cssUri}}/g, cssUri.toString())
        .replace(/{{scriptUri}}/g, scriptUri.toString())
        .replace(/{{forceGraphUri}}/g, forceGraphUri.toString())
        .replace(/{{d3Uri}}/g, d3Uri.toString())
        .replace(/{{noteCount}}/g, stats.totalNotes.toString())
        .replace(/{{tagCount}}/g, graphData.totalTags.toString())
        .replace(/{{linkCount}}/g, stats.totalLinks.toString())
        .replace(/{{orphanCount}}/g, stats.orphanNotes.toString())
        .replace(/{{graphDataJson}}/g, JSON.stringify({ nodes: graphData.nodes, links: graphData.links }))
        .replace(/{{graphConfigJson}}/g, JSON.stringify(graphConfig));

    return html;
}
