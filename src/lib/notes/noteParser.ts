// src/lib/notes/noteParser.ts

import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';
import { Note, NoteFrontmatter, LinkDefinition } from './types';

/**
 * Parse a markdown file with YAML frontmatter into a Note object
 */
export function parseNote(rawContent: string, filepath: string): Note {
  const { data, content } = matter(rawContent);

  // Ensure required frontmatter fields exist
  const frontmatter: NoteFrontmatter = {
    id: data.id || uuidv4(),
    title: data.title || extractTitleFromContent(content) || getFilenameWithoutExtension(filepath),
    created: data.created || new Date().toISOString(),
    modified: data.modified || new Date().toISOString(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    links: parseLinks(data.links),
  };

  return {
    id: frontmatter.id,
    filepath,
    frontmatter,
    content: content.trim(),
    rawContent,
  };
}

/**
 * Serialize a Note object back to markdown with YAML frontmatter
 */
export function serializeNote(note: Note): string {
  const frontmatterData: Record<string, unknown> = {
    id: note.frontmatter.id,
    title: note.frontmatter.title,
    created: note.frontmatter.created,
    modified: note.frontmatter.modified,
  };

  // Only include optional fields if they have values
  if (note.frontmatter.tags && note.frontmatter.tags.length > 0) {
    frontmatterData.tags = note.frontmatter.tags;
  }

  if (note.frontmatter.links && note.frontmatter.links.length > 0) {
    frontmatterData.links = note.frontmatter.links;
  }

  return matter.stringify(note.content, frontmatterData);
}

/**
 * Generate a default title for new notes
 */
function generateDefaultTitle(): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `A Lovely New Page - ${dateStr}`;
}

/**
 * Create a new empty note with default frontmatter
 */
export function createEmptyNote(filepath: string, title?: string): Note {
  const now = new Date().toISOString();
  const id = uuidv4();

  const frontmatter: NoteFrontmatter = {
    id,
    title: title || generateDefaultTitle(),
    created: now,
    modified: now,
    tags: [],
    links: [],
  };

  const content = `# ${frontmatter.title}\n\n`;

  return {
    id,
    filepath,
    frontmatter,
    content,
    rawContent: serializeNote({ id, filepath, frontmatter, content, rawContent: '' }),
  };
}

/**
 * Extract wikilinks from markdown content
 */
export function extractWikilinks(content: string): Array<{ target: string; displayText?: string }> {
  const wikilinks: Array<{ target: string; displayText?: string }> = [];
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    wikilinks.push({
      target: match[1].trim(),
      displayText: match[2]?.trim(),
    });
  }

  return wikilinks;
}

/**
 * Parse links from frontmatter data
 */
function parseLinks(linksData: unknown): LinkDefinition[] {
  if (!Array.isArray(linksData)) {
    return [];
  }

  return linksData
    .filter((link): link is Record<string, unknown> => typeof link === 'object' && link !== null)
    .map((link) => ({
      target: String(link.target || ''),
      name: String(link.name || 'relates to'),
      description: link.description ? String(link.description) : undefined,
      created: String(link.created || new Date().toISOString()),
    }))
    .filter((link) => link.target !== '');
}

/**
 * Extract title from the first H1 heading in content
 */
function extractTitleFromContent(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Get filename without extension from a path
 */
function getFilenameWithoutExtension(filepath: string): string {
  const parts = filepath.split('/');
  const filename = parts[parts.length - 1];
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

/**
 * Convert HTML content from Tiptap back to markdown (basic conversion)
 */
export function htmlToMarkdown(html: string): string {
  // This is a basic conversion - for production, use a proper HTML to Markdown converter
  let markdown = html;

  // Replace HTML tags with markdown equivalents
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
  markdown = markdown.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, '`$1`');

  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n');

  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n\n');

  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

/**
 * Convert markdown to HTML for Tiptap (basic conversion)
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // This is a basic conversion - Tiptap handles most markdown natively
  // Just ensure paragraphs are properly wrapped
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      p = p.trim();
      if (!p) return '';
      // Don't wrap headings or already-wrapped content
      if (p.startsWith('#') || p.startsWith('<')) return p;
      return `<p>${p}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}
