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

// Check if we're running in Tauri or in test/browser mode
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// Lazily import invoke only when needed (in Tauri environment)
let invokeCache: typeof import('@tauri-apps/api/core').invoke | null = null;
async function getInvoke() {
  if (!invokeCache) {
    const core = await import('@tauri-apps/api/core');
    invokeCache = core.invoke;
  }
  return invokeCache;
}

// Mock file system for testing (stored in memory)
const mockFs = {
  files: new Map<string, string>(),
  directories: new Set<string>(['/test-vault', '/test-vault/.graphnotes']),
};

// Initialize mock data for testing
function initMockFs() {
  if (mockFs.files.size > 0) return;

  const now = new Date().toISOString();

  // Create .graphnotes config
  mockFs.directories.add('/test-vault/.graphnotes');
  mockFs.directories.add('/test-vault/.graphnotes/supertags');
  mockFs.files.set('/test-vault/.graphnotes/config.json', JSON.stringify({ version: '1.0.0', created: now }));
  mockFs.files.set('/test-vault/.graphnotes/events.jsonl', '');

  // Create sample notes with various link styles for testing edge features
  const welcomeNote = `---
id: welcome-note-id
title: Welcome to GraphNotes
created: ${now}
modified: ${now}
links:
  - id: link-welcome-to-concepts
    target: concepts-note-id
    name: introduces
    appearance:
      direction: forward
      colour: "#22c55e"
      style: solid
      thickness: normal
---

# Welcome to GraphNotes

This is your test vault. Start by creating notes and linking them together with [[wikilinks]].

## Quick Tips

- Press \`Cmd+N\` to create a new note
- Type \`[[\` to create a link to another note
- Press \`Cmd+K\` to search your notes

Learn about [[Core Concepts]] to get started.
`;
  mockFs.files.set('/test-vault/Welcome.md', welcomeNote);

  const testNote = `---
id: test-note-id
title: Test Note
created: ${now}
modified: ${now}
links:
  - id: link-test-to-welcome
    target: welcome-note-id
    name: references
    appearance:
      direction: forward
      colour: "#6366f1"
      style: solid
      thickness: normal
---

# Test Note

This is a test note for E2E testing.

- Item 1
- Item 2
- Item 3

Link to [[Welcome to GraphNotes]].
`;
  mockFs.files.set('/test-vault/Test Note.md', testNote);

  // Add Core Concepts note with different edge styles
  const conceptsNote = `---
id: concepts-note-id
title: Core Concepts
created: ${now}
modified: ${now}
links:
  - id: link-concepts-to-advanced
    target: advanced-note-id
    name: extends
    appearance:
      direction: forward
      colour: "#3b82f6"
      style: dashed
      thickness: normal
  - id: link-concepts-to-welcome
    target: welcome-note-id
    name: related to
    appearance:
      direction: bidirectional
      colour: "#a855f7"
      style: solid
      thickness: thin
---

# Core Concepts

This note explains the core concepts of GraphNotes.

## Wikilinks

Use [[double brackets]] to create links between notes.

## Bidirectional Links

Links work both ways - see [[Welcome to GraphNotes]] and [[Advanced Topics]].
`;
  mockFs.files.set('/test-vault/Core Concepts.md', conceptsNote);

  // Add Advanced Topics note with thick edges
  const advancedNote = `---
id: advanced-note-id
title: Advanced Topics
created: ${now}
modified: ${now}
links:
  - id: link-advanced-to-test
    target: test-note-id
    name: contradicts
    appearance:
      direction: forward
      colour: "#ef4444"
      style: dotted
      thickness: thick
---

# Advanced Topics

Advanced features for power users.

## Custom Edge Styles

Edges can have different:
- **Directions**: forward, backward, bidirectional
- **Colors**: any hex color
- **Styles**: solid, dashed, dotted
- **Thickness**: thin, normal, thick

See also [[Test Note]] for examples.
`;
  mockFs.files.set('/test-vault/Advanced Topics.md', advancedNote);

  // Add an orphan note (no links) for testing orphan detection
  const orphanNote = `---
id: orphan-note-id
title: Orphan Note
created: ${now}
modified: ${now}
---

# Orphan Note

This note has no links to other notes.
It should appear in the graph as an isolated node.
`;
  mockFs.files.set('/test-vault/Orphan Note.md', orphanNote);
}

