/**
 * Type declarations for static assets imported as strings
 * These files are bundled at compile time by esbuild's text loader
 */

declare module '*.html' {
    const content: string;
    export default content;
}

declare module '*.css' {
    const content: string;
    export default content;
}

declare module '*.client.js' {
    const content: string;
    export default content;
}
