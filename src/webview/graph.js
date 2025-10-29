/**
 * Noted Graph Visualization
 * Based on force-graph library with custom canvas rendering
 */

// State management
const state = {
    selectedNodes: new Set(),
    hoverNode: null,
    focusNodes: new Set(),
    focusLinks: new Set(),
    graph: {
        nodes: [],
        links: []
    },
    filteredData: {
        nodes: [],
        links: []
    },
    filters: {
        showNotes: true,
        showTags: true,
        showPlaceholders: true,
        showOrphans: true
    },
    // Transition state for smooth animations
    nodeOpacities: new Map(), // Current opacity for each node
    targetOpacities: new Map(), // Target opacity for each node
    animating: false,
    // View state for preserving zoom/pan
    viewState: null,
    isInitialLoad: true
};

// Colors (match CSS variables with better depth)
const colors = {
    note: '#69db7c',
    tag: '#ff922b',
    placeholder: '#e599f7',
    orphan: '#adb5bd',
    link: 'rgba(180, 180, 200, 0.25)',        // Subtle but visible links
    linkHighlight: 'rgba(255, 146, 43, 0.8)', // Brighter highlight
    text: '#e4e4e4'                           // Slightly softer white
};

// Graph instance
let graph = null;

// Particle system for background
const particleSystem = {
    particles: [],
    canvas: null,
    ctx: null,
    animationId: null,
    transform: { k: 1, x: 0, y: 0 } // Camera transform (zoom and pan)
};

/**
 * Initialize particle system for background universe effect
 */
function initParticles() {
    const container = document.getElementById('graph');
    if (!container) {
        console.warn('Graph container not found, particles not initialized');
        return;
    }

    // Create canvas for particles (styles applied via CSS)
    particleSystem.canvas = document.createElement('canvas');
    particleSystem.canvas.id = 'particle-canvas';

    // Append after all other children to be on top
    container.appendChild(particleSystem.canvas);
    particleSystem.ctx = particleSystem.canvas.getContext('2d');

    // Set canvas size
    resizeParticleCanvas();

    // Create particles
    const particleCount = 200; // Number of particles
    for (let i = 0; i < particleCount; i++) {
        particleSystem.particles.push(createParticle());
    }

    // Start animation
    animateParticles();

    // Handle resize
    window.addEventListener('resize', resizeParticleCanvas);
}

/**
 * Resize particle canvas to match container
 */
function resizeParticleCanvas() {
    if (!particleSystem.canvas) return;

    const container = document.getElementById('graph');
    particleSystem.canvas.width = container.clientWidth;
    particleSystem.canvas.height = container.clientHeight;
}

/**
 * Create a single particle in world coordinates
 */
function createParticle() {
    // Create particles in a large world space (-2000 to 2000 in each direction)
    // This matches the typical scale of the force-graph coordinate system
    const worldSize = 4000;
    const worldOffset = -2000;

    return {
        x: Math.random() * worldSize + worldOffset, // World X coordinate
        y: Math.random() * worldSize + worldOffset, // World Y coordinate
        size: Math.random() * 2 + 1, // Size between 1 and 3
        vx: (Math.random() - 0.5) * 0.5, // Horizontal velocity in world space
        vy: (Math.random() - 0.5) * 0.5, // Vertical velocity in world space
        opacity: Math.random() * 0.6 + 0.2, // Opacity between 0.2 and 0.8
        twinkleSpeed: Math.random() * 0.02 + 0.01, // Twinkle speed
        twinklePhase: Math.random() * Math.PI * 2 // Random starting phase
    };
}

/**
 * Animate particles
 */
