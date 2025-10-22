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

    network.on('stabilizationProgress', function(params) {
        console.log('Stabilization progress:', Math.round(params.iterations / params.total * 100) + '%');
    });

    network.on('stabilizationIterationsDone', function() {
        console.log('Stabilization complete, physics will stay enabled for interactive movement');

        // Fit view after stabilization completes
        network.fit({
            animation: {
                duration: 1000,
                easingFunction: 'easeInOutQuad'
            }
        });

        // Keep physics enabled permanently for continuous interactive movement
        // Physics will continue to run when nodes are dragged or the graph is modified
    });

    // Fit immediately so the graph is visible
    setTimeout(() => {
        network.fit({ animation: false });
    }, 100);
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
                    gravitationalConstant: -30000,  // Strong repulsion but not excessive
                    centralGravity: 0.3,  // Moderate center attraction to keep nodes from spreading too far
                    springLength: 200,  // Moderate edge length for good spacing
                    springConstant: 0.04,  // Moderate spring stiffness for responsive movement
                    damping: 0.2,  // Moderate damping for smooth but visible movement
                    avoidOverlap: 0.5  // Moderate overlap avoidance
                },
                stabilization: {
                    enabled: true,
                    iterations: 300,  // Moderate iterations for visible animation
                    updateInterval: 1,  // Update visual every iteration for smooth animation
                    fit: false  // Don't fit during stabilization so we can see it
                },
                solver: 'barnesHut',
                adaptiveTimestep: true,
                timestep: 0.5  // Slower timestep for more visible physics
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
                direction: 'UD',  // Up-down for more compact vertical layout
                sortMethod: 'hubsize',  // Sort by number of connections instead of directed
                nodeSpacing: 150,  // Horizontal spacing between nodes
                levelSeparation: 150,  // Vertical separation between levels
                treeSpacing: 150,  // Spacing between separate trees
                blockShifting: true,  // Allow shifting blocks to reduce whitespace
                edgeMinimization: true,  // Minimize edge crossings
                parentCentralization: true,  // Center parent nodes over children
                shakeTowards: 'leaves'  // Compact layout towards leaf nodes
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

    // Update network data and options efficiently without destroying
    const options = getLayoutOptions(currentLayout);
    network.setOptions(options);
    network.setData({ nodes, edges });

    // Manually fit if physics is disabled, as stabilization events won't fire
    if (options.physics && options.physics.enabled === false) {
        network.fit();
    }

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
