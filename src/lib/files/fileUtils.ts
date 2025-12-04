// src/lib/files/fileUtils.ts

import { NoteFile } from '../notes/types';

/**
 * Recursively filter out dotfiles (files/directories starting with '.')
 * from a file tree structure.
 */
export function filterDotfiles(items: NoteFile[]): NoteFile[] {
  return items
    .filter(item => !item.name.startsWith('.'))
    .map(item => ({
      ...item,
      children: item.children ? filterDotfiles(item.children) : undefined,
    }));
}

/**
 * Get the display title for a file, using frontmatter title if available,
 * otherwise stripping the .md extension from the filename.
 */
export function getDisplayTitle(
  filename: string,
  frontmatterTitle?: string
): string {
  if (frontmatterTitle) {
    return frontmatterTitle;
  }
  // Remove .md extension for display
  return filename.endsWith('.md') ? filename.slice(0, -3) : filename;
}
