---
layout: default
title: Graph View
parent: Features
---

# Graph View

Visualize your note connections with an interactive graph that shows your knowledge network. The graph view reveals patterns, clusters, and relationships between your notes using wiki-style links.

## Opening the Graph View

Use the keyboard shortcut `Cmd+Shift+G` (macOS) or `Ctrl+Shift+G` (Windows/Linux), or open the command palette and search for "Show Graph".

## Interactive Features

### Navigation
- **Click nodes** to open notes instantly
- **Drag nodes** to reposition and explore relationships
- **Zoom and pan** to navigate large graphs using mouse wheel and drag
- **Hover tooltips** showing note names, connection counts, and quick actions

### Node Highlighting
- **Click any node** to highlight its immediate connections
  - Connected nodes stay at full opacity while others dim to 20%
  - Connected edges become hot pink and thicker for emphasis
- **Click canvas** (empty space) to clear highlights

## Layout Options

Switch between different graph layouts using the layout dropdown:

### Force-Directed (Default)
Natural physics-based layout that automatically organizes notes based on their connections. Highly connected notes gravitate toward the center while creating organic clusters.

**Best for:** Understanding natural groupings and discovering note clusters

### Hierarchical
Top-down tree structure that arranges notes in clear levels based on connection patterns. Hub notes appear at the top with connected notes flowing downward.

**Best for:** Seeing clear hierarchical relationships and note importance

### Circular
Ring arrangement that places all notes in a circle for an alternative perspective on connections.

**Best for:** Exploring connections from a different angle, especially useful for smaller graphs

## Filtering and Search

### Search Box
Type any text to instantly filter the graph to show only matching notes. The graph updates in real-time as you type.

**Example:** Type "meeting" to see only notes with "meeting" in their name

### Connection Filter
- **All Notes**: Shows every note in your workspace
- **Connected Only**: Shows only notes that have at least one link (hides orphans)
- **Orphans Only**: Shows only notes with no incoming or outgoing links

### Time-Based Filtering

Filter notes based on when they were created or modified. This powerful feature helps you focus on recent work, track productivity over time, or explore notes from specific periods.

#### Preset Time Ranges
Select from common time periods using the time filter dropdown:
- **All Time** - No time filtering (default)
- **Today** - Notes from midnight onwards today
- **Last 7 Days** - Notes from the past week
- **Last 30 Days** - Notes from the past month
- **Last 90 Days** - Notes from the past quarter
- **Last Year** - Notes from the past 365 days

#### Custom Date Range
Select **Custom Range...** to specify exact dates:
1. Choose start and end dates using the date pickers
2. Select whether to filter by **Created** or **Modified** date
3. Click **Apply** to update the graph
4. Click **Clear** to reset the time filter

**Example:** View only notes created in January 2025:
- Start Date: 2025-01-01
- End Date: 2025-01-31
- Mode: Created

#### Filter Mode: Created vs Modified
Toggle between two different perspectives on your notes:

**Created Date**
- Shows notes based on when the file was first created
- Useful for tracking note-taking patterns over time
- Helps identify productive periods

**Modified Date**
- Shows notes based on when they were last edited
- Useful for finding recently updated notes
- Helps identify active areas of your knowledge base

#### Combined Filtering
Time filters work seamlessly with other filters for powerful queries:

**Examples:**
- **Connected Only + Last 7 Days** - See recently created/modified notes that have links
- **Orphans Only + Last 30 Days** - Find recent notes that haven't been linked yet
- **Search "project" + Last 90 Days** - Find project-related notes from this quarter

**Pro Tip:** Use time filtering to review notes from specific project periods or identify notes that might need updating.

## Graph Customization

Click the **Customize** button to open the customization panel and personalize your graph appearance.

### Node Appearance

**Node Size** (5-50 pixels)
Adjust the base size of all nodes in the graph. Larger sizes make nodes easier to see but may cause overlap in dense graphs.

**Border Width** (1-6 pixels)
Control the thickness of node borders. Thicker borders make nodes more prominent.

**Node Shape**
Choose from 6 different node shapes:
- **Dot (Circle)** - Default, clean and compact
- **Diamond** - Sharp, distinctive appearance
- **Square** - Traditional, easy to read labels
- **Triangle** - Directional, unique look
- **Star** - Highly visible for important nodes
- **Hexagon** - Modern, balanced design

**Shadows**
Toggle drop shadows on/off. Shadows add depth perception but may impact performance on very large graphs.

### Edge Appearance

**Edge Width** (1-8 pixels)
Adjust the thickness of connection lines between notes. Thicker edges are more visible but can clutter dense graphs.

