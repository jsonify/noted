/**
 * Constants used throughout the Noted extension
 */

/**
 * Built-in template definitions
 * Each template includes a frontmatter section and structured content
 */
export const BUILT_IN_TEMPLATES = {
    'problem-solution': (frontmatter: string) => `${frontmatter}PROBLEM:


STEPS TAKEN:
1.

SOLUTION:


NOTES:

`,
    'meeting': (frontmatter: string) => `${frontmatter}MEETING:
ATTENDEES:

AGENDA:
-

NOTES:


ACTION ITEMS:
-

`,
    'research': (frontmatter: string) => `${frontmatter}TOPIC:

QUESTIONS:
-

FINDINGS:


SOURCES:
-

NEXT STEPS:


`,
    'quick': (frontmatter: string) => `${frontmatter}`
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
    INVALID_CHARS: /[<>:"|?*]/
};

/**
 * Default configuration values
 */
export const DEFAULTS = {
    NOTES_FOLDER: 'Notes',
    FILE_FORMAT: 'txt',
    RECENT_NOTES_LIMIT: 10,
    SEPARATOR_LENGTH: 50
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