// Mock implementations
async function mockReadDirectory(path: string): Promise<FileEntry[]> {
  initMockFs();
  const entries: FileEntry[] = [];
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  // Get files in this directory
  for (const [filePath, content] of mockFs.files) {
    if (filePath.startsWith(normalizedPath + '/')) {
      const relativePath = filePath.slice(normalizedPath.length + 1);
      if (!relativePath.includes('/')) {
        const name = relativePath;
        const ext = name.includes('.') ? name.split('.').pop() || null : null;
        entries.push({
          name,
          path: filePath,
          is_directory: false,
          is_file: true,
          extension: ext,
          size: content.length,
          modified: Date.now(),
        });
      }
    }
  }

  // Get subdirectories
  for (const dirPath of mockFs.directories) {
    if (dirPath.startsWith(normalizedPath + '/') && dirPath !== normalizedPath) {
      const relativePath = dirPath.slice(normalizedPath.length + 1);
      if (!relativePath.includes('/')) {
        entries.push({
          name: relativePath,
          path: dirPath,
          is_directory: true,
          is_file: false,
          extension: null,
          size: null,
          modified: Date.now(),
        });
      }
    }
  }

  return entries.sort((a, b) => {
    if (a.is_directory && !b.is_directory) return -1;
    if (!a.is_directory && b.is_directory) return 1;
    return a.name.localeCompare(b.name);
  });
}

async function mockReadFile(path: string): Promise<FileContent> {
  initMockFs();
  const content = mockFs.files.get(path);
  if (content === undefined) {
    throw new Error(`File does not exist: ${path}`);
  }
  return { path, content, size: content.length };
}

async function mockWriteFile(path: string, content: string): Promise<void> {
  initMockFs();
  mockFs.files.set(path, content);
}

async function mockCreateFile(path: string, content?: string): Promise<void> {
  initMockFs();
  mockFs.files.set(path, content || '');
}

async function mockDeleteFile(path: string): Promise<void> {
  initMockFs();
  mockFs.files.delete(path);
  mockFs.directories.delete(path);
}

async function mockRenameFile(oldPath: string, newPath: string): Promise<void> {
  initMockFs();
  const content = mockFs.files.get(oldPath);
  if (content !== undefined) {
    mockFs.files.delete(oldPath);
    mockFs.files.set(newPath, content);
  }
}

async function mockFileExists(path: string): Promise<boolean> {
  initMockFs();
  return mockFs.files.has(path) || mockFs.directories.has(path);
}

async function mockCreateDirectory(path: string): Promise<void> {
  initMockFs();
  mockFs.directories.add(path);
}

// Exported functions that use Tauri or mocks depending on environment
export async function readDirectory(path: string): Promise<FileEntry[]> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke<FileEntry[]>('read_directory', { path });
  }
  return mockReadDirectory(path);
}

export async function readFile(path: string): Promise<FileContent> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke<FileContent>('read_file', { path });
  }
  return mockReadFile(path);
}

export async function writeFile(path: string, content: string): Promise<void> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke('write_file', { path, content });
  }
  return mockWriteFile(path, content);
}

export async function createFile(path: string, content?: string): Promise<void> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke('create_file', { path, content });
  }
  return mockCreateFile(path, content);
}

export async function deleteFile(path: string): Promise<void> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke('delete_file', { path });
  }
  return mockDeleteFile(path);
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke('rename_file', { oldPath, newPath });
  }
  return mockRenameFile(oldPath, newPath);
}

export async function fileExists(path: string): Promise<boolean> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke<boolean>('file_exists', { path });
  }
  return mockFileExists(path);
}

export async function createDirectory(path: string): Promise<void> {
  if (isTauriEnvironment()) {
    const invoke = await getInvoke();
    return invoke('create_directory', { path });
  }
  return mockCreateDirectory(path);
}