function animateParticles() {
    if (!particleSystem.ctx || !particleSystem.canvas) {
        return;
    }

    const ctx = particleSystem.ctx;
    const canvas = particleSystem.canvas;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current graph transform
    if (graph) {
        const zoom = graph.zoom();
        const centerPos = graph.centerAt();
        if (centerPos && zoom) {
            particleSystem.transform.k = zoom;
            particleSystem.transform.x = centerPos.x;
            particleSystem.transform.y = centerPos.y;
        }
    }

    // Save context state
    ctx.save();

    // Apply camera transformation to match graph view
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const k = particleSystem.transform.k;
    const tx = particleSystem.transform.x;
    const ty = particleSystem.transform.y;

    // Transform: translate to center, scale, translate by camera offset
    ctx.translate(centerX, centerY);
    ctx.scale(k, k);
    ctx.translate(-tx, -ty);

    // Update and draw each particle
    particleSystem.particles.forEach(particle => {
        // Update position in world space
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges in world space
        const worldBounds = 2000;
        if (particle.x < -worldBounds) particle.x = worldBounds;
        if (particle.x > worldBounds) particle.x = -worldBounds;
        if (particle.y < -worldBounds) particle.y = worldBounds;
        if (particle.y > worldBounds) particle.y = -worldBounds;

        // Update twinkle effect
        particle.twinklePhase += particle.twinkleSpeed;
        const twinkle = Math.sin(particle.twinklePhase) * 0.3 + 0.7; // Oscillate between 0.4 and 1.0

        // Draw particle with glow effect
        const finalOpacity = particle.opacity * twinkle;

        // Outer glow (scale with zoom for consistency)
        ctx.shadowBlur = 4 / k;
        ctx.shadowColor = `rgba(150, 180, 255, ${finalOpacity * 0.8})`;

        // Draw particle (size scaled for zoom)
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size / k, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 235, 255, ${finalOpacity})`;
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
    });

    // Restore context state
    ctx.restore();

    // Continue animation
    particleSystem.animationId = requestAnimationFrame(animateParticles);
}

/**
 * Stop particle animation
 */
function stopParticles() {
    if (particleSystem.animationId) {
        cancelAnimationFrame(particleSystem.animationId);
        particleSystem.animationId = null;
    }
}

/**
 * Get node state based on hover/focus
 */
function getNodeState(nodeId) {
    if (state.selectedNodes.has(nodeId) || state.hoverNode === nodeId) {
        return 'highlighted';
    }
    if (state.focusNodes.size === 0) {
        return 'regular';
    }
    return state.focusNodes.has(nodeId) ? 'regular' : 'lessened';
}

/**
 * Get current animated opacity for a node
 */
function getNodeOpacity(nodeId) {
    const nodeState = getNodeState(nodeId);

    // If not animating, return immediate opacity
    if (!state.animating) {
        // Foam-like aggressive dimming: almost invisible when not in focus
        return nodeState === 'lessened' ? 0.02 : 1.0;
    }

    // Return current animated opacity
    return state.nodeOpacities.get(nodeId) || 1.0;
}

/**
 * Get link state based on focus
 */
function getLinkState(linkId) {
    if (state.focusNodes.size === 0) {
        return 'regular';
    }
    return state.focusLinks.has(linkId) ? 'highlighted' : 'lessened';
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get connection count for a node
 */
function getNodeConnectionCount(nodeId) {
    let count = 0;
    state.graph.links.forEach(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        if (sourceId === nodeId || targetId === nodeId) {
            count++;
        }
    });
    return count;
}

/**
 * Check if a node should show its label
 * Default: show all labels
 * On hover: only show hovered node + connected nodes
 */
function shouldShowLabel(nodeId) {
    const nodeState = getNodeState(nodeId);

    // If nothing is hovered or selected, show all labels
    if (state.focusNodes.size === 0) {
        return true;
    }

    // Something is hovered/selected - only show labels for nodes in focus
    return state.focusNodes.has(nodeId) || nodeState === 'highlighted';
}

// Painter class removed - force-graph now handles node rendering

/**
 * Initialize the graph visualization
 */
function initGraph() {
    // Load graph data from window.graphData
    state.graph.nodes = window.graphData.nodes || [];
    state.graph.links = window.graphData.links || [];

    // Load user configuration
    const userConfig = window.graphConfig || {};
    const fontSize = userConfig.fontSize || 11;  // Small, constant size like Foam
    const titleMaxLength = userConfig.titleMaxLength || 24;

    // Node size scaling factor (Foam-like: smaller nodes)
    const NODE_REL_SIZE = 0.5;

    // Calculate adaptive physics based on graph density
    const nodeCount = state.graph.nodes.length;
    const isDenseGraph = nodeCount > 50;

    // Use user config with adaptive defaults
    const SIMULATION_CONFIG = {
        CHARGE_STRENGTH: userConfig.chargeStrength || (isDenseGraph ? -180 : -120),
        LINK_DISTANCE: userConfig.linkDistance || (isDenseGraph ? 70 : 50),
        LINK_STRENGTH: 0.5,
        CENTER_STRENGTH: 0.05,
        COLLISION_RADIUS_MULTIPLIER: userConfig.collisionPadding || (isDenseGraph ? 2.5 : 1.5),
        COOLDOWN_TICKS: 200
    };

    // Store config in state for later use
    state.config = {
        fontSize,
        titleMaxLength,
        simulation: SIMULATION_CONFIG
    };

    // Apply initial filters
    updateFilters();

    // Create force-graph instance
    const container = document.getElementById('graph');

    graph = ForceGraph()(container)
        .graphData(state.filteredData)
        .nodeId('id')
        .nodeLabel(node => node.title || node.label)
        .nodeVal('val')
        .nodeRelSize(NODE_REL_SIZE)
        .nodeColor(node => {
            const opacity = getNodeOpacity(node.id);
            return hexToRgba(node.color, opacity);
        })
        .nodeCanvasObject((node, ctx, globalScale) => {
            // Only draw labels, let force-graph handle the nodes
            const { x, y, val } = node;
            const radius = Math.sqrt(val) * NODE_REL_SIZE * 0.8;
            const nodeState = getNodeState(node.id);

            // Check if this label should be shown (hover-to-reveal system)
            if (!shouldShowLabel(node.id)) {
                return; // Don't render label
            }

            // Determine label opacity based on node state
            let labelOpacity = 1.0;
            if (nodeState === 'lessened') {
                labelOpacity = 0.15; // Very dimmed in lessened state (Foam-like)
            }

            // Truncate label based on config
            let label = node.label;
            const maxLength = state.config.titleMaxLength;
            if (label.length > maxLength) {
                label = label.substring(0, maxLength) + '...';
            }

            // Use small, constant font size for all labels (Foam-like)
            const fontSize = state.config.fontSize;

            // Calculate label position offset from node center (in world coordinates)
            const labelOffsetY = radius + 10;

            // Save canvas state
            ctx.save();

            // Translate to label position in world coordinates
            ctx.translate(x, y - labelOffsetY);

            // Counter-scale to screen space so text stays constant size
            ctx.scale(1 / globalScale, 1 / globalScale);

            // Set font - normal weight for all labels
            ctx.font = `400 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = labelOpacity;

            // Enhanced text shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 1;

            // Draw the label at origin (we already translated)
            ctx.fillStyle = colors.text;
            ctx.fillText(label, 0, 0);

            // Restore canvas state
            ctx.restore();
        })
        .nodeCanvasObjectMode(() => 'after')
        .linkSource('source')
        .linkTarget('target')
        .linkColor(link => {
            const linkId = getLinkId(link);
            const linkState = getLinkState(linkId);

            switch (linkState) {
                case 'highlighted':
                    return colors.linkHighlight;
                case 'lessened':
                    return 'rgba(180, 180, 200, 0.03)'; // Very faded
                case 'regular':
                default:
                    return colors.link;
            }
        })
        .linkWidth(link => {
            const isHighlighted = state.focusLinks.has(getLinkId(link));
            return isHighlighted ? 2.5 : (link.value || 1);
        })
        .linkDirectionalParticles(link => {
            const isHighlighted = state.focusLinks.has(getLinkId(link));
            return isHighlighted ? 2 : 0;
        })
        .linkDirectionalParticleWidth(3)          // Slightly thicker particles
        .linkDirectionalParticleSpeed(0.005) // Half the default speed (default is ~0.01)
        .onNodeHover(node => {
            state.hoverNode = node ? node.id : null;
            updateFocusState();
        })
        .onNodeClick((node, event) => {
            if (event.shiftKey) {
                // Multi-select with Shift
                if (state.selectedNodes.has(node.id)) {
                    state.selectedNodes.delete(node.id);
                } else {
                    state.selectedNodes.add(node.id);
                }
                updateFocusState();
            } else {
                // Single click - open note
                if (node.type === 'note') {
                    window.vscode.postMessage({
                        command: 'openNote',
                        filePath: node.id
                    });
                }
            }
        })
        .onBackgroundClick(() => {
            // Clear selection on background click
            state.selectedNodes.clear();
            updateFocusState();
        })

        // Force simulation - adaptive spacing based on graph density
        .d3Force('charge', d3.forceManyBody().strength(SIMULATION_CONFIG.CHARGE_STRENGTH))
        .d3Force('link', d3.forceLink().distance(SIMULATION_CONFIG.LINK_DISTANCE).strength(SIMULATION_CONFIG.LINK_STRENGTH))
        .d3Force('center', d3.forceCenter().strength(SIMULATION_CONFIG.CENTER_STRENGTH))
        .d3Force('collision', d3.forceCollide(node => {
            // Collision radius based on visual node size with adaptive padding
            const radius = Math.sqrt(node.val) * NODE_REL_SIZE * 0.8;
            return radius * SIMULATION_CONFIG.COLLISION_RADIUS_MULTIPLIER;
        }))
        .d3Force('x', d3.forceX().strength(0.02))
        .d3Force('y', d3.forceY().strength(0.02))
        .cooldownTicks(SIMULATION_CONFIG.COOLDOWN_TICKS)
        .onEngineStop(() => {
            // Zoom to fit only on initial load
            if (state.isInitialLoad) {
                graph.zoomToFit(400, 80);
                state.isInitialLoad = false;
            }
        });
}

