# Scripts

Utility scripts for development and testing.

## Generate Graph Test Data

**Purpose**: Generate sample notes with diverse connection patterns for demonstrating the graph view feature in screenshots and demos.

**Usage**:
```bash
# With default path (~/Documents/Notes)
pnpm run generate:graph-data

# Or specify your notes folder path
npx ts-node scripts/generateGraphTestData.ts ~/Notes md
npx ts-node scripts/generateGraphTestData.ts ~/Dropbox/Notes md
npx ts-node scripts/generateGraphTestData.ts /path/to/your/notes txt
```

**Important**: Make sure to use the same path that your Noted extension is configured to use! Check your VS Code settings: `noted.notesFolder`

**What it creates**:
- 23 interconnected notes spread across October 2025
- Hub notes with 5-8 connections (e.g., authentication-architecture, backend-patterns)
- Clustered notes (security, backend implementation, database)
- Weakly connected notes (1-2 connections)
- Orphaned notes (0 connections) for demonstration

**Connection patterns**:
- **Hub notes**: Highly connected central topics
- **Clusters**: Related notes grouped by topic (security, backend, database)
- **Bidirectional links**: Notes that reference each other
- **Orphans**: Isolated notes to demonstrate orphan detection

**Topics covered**:
- Authentication & Security (JWT, OAuth, sessions, API security)
- Backend Architecture (patterns, services, middleware)
- Database (schema, migrations, Redis)
- Bug tracking and meeting notes

**Default location**: `~/Documents/Notes`

**Customization**:
Edit `scripts/generateGraphTestData.ts` to customize:
- `NOTES_BASE_PATH` - Change output location
- `FILE_FORMAT` - Switch between 'md' and 'txt'
- `notesData` array - Add/modify notes and connections

**After running**:
1. Open VS Code
2. Run command "Noted: Show Graph" (Cmd+Shift+G / Ctrl+Shift+G)
3. Explore the graph visualization with realistic connection patterns

**Statistics** (current configuration):
- Total notes: 23
- Total links: 45+
- Hub notes (5+ connections): 2
- Orphaned notes (0 connections): 3
- Average links per note: ~2
