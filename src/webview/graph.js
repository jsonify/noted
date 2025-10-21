// Get VS Code API
const vscode = acquireVsCodeApi();

// Graph data from the backend (injected via window.graphData)
let allNodes = window.graphData.nodes;
let allEdges = window.graphData.edges;
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
        // Keep physics enabled briefly to show repulsion, then disable
        setTimeout(() => {
            network.setOptions({ physics: false });
        }, 1000);

        // Fit view after stabilization completes
        network.fit({
            animation: {
                duration: 500,
                easingFunction: 'easeInOutQuad'
            }
        });
    });
}

function positionNodesCircularly(nodes) {
    const nodeCount = nodes.length;
    if (nodeCount === 0) return;

    // Calculate radius based on number of nodes to ensure good spacing
    const radius = Math.max(200, nodeCount * 30);
    const angleStep = (2 * Math.PI) / nodeCount;

    // Position each node on the circle
    nodes.forEach((node, index) => {
        const angle = index * angleStep;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
        node.fixed = { x: false, y: false };  // Allow dragging but start in circular position
    });
}

function getLayoutOptions(layout) {
    const { nodes, edges } = getFilteredData();
    const hasEdges = edges.length > 0;

    const baseOptions = {
        autoResize: true,
        height: '100%',
        width: '100%',
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
                enabled: true,
                iterations: 1000,
                updateInterval: 50,
                fit: true
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
                    gravitationalConstant: -15000,  // Much stronger repulsion
                    centralGravity: 0.05,  // Minimal center attraction
                    springLength: 250,  // Longer edges for more space
                    springConstant: 0.01,  // Very flexible edges
                    damping: 0.15,  // Higher damping for smoother movement
                    avoidOverlap: 1.0  // Maximum overlap avoidance
                },
                stabilization: {
                    enabled: true,
                    iterations: 1000,
                    updateInterval: 10,  // Update visual every 10 iterations
                    fit: true
                },
                solver: 'barnesHut',
                adaptiveTimestep: true,
                timestep: 0.5  // Slower timestep for smoother, more visible physics
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
        // Manually position nodes in a circular layout
        positionNodesCircularly(nodes);

        baseOptions.layout = {
            randomSeed: 42
        };
        baseOptions.physics = {
            enabled: false  // Disable physics to keep circular positions
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

    // Destroy and recreate the network to properly reinitialize physics
    network.destroy();
    initGraph();

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
