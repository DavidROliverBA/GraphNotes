// src/lib/tauri/commands.ts
// TypeScript bindings for Tauri commands

import { invoke } from '@tauri-apps/api/core';

export interface FileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileEntry[];
}

export interface FileContent {
  path: string;
  content: string;
  exists: boolean;
}

/**
 * Read the contents of a file
 */
export async function readFile(path: string): Promise<FileContent> {
  return invoke<FileContent>('read_file', { path });
}

/**
 * Write content to a file (creates parent directories if needed)
 */
export async function writeFile(path: string, content: string): Promise<void> {
  return invoke('write_file', { path, content });
}

/**
 * Delete a file or directory
 */
export async function deleteFile(path: string): Promise<void> {
  return invoke('delete_file', { path });
}

/**
 * Rename/move a file
 */
export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  return invoke('rename_file', { oldPath, newPath });
}

/**
 * Create a new directory
 */
export async function createDirectory(path: string): Promise<void> {
  return invoke('create_directory', { path });
}

/**
 * Check if a path exists
 */
export async function pathExists(path: string): Promise<boolean> {
  return invoke<boolean>('path_exists', { path });
}

/**
 * List directory contents (non-recursive, single level)
 */
export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('list_directory', { path });
}

/**
 * List all markdown files in a directory (recursive)
 */
export async function listMarkdownFiles(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('list_markdown_files', { path });
}

/**
 * Build a file tree structure for a directory
 */
export async function getFileTree(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('get_file_tree', { path });
}

/**
 * Initialize a new vault with the .graphnotes directory
 */
export async function initVault(path: string): Promise<void> {
  return invoke('init_vault', { path });
}

/**
 * Check if a path is a valid vault (has .graphnotes directory)
 */
export async function isVault(path: string): Promise<boolean> {
  return invoke<boolean>('is_vault', { path });
}
