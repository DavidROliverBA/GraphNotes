// src/lib/notes/types.ts

export interface LinkDefinition {
  target: string;                  // Target note ID or filename
  name: string;                    // Relationship name, e.g., "supports"
  description?: string;            // Optional description
  created: string;                 // ISO 8601
}

export interface NoteFrontmatter {
  id: string;                      // UUID, immutable
  title: string;
  created: string;                 // ISO 8601
  modified: string;                // ISO 8601
  tags?: string[];
  links?: LinkDefinition[];        // Named outbound links
}

export interface Note {
  id: string;
  filepath: string;                // Relative to vault root
  frontmatter: NoteFrontmatter;
  content: string;                 // Markdown body (without frontmatter)
  rawContent: string;              // Full file content
}

export interface NoteFile {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: NoteFile[];
}
