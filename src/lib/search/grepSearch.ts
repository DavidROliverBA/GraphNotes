// src/lib/search/grepSearch.ts

import { invoke } from '@tauri-apps/api/core';
import { GrepResult } from './types';

/**
 * Result structure from Tauri grep command
 */
interface TauriGrepMatch {
  filepath: string;
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
}

/**
 * Search for a pattern in markdown files using grep
 *
 * @param vaultPath - The path to the vault directory
 * @param pattern - The search pattern (regex or literal string)
 * @param maxResults - Maximum number of results to return (default: 100)
 * @returns Array of grep results
 */
export async function grepSearch(
  vaultPath: string,
  pattern: string,
  maxResults: number = 100
): Promise<GrepResult[]> {
  if (!pattern.trim()) {
    return [];
  }

  try {
    const results = await invoke<TauriGrepMatch[]>('grep_search', {
      path: vaultPath,
      pattern,
      maxResults,
    });

    // Convert from Tauri format to our GrepResult format
    return results.map((match) => ({
      filepath: match.filepath,
      lineNumber: match.line_number,
      lineContent: match.line_content,
      matchStart: match.match_start,
      matchEnd: match.match_end,
    }));
  } catch (error) {
    console.error('[grepSearch] Error:', error);
    throw error;
  }
}

/**
 * Highlight matched text in a line
 *
 * @param line - The line content
 * @param matchStart - Start index of the match
 * @param matchEnd - End index of the match
 * @returns Object with before, match, and after segments
 */
export function highlightMatch(
  line: string,
  matchStart: number,
  matchEnd: number
): { before: string; match: string; after: string } {
  return {
    before: line.slice(0, matchStart),
    match: line.slice(matchStart, matchEnd),
    after: line.slice(matchEnd),
  };
}

export default grepSearch;