/**
 * Animate opacity transitions
 */
function animateOpacities() {
    if (!state.animating || !graph) {
        return;
    }

    let stillAnimating = false;
    const OPACITY_TRANSITION_SPEED = 0.15;
    const transitionSpeed = OPACITY_TRANSITION_SPEED; // How fast to transition (0-1, higher = faster)

    // Update each node's opacity
    state.targetOpacities.forEach((targetOpacity, nodeId) => {
        const currentOpacity = state.nodeOpacities.get(nodeId) || 1.0;
        const diff = targetOpacity - currentOpacity;

        if (Math.abs(diff) > 0.001) {
            // Lerp toward target
            const newOpacity = currentOpacity + (diff * transitionSpeed);
            state.nodeOpacities.set(nodeId, newOpacity);
            stillAnimating = true;
        } else {
            // Close enough, snap to target
            state.nodeOpacities.set(nodeId, targetOpacity);
        }
    });

    if (stillAnimating) {
        // Trigger re-render by updating node colors
        graph.nodeColor(graph.nodeColor());

        // Continue animation
        requestAnimationFrame(animateOpacities);
    } else {
        state.animating = false;
    }
}

/**
 * Update focus state (highlighted nodes and links)
 */
function updateFocusState() {
    state.focusNodes.clear();
    state.focusLinks.clear();

    // Build focus set from hover and selections
    const focusIds = new Set();
    if (state.hoverNode) {
        focusIds.add(state.hoverNode);
    }
    state.selectedNodes.forEach(id => focusIds.add(id));

    // Add neighbors to focus
    focusIds.forEach(nodeId => {
        state.focusNodes.add(nodeId);

        // Find connected nodes and links
        state.graph.links.forEach(link => {
            if (link.source.id === nodeId || link.source === nodeId) {
                const targetId = link.target.id || link.target;
                state.focusNodes.add(targetId);
                state.focusLinks.add(getLinkId(link));
            }
            if (link.target.id === nodeId || link.target === nodeId) {
                const sourceId = link.source.id || link.source;
                state.focusNodes.add(sourceId);
                state.focusLinks.add(getLinkId(link));
            }
        });
    });

    // Set target opacities for all nodes
    state.targetOpacities.clear();
    state.filteredData.nodes.forEach(node => {
        const nodeState = getNodeState(node.id);
        // Foam-like aggressive dimming: almost invisible when not in focus
        const targetOpacity = nodeState === 'lessened' ? 0.02 : 1.0;
        state.targetOpacities.set(node.id, targetOpacity);

        // Initialize current opacity if not set
        if (!state.nodeOpacities.has(node.id)) {
            state.nodeOpacities.set(node.id, 1.0);
        }
    });

    // Start animation if not already running
    if (!state.animating) {
        state.animating = true;
        requestAnimationFrame(animateOpacities);
    }

    // Update links immediately (no animation for links)
    if (graph) {
        graph.linkColor(graph.linkColor());
        graph.linkWidth(graph.linkWidth());
        graph.linkDirectionalParticles(graph.linkDirectionalParticles());
    }
}

