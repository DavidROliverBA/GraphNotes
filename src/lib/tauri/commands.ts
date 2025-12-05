import { invoke } from '@tauri-apps/api/core';

export interface FileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  is_file: boolean;
  extension: string | null;
  size: number | null;
  modified: number | null;
}

export interface FileContent {
  path: string;
  content: string;
  size: number;
}

export async function readDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('read_directory', { path });
}

export async function readFile(path: string): Promise<FileContent> {
  return invoke<FileContent>('read_file', { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke('write_file', { path, content });
}

export async function createFile(path: string, content?: string): Promise<void> {
  return invoke('create_file', { path, content });
}

export async function deleteFile(path: string): Promise<void> {
  return invoke('delete_file', { path });
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  return invoke('rename_file', { oldPath, newPath });
}

export async function fileExists(path: string): Promise<boolean> {
  return invoke<boolean>('file_exists', { path });
}

export async function createDirectory(path: string): Promise<void> {
  return invoke('create_directory', { path });
}