**Edge Color**
Pick any color for your connection lines using the color picker. Default is pink (#e83e8c) for visibility on dark backgrounds.

**Edge Style**
Choose how connection lines are drawn:
- **Smooth Curve** - Gentle curved lines (default, most readable)
- **Dynamic** - Adaptive curves based on node positions
- **Straight Line** - Direct connections, minimal visual clutter
- **Cubic Bezier** - Smooth curves with more control points

**Show Arrows**
Toggle directional arrows on/off. Arrows indicate which note links to which, showing the direction of your connections.

### Physics & Animation

Fine-tune how the force-directed layout behaves:

**Spring Length** (50-400)
Controls the desired distance between connected nodes. Longer springs spread the graph out more.

**Node Repulsion** (10,000-50,000)
Controls how strongly nodes push away from each other. Higher values create more spacing but may scatter the graph.

**Central Gravity** (0-1.0)
Controls the pull toward the center of the graph. Higher values keep nodes more centered.

### Custom Node Colors

Personalize the color scheme used for nodes based on their connection counts:

- **Orphan Nodes** - Nodes with no connections (default: gray #cccccc)
- **Low Connections (1-2)** - Lightly connected notes (default: green #69db7c)
- **Medium Connections (3-5)** - Moderately connected notes (default: blue #4dabf7)
- **High Connections (6-10)** - Well-connected notes (default: orange #ffa500)
- **Very High Connections (10+)** - Hub notes (default: red #ff6b6b)

Each color can be customized using the color picker. Your custom colors persist across sessions.

### Saving and Resetting

- **Apply** - Save your customizations and rebuild the graph with new settings
- **Reset to Defaults** - Restore all settings to their original values
- Settings automatically persist across VS Code sessions

## Visual Encoding

The graph uses visual cues to convey information at a glance:

### Node Size
Larger nodes have more connections. Size uses logarithmic scaling for better visual distribution, so a node with 20 connections won't be twice as large as one with 10.

### Node Colors
By default (can be customized):
- **Gray** - Orphan notes with no connections
- **Green** - Lightly connected (1-2 links)
- **Blue** - Moderately connected (3-5 links)
- **Orange** - Well connected (6-10 links)
- **Red** - Highly connected hubs (10+ links)

### Edge Width
Thicker edges indicate bidirectional links (notes that link to each other).

## Statistics Dashboard

The toolbar displays real-time graph metrics:
- **Notes** - Total number of notes in your workspace
- **Links** - Total number of connections between notes
- **Orphans** - Number of notes with no incoming or outgoing links
- **Avg Connections** - Average number of connections per note

## Controls

### Refresh Button
Rebuilds the graph after creating new links or modifying notes. The graph doesn't automatically update, so click refresh when you've made changes.

### Fit View Button
Auto-zooms and centers the graph to show all nodes. Useful after filtering or when the graph has drifted off screen.

### Customize Button
Opens the customization panel for adjusting graph appearance and behavior.

## Tips for Effective Use

### Finding Orphan Notes
1. Use the "Orphans Only" filter to see disconnected notes
2. Gray nodes in "All Notes" view are orphans
3. Consider linking orphans to related notes to build your knowledge network

### Identifying Hub Notes
1. Look for large red/orange nodes - these are your most connected notes
2. Click a hub node to see all its connections highlighted
3. Hub notes often make good index or MOC (Map of Content) pages

### Exploring Clusters
1. Use the Force-Directed layout to see natural groupings
2. Clusters indicate related topics or projects
3. Consider creating bridge notes to connect isolated clusters

### Using Time Filters Effectively
1. **Daily Review**: Use "Today" filter to see what you worked on
2. **Weekly Review**: Use "Last 7 Days" + "Modified" to see recently edited notes
3. **Project Retrospectives**: Use custom date range to view notes from specific project periods
4. **Find Stale Notes**: Use "Modified" filter with older date ranges to find notes that may need updating
5. **Track Productivity**: Compare different time periods to see when you were most active

### Performance with Large Graphs
1. Use filters to reduce visual complexity (Connected Only, search)
2. Try the Hierarchical or Circular layouts for better performance
3. Disable shadows if you have 100+ notes
4. Use straight edge style instead of curves for faster rendering

### Customizing for Your Workflow
1. Choose colors that match your VS Code theme
2. Adjust physics settings to control how "springy" the graph feels
3. Experiment with node shapes to find what works best for you
4. Use higher repulsion values for dense graphs to reduce overlap

## Keyboard Shortcuts

- `Cmd+Shift+G` / `Ctrl+Shift+G` - Open graph view

## Related Features

- [Wiki-Style Links]({{ '/features/wiki-links' | relative_url }}) - Create connections between notes
- [Search & Discovery]({{ '/features/search' | relative_url }}) - Find notes by content
- [Tags]({{ '/features/tags' | relative_url }}) - Organize notes with tags

---

[← Back to Features]({{ '/features/' | relative_url }})
