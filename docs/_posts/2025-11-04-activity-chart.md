---
title: Activity Chart
date: 2025-11-04 10:00:00 -0800
categories: [Features, Analytics]
tags: [activity, analytics, visualization, statistics, charts]
---

# What is the Activity Chart?

Visualize your workspace activity over time with beautiful, interactive charts showing notes created, tags added, and links created. Track your productivity and engagement patterns with a 12-week rolling view.

## Quick Start

```
Command: Noted: Show Activity Chart
```

Or access it from the Calendar View's statistics panel (integrated automatically).

## Overview

The Activity Chart provides a comprehensive view of your note-taking activity across three key metrics:
- **Notes Created**: New note files created each week
- **Tags Added**: Tags introduced in notes (inline hashtags and frontmatter tags)
- **Links Created**: Wiki-style links added between notes

## Standalone View

### Opening the Chart

1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Noted: Show Activity Chart"
3. Or click the pulse icon in the My Notes view toolbar

### Chart Features

```
┌─────────────── Platform Activity ──────────────┐
│                                    [Live Badge] │
│  Last 12 weeks · Production environment         │
│                                                  │
│  60 ┐                                           │
│     │                      ╱╲                   │
│  50 │                   ╱╲╱  ╲╱╲               │
│     │                 ╱         ╲              │
│  40 │               ╱             ╲            │
│     │             ╱                 ╲          │
│  30 │          ╱╲                     ╲        │
│     │        ╱   ╲                      ╲      │
│  20 │      ╱       ╲                      ╲    │
│     │   ╱╲           ╲                       ╲ │
│  10 │ ╱    ╲           ╲                       │
│   0 └────────────────────────────────────────── │
│      W1  W2  W3  W4  W5  W6  W7  W8  W9  W12   │
│                                                  │
│  Legend: [Notes] [Links] [Tags]                │
│                                                  │
│  Total Notes: 120    Avg: 10/week              │
│  Total Links: 85     Avg: 7/week               │
│  Total Tags:  45     Avg: 4/week                │
└──────────────────────────────────────────────────┘
```

### Interactive Elements

**Hover Effects:**
- Hover over any week to see detailed breakdown
- Tooltip shows week number, date range, and counts for all three metrics
- Points appear on hover showing exact data values

**Legend:**
- Click legend items to toggle metrics on/off
- Helps focus on specific metrics
- All three metrics visible by default

**Theme Integration:**
- Adapts to VS Code's light/dark theme
- Consistent colors across all charts
- Purple gradient background with subtle border

## Calendar View Integration

The Activity Chart is automatically included in the Calendar View's statistics panel.

### Access from Calendar

1. Open Calendar View (`Cmd+Shift+C`)
2. Look at the right-side statistics panel
3. Activity Chart is the first chart displayed

### Integrated Features

**Compact Design:**
- Smaller height (160px) optimized for panel view
- Same smooth curves and color scheme
- All interactive features preserved

**Consistent Styling:**
- Matches other calendar statistics charts
- Purple gradient background
- Theme-aware colors

**Multiple Charts:**
The statistics panel includes:
1. **Activity Chart**: 12-week stacked area (notes, tags, links)
2. **Day of Week Patterns**: Bar chart showing preferred writing days
3. **Growth Over Time**: Cumulative notes line chart
4. **Daily Streak**: Consecutive days tracking

All charts use:
- Chart.js for smooth animations
- Consistent theme colors
- Similar interaction patterns
- Compact heights to eliminate scrolling

## Metrics Explained

### Notes Created

**What it tracks:**
- New note files created each week
- Based on file creation timestamp (`birthtime`)

**Includes:**
- Daily notes
- Template-based notes
- Quick notes
- Category notes

**Excludes:**
- Template files themselves
- Deleted/archived notes

### Tags Added

**What it tracks:**
- New tags introduced in notes each week
- Based on file modification timestamp

**Includes:**
- Inline hashtags (e.g., `#project`)
- Frontmatter tags (e.g., `tags: [work, meeting]`)
- Hierarchical tags (e.g., `#project/frontend`)

**Counting:**
- Tags counted when files are modified
- Multiple instances of same tag count separately
- Frontmatter and inline tags both counted

### Links Created

**What it tracks:**
- Wiki-style links added between notes
- Based on file modification timestamp

**Includes:**
- Basic links: `[[note-name]]`
- Section links: `[[note#section]]`
- Display text links: `[[note|Display Text]]`

**Counting:**
- Each link counted individually
- Bidirectional links count twice (once in each file)
- Links counted when files are modified

## Understanding the Visualization

### Stacked Area Chart

**What is it?**
- Three colored layers stacked on top of each other
- Total height represents combined activity
- Each layer shows contribution of one metric

**Color Coding:**
- **Deep Blue**: Notes Created (bottom layer, most prominent)
- **Teal**: Links Created (middle layer)
- **Light Blue**: Tags Added (top layer)

