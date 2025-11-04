/**
 * Type definitions for location-based tag storage
 * Inspired by Foam's tag system architecture
 */

/**
 * Represents a position in a document (zero-indexed)
 */
export interface Position {
  line: number;      // Zero-indexed line number
  character: number; // Zero-indexed character offset
}

/**
 * Represents a range in a document with start and end positions
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Represents a tag in a note with its label and position
 */
export interface Tag {
  label: string;  // Tag name (without # prefix, e.g., "project/frontend")
  range: Range;   // Position in the document
}

/**
 * Represents a location of an item in a file
 * Generic type T allows storing additional data with the location
 */
export interface Location<T> {
  uri: string;    // File path (absolute)
  range: Range;   // Position in file
  data: T;        // The tag object or other data
}

/**
 * Utility functions for working with Positions and Ranges
 */
export namespace RangeUtils {
  /**
   * Creates a Position
   */
  export function createPosition(line: number, character: number): Position {
    return { line, character };
  }

  /**
   * Creates a Range from start and end positions
   */
  export function createRange(start: Position, end: Position): Range {
    return { start, end };
  }

  /**
   * Creates a Range from line and character coordinates
   */
  export function createRangeFromCoords(
    startLine: number,
    startChar: number,
    endLine: number,
    endChar: number
  ): Range {
    return {
      start: { line: startLine, character: startChar },
      end: { line: endLine, character: endChar }
    };
  }

  /**
   * Checks if a position is contained within a range
   */
  export function containsPosition(range: Range, position: Position): boolean {
    if (position.line < range.start.line || position.line > range.end.line) {
      return false;
    }
    if (position.line === range.start.line && position.character < range.start.character) {
      return false;
    }
    if (position.line === range.end.line && position.character > range.end.character) {
      return false;
    }
    return true;
  }

  /**
   * Converts a Range to a VS Code Range
   */
  export function toVsCodeRange(range: Range): any {
    const vscode = require('vscode');
    return new vscode.Range(
      range.start.line,
      range.start.character,
      range.end.line,
      range.end.character
    );
  }

  /**
   * Creates a Location from a URI, Range, and data
   */
  export function createLocation<T>(uri: string, range: Range, data: T): Location<T> {
    return { uri, range, data };
  }
}
