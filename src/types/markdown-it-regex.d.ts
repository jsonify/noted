/**
 * Type definitions for markdown-it-regex
 * Since @types/markdown-it-regex doesn't exist, we define our own
 */

declare module 'markdown-it-regex' {
    import MarkdownIt from 'markdown-it';

    interface MarkdownItRegexOptions {
        name: string;
        regex: RegExp;
        replace: (match: string) => string;
    }

    function markdownItRegex(options: MarkdownItRegexOptions): MarkdownIt.PluginSimple;

    export = markdownItRegex;
}