**Reading the Chart:**
- Higher total = more activity that week
- Wider blue section = more notes created
- Larger teal section = more link activity
- Light blue on top = tag usage

### Weekly Timeline

**Week Labels:**
- W1 = Oldest week (12 weeks ago)
- W12 = Current week (most recent 7 days)

**Week Boundaries:**
- Each week starts on Sunday
- Current week runs from last Sunday to today
- Weeks are rolling (updates continuously)

### Statistics Summary

**Three Stat Cards:**

```
┌─────────────────┬─────────────────┬─────────────────┐
│  Total Notes    │  Total Links    │  Total Tags     │
│      120        │       85        │       45        │
│  Avg: 10/week   │  Avg: 7/week    │  Avg: 4/week    │
└─────────────────┴─────────────────┴─────────────────┘
```

**Hover Effects:**
- Cards lift slightly on hover
- Shadow effect appears
- Border highlights

## Data Source

### How Data is Collected

**File Timestamps:**
- Notes Created: Uses file creation timestamp
- Links/Tags: Uses file modification timestamp

**Retroactive Analysis:**
- All data inferred from existing file metadata
- No need to install extension early
- Historical activity computed on-demand

**Limitations:**
- Accuracy depends on file system timestamps
- File moves/copies may affect creation times
- Tags/links attributed to modification time (not exact creation time)

### Data Privacy

**Local Only:**
- All data stays on your machine
- No external services or analytics
- No data collection or transmission

**On-Demand:**
- Data computed when you open the view
- Not stored persistently
- Recalculated each time

## Use Cases

### Productivity Tracking

Monitor your note-taking habits:
- Identify productive weeks
- Spot patterns in activity levels
- Track consistency over time
- Celebrate progress milestones

### Project Analysis

Understand project engagement:
- High note creation = active work periods
- Link growth = knowledge connecting
- Tag usage = organization and categorization
- Combined metrics = overall engagement

### Habit Building

Build consistent note-taking habits:
- Visual feedback on consistency
- Weekly averages show baseline
- Spot gaps and dry periods
- Motivation through progress visibility

### Retrospectives

Review past activity:
- What weeks were most productive?
- When did major projects happen?
- How has activity evolved over time?
- Identify busy vs. quiet periods

## Tips and Tricks

### Interpreting Patterns

**Steady Growth:**
- Consistent heights across weeks
- Indicates regular note-taking habit
- Sustainable pace

**Spikes:**
- Tall peaks in specific weeks
- May indicate project sprints
- Conference notes, learning sessions
- Important events or deadlines

**Valleys:**
- Low activity weeks
- Vacations, busy work periods
- Normal fluctuation

**Trends:**
- Increasing heights = growing habit
- Decreasing = potential burnout or shift
- Seasonal patterns may emerge

### Optimizing Activity

**Balance Metrics:**
- Not just creating notes, but connecting them (links)
- Organizing knowledge (tags)
- Quality over quantity

**Weekly Goals:**
- Use averages as baseline
- Set realistic targets
- Celebrate consistency

**Link Creation:**
- Lower link counts = siloed notes
- Higher = connected knowledge graph
- Review notes to add connections

## Theme Consistency

### Centralized Color Palette

All charts (Activity, Day of Week, Growth) use consistent colors:

**Activity Metrics:**
- Notes: `rgba(94, 114, 228, ...)` - Deep blue
- Links: `rgba(137, 196, 244, ...)` - Teal
- Tags: `rgba(190, 227, 248, ...)` - Light blue

**UI Elements:**
- Accent: `rgba(100, 180, 255, ...)` - Bright blue
- Background: Purple gradients
- Borders: Subtle panel borders

**Defined in:** `src/constants/themeColors.ts`

### VS Code Theme Adaptation

**Axis Labels:**
- Computed from `--vscode-foreground` variable
- Automatically adapts to light/dark theme
- Fallback to light gray if needed

**Grid Lines:**
- Subtle gray (`rgba(128, 128, 128, 0.1)`)
- Consistent across all charts
- Minimal visual noise

## Troubleshooting

### No Data Showing

**Possible Causes:**
1. No notes created in last 12 weeks
2. Notes folder not configured
3. File timestamps unavailable

**Solutions:**
- Create some notes
- Verify notes folder in settings
- Check file system supports timestamps

### Incorrect Data

**File Timestamps:**
- If you copied/moved notes, timestamps may be wrong
- OS differences in timestamp handling
- File system type affects accuracy

**Workaround:**
- Data reflects file system metadata
- Consider as approximate, not exact

### Performance

**Large Note Collections:**
- Activity chart scans all notes
- May take few seconds for thousands of notes
- Computed on-demand, not cached

**Optimization:**
- Close view when not needed
- Data collection is one-time per view open

## Related Features

- [Calendar View](/2025-10-24-calendar): Includes integrated Activity Chart
- [Search](/2025-10-24-search): Find notes from specific time periods
- [Tags](/2025-10-24-tags): Tag management and filtering
- [Wiki Links](/2025-10-24-wiki-links): Create connections between notes
