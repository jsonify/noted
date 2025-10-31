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
    'quick': () => ``
};

/**
 * Built-in template metadata for display in picker
 */
export const BUILT_IN_TEMPLATE_INFO = [
    { label: 'Problem/Solution', value: 'problem-solution', description: 'Document bugs and troubleshooting' },
    { label: 'Meeting', value: 'meeting', description: 'Organize meeting notes and action items' },
    { label: 'Research', value: 'research', description: 'Structure your research and findings' },
    { label: 'Quick', value: 'quick', description: 'Simple dated note' }
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
    TEMPLATES: '.templates'
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
 */
export const SUPPORTED_EXTENSIONS = ['.txt', '.md'];

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
    'Quick': {
        folder: 'Quick',
        icon: '⚡',
        templates: ['quick'],
        description: 'Quick notes and jots'
    }
};