/**
 * Get unique link ID
 */
function getLinkId(link) {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    return `${sourceId}->${targetId}`;
}

/**
 * Update filters and refresh graph
 */
function updateFilters() {
    const filteredNodes = state.graph.nodes.filter(node => {
        // Filter by type
        if (node.type === 'note' && !state.filters.showNotes) return false;
        if (node.type === 'tag' && !state.filters.showTags) return false;
        if (node.type === 'placeholder' && !state.filters.showPlaceholders) return false;

        // Filter orphans
        if (node.isOrphan && !state.filters.showOrphans) return false;

        return true;
    });

    // Create a set of visible node IDs
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));

    // Filter links - only show if both source and target are visible
    const filteredLinks = state.graph.links.filter(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;
        return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    state.filteredData = {
        nodes: filteredNodes,
        links: filteredLinks
    };

    // Update graph if initialized
    if (graph) {
        graph.graphData(state.filteredData);
    }

    // Update stats
    updateStats();
}

/**
 * Update statistics display
 */
function updateStats() {
    const noteNodes = state.filteredData.nodes.filter(n => n.type === 'note');
    const tagNodes = state.filteredData.nodes.filter(n => n.type === 'tag');
    const orphanNodes = noteNodes.filter(n => n.isOrphan);
    const noteLinks = state.filteredData.links.filter(l => l.type === 'note-link');

    document.getElementById('noteCount').textContent = noteNodes.length;
    document.getElementById('tagCount').textContent = tagNodes.length;
    document.getElementById('linkCount').textContent = noteLinks.length;
    document.getElementById('orphanCount').textContent = orphanNodes.length;
}

