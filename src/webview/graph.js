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

// Graph customization settings
let graphSettings = {
    nodeSize: 20,
    nodeBorderWidth: 2,
    nodeShape: 'dot',
    nodeShadow: true,
    edgeWidth: 2,
    edgeColor: '#e83e8c',
    edgeStyle: 'continuous',
    edgeArrows: true,
    springLength: 200,
    repulsion: 30000,
    gravity: 0.3,
    colors: {
        orphan: '#cccccc',
        lowConn: '#69db7c',
        medConn: '#4dabf7',
        highConn: '#ffa500',
        veryHighConn: '#ff6b6b'
    }
};

// Load saved settings
const savedState = vscode.getState();
if (savedState && savedState.graphSettings) {
    graphSettings = { ...graphSettings, ...savedState.graphSettings };
}

// Initialize the graph
initGraph();

// Get custom node color based on connection count
function getCustomNodeColor(isOrphan, linkCount) {
    if (isOrphan) {
        return graphSettings.colors.orphan;
    } else if (linkCount > 10) {
        return graphSettings.colors.veryHighConn;
    } else if (linkCount > 5) {
        return graphSettings.colors.highConn;
    } else if (linkCount > 2) {
        return graphSettings.colors.medConn;
    } else {
        return graphSettings.colors.lowConn;
    }
}

