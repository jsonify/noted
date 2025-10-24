---
title: Graph View
date: 2025-10-24 09:00:00 -0800
categories: [Features, Visualization]
tags: [graph, visualization, network]
---

# What is Graph View?

Visualize your entire note network as an interactive graph showing connections, clusters, and knowledge structure.

## Opening Graph View

**Command Palette**:
```
Noted: Show Graph
```

**Optional**: Set up a custom keyboard shortcut (e.g., `Cmd+Shift+G`) in VS Code settings for faster access.

## Graph Features

### Interactive Nodes

- **Drag**: Click and drag nodes to reposition
- **Zoom**: Scroll to zoom in/out
- **Pan**: Click background and drag to pan
- **Click**: Select a node to highlight its connections
- **Double-Click**: Open the note in editor

### Visual Elements

**Nodes**: Each note is represented as a circle
- Size varies by number of connections (logarithmic scale)
- Color indicates connection strength
- Label shows note name

**Edges**: Lines between nodes show links
- Thickness indicates link strength
- Color shows bidirectional vs one-way links

## Graph Controls

### Focus Mode

Click a node to enter focus mode:
- Selected note highlighted
- Direct connections emphasized
- Other nodes dimmed
- Related notes easier to see

Click background to exit focus mode.

### Time Filtering

Filter notes by creation date:

1. Click "Filter by Date" button
2. Select date range
3. Graph shows only notes from that period

Useful for seeing how your knowledge base grew over time.

### Physics Controls

Adjust graph physics for better visualization:

**Stabilization**:
- Toggle to freeze/unfreeze node positions
- Useful after arranging nodes manually

**Repulsion**:
- Adjust how strongly nodes push apart
- Higher = more spread out graph

**Spring Length**:
- Control edge length
- Longer = more space between connected nodes

**Gravity**:
- Pull nodes toward center
- Prevents nodes from drifting away

### Display Options

**Show Labels**:
- Toggle note names on/off
- Helpful for large graphs

**Node Size**:
- Scale all node sizes up/down
- Adjust for readability

**Edge Thickness**:
- Make connections more/less prominent

**Colors**:
- Choose color scheme
- Highlight different connection strengths

## Graph Statistics

The graph panel shows key metrics:

- **Total Notes**: Number of nodes in graph
- **Total Links**: Number of connections
- **Orphan Notes**: Notes with no links
- **Most Connected**: Note with most links
- **Clusters**: Groups of highly connected notes

## Use Cases

### Knowledge Structure

Understand how your notes are organized:

```
Central Hub Notes:
- project-alpha (25 connections)
- team-structure (18 connections)
- architecture-decisions (15 connections)

Isolated Topics:
- random-idea (0 connections)
- old-notes (1 connection)
```

### Find Related Content

Discover unexpected connections:
- Hover over a node to see all its links
- Look for clusters of related topics
- Identify bridge notes that connect different areas

### Identify Orphans

Find notes that aren't integrated:
- Look for isolated nodes
- No connections = potential to link
- Integrate orphans into knowledge network

### Track Growth

Filter by date to see evolution:
- Week 1: 10 notes, sparse connections
- Month 1: 50 notes, several clusters
- Month 6: 200 notes, dense network

## Graph Patterns

### Star Pattern

One central note with many connections:
```
       note1
         |
    note2-HUB-note3
         |
       note4
```
Indicates a main reference note or index.

### Chain Pattern

Linear sequence of connected notes:
```
note1 -> note2 -> note3 -> note4
```
Shows progressive development or timeline.

### Cluster Pattern

Highly interconnected group:
```
  A---B
  |\ /|
  | X |
  |/ \|
  C---D
```
Indicates related topic area.

### Island Pattern

Isolated groups:
```
A-B-C        X-Y-Z
```
Suggests separate projects or topics.

## Performance

### Large Graphs

For graphs with 1000+ notes:

1. **Disable Labels**: Improves rendering speed
2. **Use Time Filters**: Show subset of notes
3. **Increase Stabilization**: Faster initial layout
4. **Reduce Physics Iterations**: Faster interactions

### Export Graph

Save graph visualization (feature coming soon):
- Export as image (PNG/SVG)
- Export graph data (JSON)
- Share with team

## Best Practices

1. **Link Actively**: More links = better graph insights
2. **Use Descriptive Names**: Node labels should be clear
3. **Review Orphans**: Periodically integrate isolated notes
4. **Explore Clusters**: Understand topic groups
5. **Use Focus Mode**: Navigate large graphs efficiently

## Keyboard Shortcuts

While graph view is open:

| Shortcut | Action |
|----------|--------|
| `Esc` | Close graph view |
| `Space` | Toggle physics |
| `R` | Reset zoom |
| `F` | Fit all nodes in view |
| `L` | Toggle labels |

## Technical Details

### Graph Engine

Noted uses vis.js for graph visualization:
- Force-directed layout algorithm
- Hierarchical and physics-based layouts
- Hardware-accelerated canvas rendering

### Update Mechanism

Graph automatically updates when:
- Notes are created/deleted
- Links are added/removed
- Documents are saved

Refresh manually with "Refresh Graph" button.

## Related Features

- [Wiki Links](/noted/posts/wiki-links/) - Create connections
- [Connections Panel](/noted/posts/connections/) - View links for active note
- [Backlinks](/noted/posts/wiki-links/#automatic-backlinks) - Automatic reverse links

---

Explore your knowledge network visually! 🕸️