/**
 * Handle refresh button
 */
function handleRefresh() {
    window.vscode.postMessage({ command: 'refresh' });
}

/**
 * Handle re-center button - fit all nodes in view
 */
function handleRecenter() {
    if (graph) {
        graph.zoomToFit(400, 80);
    }
}

/**
 * Handle clear filters button - reset all checkboxes to checked
 */
function handleClearFilters() {
    // Reset all filter states to true and update UI
    for (const filterKey in state.filters) {
        if (Object.prototype.hasOwnProperty.call(state.filters, filterKey)) {
            state.filters[filterKey] = true;
            const checkbox = document.getElementById(filterKey);
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    }

    // Update graph with all filters enabled
    updateFilters();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Action buttons
    document.getElementById('recenterBtn').addEventListener('click', handleRecenter);
    document.getElementById('refreshBtn').addEventListener('click', handleRefresh);
    document.getElementById('clearFiltersBtn').addEventListener('click', handleClearFilters);

    // Filter checkboxes
    document.getElementById('showNotes').addEventListener('change', (e) => {
        state.filters.showNotes = e.target.checked;
        updateFilters();
    });

    document.getElementById('showTags').addEventListener('change', (e) => {
        state.filters.showTags = e.target.checked;
        updateFilters();
    });

    document.getElementById('showPlaceholders').addEventListener('change', (e) => {
        state.filters.showPlaceholders = e.target.checked;
        updateFilters();
    });

    document.getElementById('showOrphans').addEventListener('change', (e) => {
        state.filters.showOrphans = e.target.checked;
        updateFilters();
    });

    // Listen for messages from extension
    window.addEventListener('message', (event) => {
        const message = event.data;

        switch (message.command) {
            case 'updateGraph':
                // Save current zoom/pan state before updating
                if (graph) {
                    state.viewState = {
                        zoom: graph.zoom(),
                        centerPos: graph.centerAt()
                    };
                }

                // Rebuild graph with new data
                state.graph.nodes = message.graphData.nodes || [];
                state.graph.links = message.graphData.links || [];
                updateFilters();

                // Restore zoom/pan state after graph updates
                if (graph && state.viewState) {
                    // Give the graph a moment to update, then restore view
                    setTimeout(() => {
                        if (state.viewState.centerPos) {
                            graph.centerAt(state.viewState.centerPos.x, state.viewState.centerPos.y, 0);
                        }
                        graph.zoom(state.viewState.zoom, 0);
                    }, 100);
                }
                break;
        }
    });
}

/**
 * Initialize application
 */
function init() {
    initGraph();
    setupEventListeners();
    updateStats();

    // Initialize particles after graph to ensure proper layering
    setTimeout(() => {
        initParticles();
    }, 100);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