function initGraph() {
    const { nodes, edges } = getFilteredData();

    // Apply custom colors to nodes
    const coloredNodes = nodes.map(node => ({
        ...node,
        color: getCustomNodeColor(node.isOrphan, node.linkCount)
    }));

    const data = {
        nodes: coloredNodes,
        edges: edges
    };

    const options = getLayoutOptions(currentLayout);
    network = new vis.Network(container, data, options);

    // Event listeners
    network.on('click', function(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];

            // Highlight connected nodes
            highlightConnectedNodes(nodeId);

            vscode.postMessage({
                command: 'openNote',
                filePath: nodeId
            });
        } else {
            // Clicked on canvas, clear highlights
            clearHighlights();
        }
    });

    network.on('hoverNode', function(params) {
        const node = allNodes.find(n => n.id === params.node);
        if (node) {
            const connections = allEdges.filter(e => e.from === node.id || e.to === node.id).length;
            const tooltipText = `${node.title}\n${connections} connection${connections !== 1 ? 's' : ''}\nClick to open`;
            showTooltip(params.event, tooltipText);
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
            shape: graphSettings.nodeShape,
            size: graphSettings.nodeSize,
            font: {
                color: 'var(--vscode-editor-foreground)',
                size: 14,
                face: 'var(--vscode-font-family)'
            },
            borderWidth: graphSettings.nodeBorderWidth,
            borderWidthSelected: graphSettings.nodeBorderWidth + 2,
            shadow: graphSettings.nodeShadow ? {
                enabled: true,
                color: 'rgba(0,0,0,0.3)',
                size: 10,
                x: 2,
                y: 2
            } : {
                enabled: false
            },
            color: {
                border: '#666666',
                highlight: {
                    border: '#ff69b4',
                    background: 'var(--vscode-list-activeSelectionBackground)'
                },
                hover: {
                    border: '#ff69b4',
                    background: 'var(--vscode-list-hoverBackground)'
                }
            }
        },
        edges: {
            width: graphSettings.edgeWidth,
            color: {
                color: graphSettings.edgeColor,
                highlight: '#ff69b4',
                hover: '#ff69b4',
                opacity: 0.6
            },
            smooth: {
                type: graphSettings.edgeStyle === 'straight' ? false : graphSettings.edgeStyle,
                roundness: 0.5
            },
            arrows: graphSettings.edgeArrows ? {
                to: {
                    enabled: true,
                    scaleFactor: 0.5
                }
            } : {
                to: { enabled: false }
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
                    gravitationalConstant: -graphSettings.repulsion,
                    centralGravity: graphSettings.gravity,
                    springLength: graphSettings.springLength,
                    springConstant: 0.04,
                    damping: 0.2,
                    avoidOverlap: 0.5
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

    // Apply custom colors to nodes
    const coloredNodes = nodes.map(node => ({
        ...node,
        color: getCustomNodeColor(node.isOrphan, node.linkCount)
    }));

    // Update network data and options efficiently without destroying
    const options = getLayoutOptions(currentLayout);
    network.setOptions(options);
    network.setData({ nodes: coloredNodes, edges });

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

// Highlight connected nodes
function highlightConnectedNodes(nodeId) {
    const connectedNodeIds = new Set();
    connectedNodeIds.add(nodeId);

    // Find all edges connected to this node
    const connectedEdges = allEdges.filter(e => e.from === nodeId || e.to === nodeId);

    // Add all connected nodes
    connectedEdges.forEach(edge => {
        connectedNodeIds.add(edge.from);
        connectedNodeIds.add(edge.to);
    });

    // Update node opacity based on connection
    const updateNodes = allNodes.map(node => {
        const customColor = getCustomNodeColor(node.isOrphan, node.linkCount);
        if (connectedNodeIds.has(node.id)) {
            return { ...node, color: customColor, opacity: 1.0 };
        } else {
            return { ...node, color: customColor, opacity: 0.2 };
        }
    });

    // Update edge opacity
    const updateEdges = allEdges.map(edge => {
        if (edge.from === nodeId || edge.to === nodeId) {
            return { ...edge, color: { color: '#ff69b4', opacity: 1.0 }, width: 3 };
        } else {
            return { ...edge, color: { color: graphSettings.edgeColor, opacity: 0.1 }, width: 1 };
        }
    });

    network.setData({ nodes: updateNodes, edges: updateEdges });
}

// Clear all highlights
function clearHighlights() {
    const { nodes, edges } = getFilteredData();

    // Apply custom colors to nodes
    const coloredNodes = nodes.map(node => ({
        ...node,
        color: getCustomNodeColor(node.isOrphan, node.linkCount)
    }));

    network.setData({ nodes: coloredNodes, edges });
}

// Customization Panel Functions
function initializeCustomizationPanel() {
    // Load current settings into UI
    document.getElementById('nodeSize').value = graphSettings.nodeSize;
    document.getElementById('nodeSizeValue').textContent = graphSettings.nodeSize;
    document.getElementById('nodeBorderWidth').value = graphSettings.nodeBorderWidth;
    document.getElementById('nodeBorderWidthValue').textContent = graphSettings.nodeBorderWidth;
    document.getElementById('nodeShape').value = graphSettings.nodeShape;
    document.getElementById('nodeShadow').checked = graphSettings.nodeShadow;

    document.getElementById('edgeWidth').value = graphSettings.edgeWidth;
    document.getElementById('edgeWidthValue').textContent = graphSettings.edgeWidth;
    document.getElementById('edgeColor').value = graphSettings.edgeColor;
    document.getElementById('edgeStyle').value = graphSettings.edgeStyle;
    document.getElementById('edgeArrows').checked = graphSettings.edgeArrows;

    document.getElementById('springLength').value = graphSettings.springLength;
    document.getElementById('springLengthValue').textContent = graphSettings.springLength;
    document.getElementById('repulsion').value = graphSettings.repulsion;
    document.getElementById('repulsionValue').textContent = graphSettings.repulsion;
    document.getElementById('gravity').value = Math.round(graphSettings.gravity * 100);
    document.getElementById('gravityValue').textContent = graphSettings.gravity.toFixed(2);

    document.getElementById('orphanColor').value = graphSettings.colors.orphan;
    document.getElementById('lowConnColor').value = graphSettings.colors.lowConn;
    document.getElementById('medConnColor').value = graphSettings.colors.medConn;
    document.getElementById('highConnColor').value = graphSettings.colors.highConn;
    document.getElementById('veryHighConnColor').value = graphSettings.colors.veryHighConn;

    // Add live preview for range sliders
    document.getElementById('nodeSize').addEventListener('input', (e) => {
        document.getElementById('nodeSizeValue').textContent = e.target.value;
    });
    document.getElementById('nodeBorderWidth').addEventListener('input', (e) => {
        document.getElementById('nodeBorderWidthValue').textContent = e.target.value;
    });
    document.getElementById('edgeWidth').addEventListener('input', (e) => {
        document.getElementById('edgeWidthValue').textContent = e.target.value;
    });
    document.getElementById('springLength').addEventListener('input', (e) => {
        document.getElementById('springLengthValue').textContent = e.target.value;
    });
    document.getElementById('repulsion').addEventListener('input', (e) => {
        document.getElementById('repulsionValue').textContent = e.target.value;
    });
    document.getElementById('gravity').addEventListener('input', (e) => {
        document.getElementById('gravityValue').textContent = (e.target.value / 100).toFixed(2);
    });
}

function applyCustomizations() {
    // Read values from UI
    graphSettings.nodeSize = parseInt(document.getElementById('nodeSize').value);
    graphSettings.nodeBorderWidth = parseInt(document.getElementById('nodeBorderWidth').value);
    graphSettings.nodeShape = document.getElementById('nodeShape').value;
    graphSettings.nodeShadow = document.getElementById('nodeShadow').checked;

    graphSettings.edgeWidth = parseInt(document.getElementById('edgeWidth').value);
    graphSettings.edgeColor = document.getElementById('edgeColor').value;
    graphSettings.edgeStyle = document.getElementById('edgeStyle').value;
    graphSettings.edgeArrows = document.getElementById('edgeArrows').checked;

    graphSettings.springLength = parseInt(document.getElementById('springLength').value);
    graphSettings.repulsion = parseInt(document.getElementById('repulsion').value);
    graphSettings.gravity = parseInt(document.getElementById('gravity').value) / 100;

    graphSettings.colors.orphan = document.getElementById('orphanColor').value;
    graphSettings.colors.lowConn = document.getElementById('lowConnColor').value;
    graphSettings.colors.medConn = document.getElementById('medConnColor').value;
    graphSettings.colors.highConn = document.getElementById('highConnColor').value;
    graphSettings.colors.veryHighConn = document.getElementById('veryHighConnColor').value;

    // Save settings to state
    vscode.setState({ ...vscode.getState(), graphSettings });

    // Rebuild graph with new settings
    network.destroy();
    initGraph();

    // Update legend colors
    updateLegendColors();

    // Close panel
    document.getElementById('customizePanel').classList.add('hidden');
}

function resetToDefaults() {
    graphSettings = {
        nodeSize: 20,
        nodeBorderWidth: 2,
        nodeShape: 'dot',
        nodeShadow: true,
        edgeWidth: 2,
        edgeColor: '#e83e8c',
        edgeStyle: 'continuous',
        edgeArrows: true,
        springLength: 200,
        repulsion: 30000,
        gravity: 0.3,
        colors: {
            orphan: '#cccccc',
            lowConn: '#69db7c',
            medConn: '#4dabf7',
            highConn: '#ffa500',
            veryHighConn: '#ff6b6b'
        }
    };

    // Update UI
    initializeCustomizationPanel();

    // Save and apply
    vscode.setState({ ...vscode.getState(), graphSettings });
    network.destroy();
    initGraph();
    updateLegendColors();
}

function updateLegendColors() {
    const legendItems = document.querySelectorAll('.legend-color');
    if (legendItems.length >= 6) {
        legendItems[0].style.backgroundColor = graphSettings.colors.orphan;
        legendItems[1].style.backgroundColor = graphSettings.colors.lowConn;
        legendItems[2].style.backgroundColor = graphSettings.colors.medConn;
        legendItems[3].style.backgroundColor = graphSettings.colors.highConn;
        legendItems[4].style.backgroundColor = graphSettings.colors.veryHighConn;
        legendItems[5].style.backgroundColor = graphSettings.edgeColor;
    }
}

// Initialize customization panel on load
initializeCustomizationPanel();

// Customization panel event listeners
document.getElementById('customizeBtn').addEventListener('click', () => {
    document.getElementById('customizePanel').classList.remove('hidden');
});

document.getElementById('closePanelBtn').addEventListener('click', () => {
    document.getElementById('customizePanel').classList.add('hidden');
});

document.getElementById('applySettingsBtn').addEventListener('click', applyCustomizations);
document.getElementById('resetDefaultsBtn').addEventListener('click', resetToDefaults);
