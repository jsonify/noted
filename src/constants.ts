/**
 * Constants used throughout the Noted extension
 */

/**
 * Built-in template definitions
 * Each template returns structured content (frontmatter is added separately)
 */
export const BUILT_IN_TEMPLATES = {
    'problem-solution': () => `PROBLEM:


STEPS TAKEN:
1.

SOLUTION:


NOTES:

`,
    'meeting': () => `MEETING:
ATTENDEES:

AGENDA:
-

NOTES:


ACTION ITEMS:
-

`,
    'research': () => `TOPIC:

QUESTIONS:
-

FINDINGS:


SOURCES:
-

NEXT STEPS:


`,
    'quick': () => ``,
    'user-story': () => `# User Story: {filename}

**Created:** {date} | **Author:** {user}

## Story Title
[Brief title for the user story]

## Description
As a [user type],
I want [goal],
So that [benefit].

### Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Estimate
**Time to Complete:** [X hours/days]

## Notes
[Additional context, dependencies, or references]

---
`
};

/**
 * Built-in template variables that are reserved and cannot be used as custom variable names
 * These variables are automatically replaced when templates are generated
 */
export const BUILT_IN_TEMPLATE_VARIABLES = [
    'filename',
    'date',
    'time',
    'year',
    'month',
    'day',
    'weekday',
    'month_name',
    'user',
    'workspace'
] as const;

/**
 * Built-in template metadata for display in picker
 */
export const BUILT_IN_TEMPLATE_INFO = [
    {
        label: 'Problem/Solution',
        value: 'problem-solution',
        description: 'Document bugs and troubleshooting',
        when_to_use: 'When debugging issues, documenting solutions to problems, or troubleshooting technical challenges that you want to reference later.',
        use_cases: [
            'Debugging a production bug and documenting the fix',
            'Troubleshooting a development environment issue',
            'Recording solutions to recurring technical problems',
            'Documenting workarounds for known issues'
        ],
        prerequisites: ['Basic understanding of the problem domain', 'Ability to describe technical issues clearly'],
        related_templates: ['research', 'user-story'],
        estimated_time: '5-10 minutes'
    },
    {
        label: 'Meeting',
        value: 'meeting',
        description: 'Organize meeting notes and action items',
        when_to_use: 'Perfect for team meetings, client calls, one-on-ones, or any discussion where you need to track attendees, agenda items, and action items.',
        use_cases: [
            'Daily standup or sprint planning meetings',
            'Client requirement gathering sessions',
            'Team retrospectives and brainstorming',
            'One-on-one meetings with managers or teammates'
        ],
        prerequisites: ['Meeting agenda or topics to discuss'],
        related_templates: ['user-story', 'research'],
        estimated_time: '2-3 minutes setup, ongoing during meeting'
    },
    {
        label: 'Research',
        value: 'research',
        description: 'Structure your research and findings',
        when_to_use: 'Ideal for investigating new technologies, gathering information on topics, or conducting structured research with clear questions and findings.',
        use_cases: [
            'Evaluating new libraries or frameworks for a project',
            'Researching solutions to architectural decisions',
            'Learning about new programming concepts or patterns',
            'Gathering competitive analysis or market research'
        ],
        prerequisites: ['Clear research topic or question', 'Basic research methodology understanding'],
        related_templates: ['problem-solution'],
        estimated_time: '5-15 minutes setup, extended for research'
    },
    {
        label: 'User Story',
        value: 'user-story',
        description: 'Agile user stories with tasks, criteria, and estimates',
        when_to_use: 'Use when planning features in agile/scrum workflows, breaking down requirements into user-focused stories with clear acceptance criteria.',
        use_cases: [
            'Sprint planning and backlog grooming',
            'Feature requirement documentation',
            'Breaking down epics into implementable stories',
            'Tracking development tasks with clear success criteria'
        ],
        prerequisites: ['Understanding of agile user story format', 'Knowledge of the feature or requirement'],
        related_templates: ['meeting', 'problem-solution'],
        estimated_time: '10-15 minutes'
    },
    {
        label: 'Quick',
        value: 'quick',
        description: 'Simple dated note',
        when_to_use: 'For rapid note-taking when you need minimal structure, such as jotting down ideas, temporary notes, or quick reminders.',
        use_cases: [
            'Capturing quick thoughts or ideas',
            'Temporary notes during phone calls',
            'Daily journal or stream-of-consciousness writing',
            'Scratch pad for calculations or brainstorming'
        ],
        prerequisites: [],
        related_templates: ['meeting', 'research'],
        estimated_time: 'Under 1 minute'
    }
];

/**
 * Regular expression patterns for folder validation
 */
