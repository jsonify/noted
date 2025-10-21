import * as vscode from 'vscode';
import * as path from 'path';
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
            retainContextWhenHidden: true
        }
    );

    // Set the initial HTML
    panel.webview.html = getGraphHtml(graphData, stats);

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
 * Generate the HTML content for the graph webview
 */
function getGraphHtml(graphData: any, stats: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Note Graph</title>
    <script src="https://unpkg.com/vis-network@9.1.2/dist/vis-network.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            overflow: hidden;
        }

        #container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        #toolbar {
            background-color: var(--vscode-sideBar-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding: 12px;
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }

        #stats {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            display: flex;
            gap: 16px;
        }

        .stat-item {
            display: flex;
            gap: 4px;
        }

        .stat-label {
            opacity: 0.8;
        }

        #controls {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }

        input, select, button {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 6px 12px;
            border-radius: 2px;
            font-size: 13px;
            font-family: var(--vscode-font-family);
        }

        input:focus, select:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
            padding: 6px 14px;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        button:active {
            opacity: 0.8;
        }

        #searchBox {
            width: 250px;
        }

        #layoutSelect {
            min-width: 150px;
        }

        #filterSelect {
            min-width: 120px;
        }

        #graph {
            flex: 1;
            border: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-editor-background);
        }

        #legend {
            position: absolute;
            top: 70px;
            right: 20px;
            background-color: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            font-size: 12px;
            max-width: 200px;
        }

        #legend h3 {
            margin: 0 0 8px 0;
            font-size: 13px;
            font-weight: 600;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }

        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 1px solid var(--vscode-panel-border);
        }

        .legend-label {
            opacity: 0.9;
        }

        #tooltip {
            position: absolute;
            background-color: var(--vscode-editorHoverWidget-background);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            color: var(--vscode-editorHoverWidget-foreground);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            display: none;
            z-index: 1000;
            white-space: pre-line;
        }

        #noLinksMessage {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--vscode-editorWidget-background);
            border: 2px solid var(--vscode-inputValidation-infoBorder);
            padding: 24px;
            border-radius: 6px;
            max-width: 500px;
            text-align: center;
            z-index: 100;
        }

        #noLinksMessage h3 {
            margin: 0 0 12px 0;
            color: var(--vscode-textLink-foreground);
        }

        #noLinksMessage p {
            margin: 8px 0;
            line-height: 1.5;
        }

        #noLinksMessage code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }

        .hidden {
            display: none !important;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="toolbar">
            <div id="stats">
                <div class="stat-item">
                    <span class="stat-label">Notes:</span>
                    <span id="noteCount">${stats.totalNotes}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Links:</span>
                    <span id="linkCount">${stats.totalLinks}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Orphans:</span>
                    <span id="orphanCount">${stats.orphanNotes}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Connections:</span>
                    <span id="avgConnections">${stats.averageConnections.toFixed(1)}</span>
                </div>
            </div>

            <div id="controls">
                <input type="text" id="searchBox" placeholder="Search notes..." />

                <select id="layoutSelect">
                    <option value="force">Force-Directed</option>
                    <option value="hierarchical">Hierarchical</option>
                    <option value="circular">Circular</option>
                </select>

                <select id="filterSelect">
                    <option value="all">All Notes</option>
                    <option value="connected">Connected Only</option>
                    <option value="orphans">Orphans Only</option>
                </select>

                <button id="refreshBtn">Refresh</button>
                <button id="fitBtn">Fit View</button>
            </div>
        </div>

        <div id="graph"></div>

        <div id="noLinksMessage" class="${graphData.edges.length === 0 ? '' : 'hidden'}">
            <h3>No Links Found</h3>
            <p>Your notes are not connected yet. To create connections, add wiki-style links to your notes.</p>
            <p>Example: <code>[[note-name]]</code> or <code>[[2025-01-15]]</code></p>
            <p>All ${graphData.totalNotes} notes are currently shown as orphans. Click any node to open that note and start adding links!</p>
        </div>

        <div id="legend">
            <h3>Node Colors</h3>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #cccccc;"></div>
                <span class="legend-label">Orphan (no links)</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #69db7c;"></div>
                <span class="legend-label">1-2 connections</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #4dabf7;"></div>
                <span class="legend-label">3-5 connections</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #ffa500;"></div>
                <span class="legend-label">6-10 connections</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #ff6b6b;"></div>
                <span class="legend-label">10+ connections</span>
            </div>
        </div>
    </div>

    <div id="tooltip"></div>

    <script>
        const vscode = acquireVsCodeApi();

        // Graph data from the backend
        let allNodes = ${JSON.stringify(graphData.nodes)};
        let allEdges = ${JSON.stringify(graphData.edges)};
        let currentFilter = 'all';
        let searchQuery = '';

        // Create the network
        const container = document.getElementById('graph');
        let network = null;
        let currentLayout = 'force';

        // Initialize the graph
        initGraph();

        function initGraph() {
            const { nodes, edges } = getFilteredData();

            const data = {
                nodes: nodes,
                edges: edges
            };

            const options = getLayoutOptions(currentLayout);
            network = new vis.Network(container, data, options);

            // Event listeners
            network.on('click', function(params) {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    vscode.postMessage({
                        command: 'openNote',
                        filePath: nodeId
                    });
                }
            });

            network.on('hoverNode', function(params) {
                const node = allNodes.find(n => n.id === params.node);
                if (node) {
                    showTooltip(params.event, node.title);
                }
            });

            network.on('blurNode', function() {
                hideTooltip();
            });

            network.on('stabilizationIterationsDone', function() {
                network.setOptions({ physics: false });
            });

            // Fit the view to show all nodes after initialization
            setTimeout(() => {
                network.fit({
                    animation: {
                        duration: 500,
                        easingFunction: 'easeInOutQuad'
                    }
                });
            }, 100);
        }

        function getLayoutOptions(layout) {
            const { nodes, edges } = getFilteredData();
            const hasEdges = edges.length > 0;

            const baseOptions = {
                nodes: {
                    shape: 'dot',
                    font: {
                        color: 'var(--vscode-editor-foreground)',
                        size: 14,
                        face: 'var(--vscode-font-family)'
                    },
                    borderWidth: 2,
                    borderWidthSelected: 4,
                    color: {
                        border: 'var(--vscode-panel-border)',
                        highlight: {
                            border: 'var(--vscode-focusBorder)',
                            background: 'var(--vscode-list-activeSelectionBackground)'
                        }
                    }
                },
                edges: {
                    color: {
                        color: 'var(--vscode-editorIndentGuide-background)',
                        highlight: 'var(--vscode-focusBorder)'
                    },
                    smooth: {
                        type: 'continuous'
                    }
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    zoomView: true,
                    dragView: true
                },
                physics: {
                    enabled: hasEdges,
                    stabilization: {
                        iterations: 200,
                        updateInterval: 25
                    }
                }
            };

            if (layout === 'force') {
                if (hasEdges) {
                    baseOptions.layout = {
                        randomSeed: 42
                    };
                    baseOptions.physics = {
                        enabled: true,
                        barnesHut: {
                            gravitationalConstant: -2000,
                            centralGravity: 0.3,
                            springLength: 95,
                            springConstant: 0.04,
                            damping: 0.09,
                            avoidOverlap: 0.1
                        },
                        stabilization: {
                            iterations: 200,
                            updateInterval: 25
                        }
                    };
                } else {
                    // For orphan nodes without edges, use random layout without physics
                    baseOptions.layout = {
                        randomSeed: 42,
                        improvedLayout: true
                    };
                    baseOptions.physics = {
                        enabled: false
                    };
                }
            } else if (layout === 'hierarchical') {
                baseOptions.layout = {
                    hierarchical: {
                        direction: 'UD',
                        sortMethod: 'directed',
                        nodeSpacing: 150,
                        levelSeparation: 150
                    }
                };
                baseOptions.physics = {
                    enabled: false
                };
            } else if (layout === 'circular') {
                baseOptions.layout = {
                    randomSeed: 42
                };
                baseOptions.physics = {
                    enabled: true,
                    stabilization: {
                        enabled: true,
                        iterations: 1000
                    },
                    barnesHut: {
                        gravitationalConstant: -8000,
                        centralGravity: 0.5,
                        springLength: 200,
                        springConstant: 0.01,
                        damping: 0.09,
                        avoidOverlap: 0.5
                    }
                };
            }

            return baseOptions;
        }

        function getFilteredData() {
            let nodes = allNodes;
            let edges = allEdges;

            // Apply filter
            if (currentFilter === 'connected') {
                nodes = nodes.filter(n => !n.isOrphan);
                const nodeIds = new Set(nodes.map(n => n.id));
                edges = edges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
            } else if (currentFilter === 'orphans') {
                nodes = nodes.filter(n => n.isOrphan);
                edges = [];
            }

            // Apply search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                nodes = nodes.filter(n => n.label.toLowerCase().includes(query));
                const nodeIds = new Set(nodes.map(n => n.id));
                edges = edges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));
            }

            return { nodes, edges };
        }

        function updateGraph() {
            const { nodes, edges } = getFilteredData();
            network.setData({ nodes, edges });
            network.fit();

            // Update no links message visibility
            updateNoLinksMessage();
        }

        function updateNoLinksMessage() {
            const message = document.getElementById('noLinksMessage');
            if (allEdges.length === 0) {
                message.classList.remove('hidden');
            } else {
                message.classList.add('hidden');
            }
        }

        function showTooltip(event, text) {
            const tooltip = document.getElementById('tooltip');
            tooltip.textContent = text;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
            tooltip.style.display = 'block';
        }

        function hideTooltip() {
            document.getElementById('tooltip').style.display = 'none';
        }

        // Event listeners
        document.getElementById('searchBox').addEventListener('input', (e) => {
            searchQuery = e.target.value;
            updateGraph();
        });

        document.getElementById('layoutSelect').addEventListener('change', (e) => {
            currentLayout = e.target.value;
            network.destroy();
            initGraph();
        });

        document.getElementById('filterSelect').addEventListener('change', (e) => {
            currentFilter = e.target.value;
            updateGraph();
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });

        document.getElementById('fitBtn').addEventListener('click', () => {
            network.fit({
                animation: {
                    duration: 500,
                    easingFunction: 'easeInOutQuad'
                }
            });
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateGraph':
                    allNodes = message.graphData.nodes;
                    allEdges = message.graphData.edges;

                    // Update stats
                    document.getElementById('noteCount').textContent = message.stats.totalNotes;
                    document.getElementById('linkCount').textContent = message.stats.totalLinks;
                    document.getElementById('orphanCount').textContent = message.stats.orphanNotes;
                    document.getElementById('avgConnections').textContent = message.stats.averageConnections.toFixed(1);

                    updateGraph();
                    break;
            }
        });
    </script>
</body>
</html>`;
}
