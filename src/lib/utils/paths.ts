// src/lib/utils/paths.ts

/**
 * Normalize a file path for consistent handling
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Get the filename from a path without extension
 */
export function getBasename(path: string, withExtension = false): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  const filename = parts[parts.length - 1];

  if (withExtension) {
    return filename;
  }

  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

/**
 * Get the directory path from a file path
 */
export function getDirname(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

/**
 * Get file extension from path
 */
export function getExtension(path: string): string {
  const basename = getBasename(path, true);
  const dotIndex = basename.lastIndexOf('.');
  return dotIndex > 0 ? basename.slice(dotIndex + 1).toLowerCase() : '';
}

/**
 * Check if a file is a markdown file
 */
export function isMarkdownFile(path: string): boolean {
  const ext = getExtension(path);
  return ext === 'md' || ext === 'markdown';
}

/**
 * Join path segments
 */
export function joinPaths(...segments: string[]): string {
  return normalizePath(segments.filter(Boolean).join('/'));
}

/**
 * Get relative path from base to target
 */
export function getRelativePath(basePath: string, targetPath: string): string {
  const base = normalizePath(basePath).split('/').filter(Boolean);
  const target = normalizePath(targetPath).split('/').filter(Boolean);

  // Find common prefix
  let commonLength = 0;
  while (
    commonLength < base.length &&
    commonLength < target.length &&
    base[commonLength] === target[commonLength]
  ) {
    commonLength++;
  }

  // Build relative path
  const ups = base.slice(commonLength).map(() => '..');
  const downs = target.slice(commonLength);

  return [...ups, ...downs].join('/') || '.';
}