export const FOLDER_PATTERNS = {
    YEAR: /^\d{4}$/,
    MONTH: /^\d{2}-[A-Za-z]+$/,
    INVALID_CHARS: /[<>:"|?*]/,
    DAILY_NOTE: /^\d{4}-\d{2}-\d{2}$/
};

/**
 * Default configuration values
 */
export const DEFAULTS = {
    NOTES_FOLDER: 'Notes',
    FILE_FORMAT: 'md',
    RECENT_NOTES_LIMIT: 10,
    SEPARATOR_LENGTH: 50
};

/**
 * Special folder names for note organization
 */
export const SPECIAL_FOLDERS = {
    INBOX: 'Inbox',
    TEMPLATES: '.noted-templates',
    ARCHIVE: '.archive',
    HIERARCHICAL: 'Hierarchical Notes'
};

/**
 * Template placeholder patterns
 */
export const TEMPLATE_PLACEHOLDERS = {
    FILENAME: /{filename}/g,
    DATE: /{date}/g,
    TIME: /{time}/g,
    YEAR: /{year}/g,
    MONTH: /{month}/g,
    DAY: /{day}/g,
    WEEKDAY: /{weekday}/g,
    MONTH_NAME: /{month_name}/g,
    USER: /{user}/g,
    WORKSPACE: /{workspace}/g
};

/**
 * Built-in placeholder names (for variable extraction)
 * Single source of truth for all built-in template placeholders
 */
export const BUILT_IN_PLACEHOLDER_NAMES = [
    'filename',
    'date',
    'time',
    'year',
    'month',
    'day',
    'weekday',
    'month_name',
    'user',
    'workspace'
] as const;

/**
 * Template category mapping for auto-categorization during migration
 * Maps keywords in template names to category names
 */
export const TEMPLATE_CATEGORY_KEYWORDS: Record<string, string> = {
    'meeting': 'Meetings',
    'project': 'Projects',
    'video': 'Content Creation',
    'tutorial': 'Content Creation',
    'research': 'Research',
    'user-story': 'User Stories',
    'story': 'User Stories'
};

/**
 * Month names for calendar and folder generation
 */
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Day names for calendar headers
 */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * File extensions supported for notes
 * Includes text, markdown, and common programming language file types
 */
export const SUPPORTED_EXTENSIONS = [
    // Text and Markdown
    '.txt', '.md',

    // Web Development
    '.html', '.css', '.scss', '.sass', '.less',
    '.js', '.jsx', '.ts', '.tsx',
    '.json', '.xml', '.yaml', '.yml',

    // Programming Languages
    '.py',              // Python
    '.java',            // Java
    '.c', '.cpp', '.h', '.hpp',  // C/C++
    '.cs',              // C#
    '.go',              // Go
    '.rs',              // Rust
    '.rb',              // Ruby
    '.php',             // PHP
    '.swift',           // Swift
    '.kt', '.kts',      // Kotlin
    '.r', '.R',         // R
    '.m',               // MATLAB/Objective-C

    // Shell/Scripting
    '.sh', '.bash', '.zsh',  // Shell scripts
    '.ps1',             // PowerShell
    '.bat', '.cmd',     // Windows batch

    // Data & Config
    '.sql',             // SQL
    '.toml',            // TOML
    '.ini',             // INI
    '.conf', '.config', // Config files
    '.env',             // Environment variables

    // Other
    '.lua',             // Lua
    '.vim',             // Vim script
    '.dart',             // Dart
    '.pl',              // Perl
    '.hs',              // Haskell
    '.scala',           // Scala
    '.clj',             // Clojure
    '.ex', '.exs',      // Elixir
    '.erl'              // Erlang
];

/**
 * Generate VS Code document selector for all supported file types
 * Used for registering language providers (completion, hover, rename, etc.)
 */
export function getDocumentSelector(): Array<{ pattern: string }> {
    return SUPPORTED_EXTENSIONS.map(ext => ({ pattern: `**/*${ext}` }));
}

/**
 * Generate a regex pattern for matching all supported extensions
 * Used for stripping file extensions from note names
 * Example: /\.(txt|md|js|py|...)$/i
 */
export function getSupportedExtensionsRegex(): RegExp {
    const extPattern = SUPPORTED_EXTENSIONS
        .map(ext => ext.slice(1)) // Remove leading dot
        .map(ext => ext.replace(/\./g, '\\.')) // Escape dots for regex
        .join('|');
    return new RegExp(`\\.(${extPattern})$`, 'i');
}

/**
 * Image file extensions supported for embedding
 */
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'];

/**
 * Diagram file extensions supported for embedding
 * - .drawio: Draw.io diagram files
 * - .excalidraw: Excalidraw diagram files (JSON format)
 * - .excalidraw.svg: Excalidraw diagrams exported as SVG
 * - .excalidraw.png: Excalidraw diagrams exported as PNG
 */
export const DIAGRAM_EXTENSIONS = ['.drawio', '.excalidraw', '.excalidraw.svg', '.excalidraw.png'];

/**
 * Category configuration for organizing notes
 * Maps template types to category folders with icons
 */
export interface CategoryConfig {
    folder: string;
    icon: string;
    templates: string[];
    description?: string;
}

/**
 * Default categories for note organization
 * Daily notes go in date-based folders, all others go in semantic folders
 */
export const DEFAULT_CATEGORIES: Record<string, CategoryConfig> = {
    'Daily': {
        folder: 'Daily',
        icon: '📅',
        templates: [],
        description: 'Daily journal notes organized by date'
    },
    'Meetings': {
        folder: 'Meetings',
        icon: '🤝',
        templates: ['meeting'],
        description: 'Meeting notes and agendas'
    },
    'Research': {
        folder: 'Research',
        icon: '🔬',
        templates: ['research'],
        description: 'Research notes and findings'
    },
    'Projects': {
        folder: 'Projects',
        icon: '📋',
        templates: ['problem-solution'],
        description: 'Project notes and problem-solving'
    },
    'User Stories': {
        folder: 'User Stories',
        icon: '📝',
        templates: ['user-story'],
        description: 'Agile user stories with acceptance criteria'
    },
    'Quick': {
        folder: 'Quick',
        icon: '⚡',
        templates: ['quick'],
        description: 'Quick notes and jots'
    }
};
