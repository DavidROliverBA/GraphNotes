import matter from 'gray-matter';
import { Note, NoteFrontmatter, createDefaultFrontmatter } from './types';

export function parseNote(filepath: string, rawContent: string): Note {
  const { data, content } = matter(rawContent);

  // Ensure we have valid frontmatter
  const frontmatter = validateFrontmatter(data, filepath);

  return {
    id: frontmatter.id,
    filepath,
    frontmatter,
    content: content.trim(),
    rawContent,
  };
}

export function validateFrontmatter(
  data: Record<string, unknown>,
  filepath: string
): NoteFrontmatter {
  // Extract title from filename if not in frontmatter
  const filename = filepath.split('/').pop() || 'Untitled';
  const titleFromFile = filename.replace(/\.md$/, '');

  const now = new Date().toISOString();

  return {
    id: typeof data.id === 'string' ? data.id : crypto.randomUUID(),
    title: typeof data.title === 'string' ? data.title : titleFromFile,
    created: typeof data.created === 'string' ? data.created : now,
    modified: typeof data.modified === 'string' ? data.modified : now,
    superTags: Array.isArray(data.superTags) ? data.superTags : undefined,
    tagAttributes:
      typeof data.tagAttributes === 'object' && data.tagAttributes !== null
        ? (data.tagAttributes as NoteFrontmatter['tagAttributes'])
        : undefined,
    links: Array.isArray(data.links) ? data.links : undefined,
  };
}

export function serializeNote(note: Note): string {
  const frontmatterObj: Record<string, unknown> = {
    id: note.frontmatter.id,
    title: note.frontmatter.title,
    created: note.frontmatter.created,
    modified: new Date().toISOString(),
  };

  if (note.frontmatter.superTags && note.frontmatter.superTags.length > 0) {
    frontmatterObj.superTags = note.frontmatter.superTags;
  }

  if (note.frontmatter.tagAttributes) {
    frontmatterObj.tagAttributes = note.frontmatter.tagAttributes;
  }

  if (note.frontmatter.links && note.frontmatter.links.length > 0) {
    frontmatterObj.links = note.frontmatter.links;
  }

  return matter.stringify(note.content, frontmatterObj);
}

export function createNewNote(filepath: string, title?: string): Note {
  const filename = filepath.split('/').pop() || 'Untitled';
  const noteTitle = title || filename.replace(/\.md$/, '');
  const frontmatter = createDefaultFrontmatter(noteTitle);

  const content = `# ${noteTitle}\n\n`;

  return {
    id: frontmatter.id,
    filepath,
    frontmatter,
    content,
    rawContent: serializeNote({
      id: frontmatter.id,
      filepath,
      frontmatter,
      content,
      rawContent: '',
    }),
  };
}

export function extractTitle(content: string, fallback: string): string {
  // Try to extract title from first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Try first non-empty line
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('---')) {
      return trimmed.slice(0, 100);
    }
  }

  return fallback;
}
