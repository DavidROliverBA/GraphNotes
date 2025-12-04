// src/lib/graph/linkParser.ts

import { Note, LinkDefinition } from '../notes/types';
import { extractWikilinks } from '../notes/noteParser';

/**
 * Represents a resolved link with all metadata
 */
export interface ResolvedLink {
  sourceId: string;           // Source note ID
  targetId: string;           // Target note ID (resolved)
  targetRef: string;          // Original reference (filename, title, or ID)
  name: string;               // Relationship name
  description?: string;       // Optional description
  fromFrontmatter: boolean;   // Whether link is from frontmatter or inline
  displayText?: string;       // Display text for inline wikilinks
}

/**
 * Represents an unresolved link (target note not found)
 */
export interface UnresolvedLink {
  sourceId: string;
  targetRef: string;
  name: string;
  description?: string;
  fromFrontmatter: boolean;
  displayText?: string;
}

/**
 * Result of parsing all links from a note
 */
export interface ParsedLinks {
  resolved: ResolvedLink[];
  unresolved: UnresolvedLink[];
}

/**
 * Index structure for fast note lookup
 */
interface NoteIndex {
  byId: Map<string, Note>;
  byFilepath: Map<string, Note>;
  byFilename: Map<string, Note>;    // filename without extension
  byTitle: Map<string, Note>;        // lowercase title
}

/**
 * Build an index from notes for fast lookup
 */
export function buildNoteIndex(notes: Map<string, Note>): NoteIndex {
  const byId = new Map<string, Note>();
  const byFilepath = new Map<string, Note>();
  const byFilename = new Map<string, Note>();
  const byTitle = new Map<string, Note>();

  for (const note of notes.values()) {
    byId.set(note.id, note);
    byFilepath.set(note.filepath, note);

    // Extract filename without extension
    const filename = getFilenameWithoutExtension(note.filepath).toLowerCase();
    // Only set if not already mapped (first note wins for duplicates)
    if (!byFilename.has(filename)) {
      byFilename.set(filename, note);
    }

    // Index by lowercase title
    const titleKey = note.frontmatter.title.toLowerCase();
    if (!byTitle.has(titleKey)) {
      byTitle.set(titleKey, note);
    }
  }

  return { byId, byFilepath, byFilename, byTitle };
}

/**
 * Resolve a link target to a note ID
 * Resolution priority: ID > title match > exact filepath > exact filename > fuzzy title > fuzzy filename
 * Title-first approach: wikilinks like [[My Note Title]] resolve primarily by title
 */
export function resolveTarget(
  targetRef: string,
  index: NoteIndex
): Note | undefined {
  const ref = targetRef.trim();
  const refLower = ref.toLowerCase();

  // 1. Try exact ID match
  if (index.byId.has(ref)) {
    return index.byId.get(ref);
  }

  // 2. Try exact title match (case-insensitive) - PRIMARY resolution method
  if (index.byTitle.has(refLower)) {
    return index.byTitle.get(refLower);
  }

  // 3. Try exact filepath match
  if (index.byFilepath.has(ref)) {
    return index.byFilepath.get(ref);
  }

  // 4. Try filepath with .md extension
  if (index.byFilepath.has(`${ref}.md`)) {
    return index.byFilepath.get(`${ref}.md`);
  }

  // 5. Try exact filename match (case-insensitive)
  if (index.byFilename.has(refLower)) {
    return index.byFilename.get(refLower);
  }

  // 6. Try filename without extension
  const refWithoutExt = refLower.replace(/\.md$/, '');
  if (index.byFilename.has(refWithoutExt)) {
    return index.byFilename.get(refWithoutExt);
  }

  // 7. Fuzzy match on titles: find notes where title contains the ref
  for (const [title, note] of index.byTitle) {
    if (title.includes(refLower)) {
      return note;
    }
  }

  // 8. Fuzzy match on filenames: find notes where filename contains the ref
  for (const [filename, note] of index.byFilename) {
    if (filename.includes(refWithoutExt)) {
      return note;
    }
  }

  return undefined;
}

/**
 * Parse all links from a single note
 */
export function parseNoteLinks(
  note: Note,
  noteIndex: NoteIndex
): ParsedLinks {
  const resolved: ResolvedLink[] = [];
  const unresolved: UnresolvedLink[] = [];

  // 1. Process frontmatter links (named relationships)
  if (note.frontmatter.links && note.frontmatter.links.length > 0) {
    for (const link of note.frontmatter.links) {
      const targetNote = resolveTarget(link.target, noteIndex);

      if (targetNote) {
        resolved.push({
          sourceId: note.id,
          targetId: targetNote.id,
          targetRef: link.target,
          name: link.name,
          description: link.description,
          fromFrontmatter: true,
        });
      } else {
        unresolved.push({
          sourceId: note.id,
          targetRef: link.target,
          name: link.name,
          description: link.description,
          fromFrontmatter: true,
        });
      }
    }
  }

  // 2. Process inline wikilinks
  const wikilinks = extractWikilinks(note.content);

  for (const wikilink of wikilinks) {
    const targetNote = resolveTarget(wikilink.target, noteIndex);

    // Check if this link is already defined in frontmatter
    const existsInFrontmatter = resolved.some(
      (r) => r.targetRef === wikilink.target || (targetNote && r.targetId === targetNote.id)
    );

    // Only add inline links that aren't already in frontmatter
    if (!existsInFrontmatter) {
      if (targetNote) {
        resolved.push({
          sourceId: note.id,
          targetId: targetNote.id,
          targetRef: wikilink.target,
          name: 'relates to', // Default relationship for inline links
          fromFrontmatter: false,
          displayText: wikilink.displayText,
        });
      } else {
        unresolved.push({
          sourceId: note.id,
          targetRef: wikilink.target,
          name: 'relates to',
          fromFrontmatter: false,
          displayText: wikilink.displayText,
        });
      }
    }
  }

  return { resolved, unresolved };
}

/**
 * Parse all links from all notes and return a complete link map
 */
export function parseAllLinks(notes: Map<string, Note>): {
  allResolved: ResolvedLink[];
  allUnresolved: UnresolvedLink[];
  linksBySource: Map<string, ResolvedLink[]>;
  linksByTarget: Map<string, ResolvedLink[]>;
} {
  const noteIndex = buildNoteIndex(notes);
  const allResolved: ResolvedLink[] = [];
  const allUnresolved: UnresolvedLink[] = [];
  const linksBySource = new Map<string, ResolvedLink[]>();
  const linksByTarget = new Map<string, ResolvedLink[]>();

  for (const note of notes.values()) {
    const { resolved, unresolved } = parseNoteLinks(note, noteIndex);

    allResolved.push(...resolved);
    allUnresolved.push(...unresolved);

    // Group by source
    linksBySource.set(note.id, resolved);

    // Group by target
    for (const link of resolved) {
      const existing = linksByTarget.get(link.targetId) || [];
      existing.push(link);
      linksByTarget.set(link.targetId, existing);
    }
  }

  return { allResolved, allUnresolved, linksBySource, linksByTarget };
}

/**
 * Generate a unique edge ID from source, target, and relationship name
 */
export function generateEdgeId(
  sourceId: string,
  targetId: string,
  name: string
): string {
  // Use a combination that allows multiple edges with different names
  return `${sourceId}--${name.replace(/\s+/g, '_')}-->${targetId}`;
}

/**
 * Create a LinkDefinition for frontmatter from a resolved link
 */
export function createLinkDefinition(link: ResolvedLink): LinkDefinition {
  return {
    target: link.targetId, // Store by ID for reliability
    name: link.name,
    description: link.description,
    created: new Date().toISOString(),
  };
}

/**
 * Get the filename without extension from a filepath
 */
function getFilenameWithoutExtension(filepath: string): string {
  const parts = filepath.split('/');
  const filename = parts[parts.length - 1];
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

/**
 * Find all notes that reference a given note (backlinks)
 */
export function findBacklinks(
  targetNoteId: string,
  notes: Map<string, Note>
): ResolvedLink[] {
  const { linksByTarget } = parseAllLinks(notes);
  return linksByTarget.get(targetNoteId) || [];
}

/**
 * Find all notes that a given note references (outlinks)
 */
export function findOutlinks(
  sourceNoteId: string,
  notes: Map<string, Note>
): ResolvedLink[] {
  const note = notes.get(sourceNoteId);
  if (!note) return [];

  const noteIndex = buildNoteIndex(notes);
  const { resolved } = parseNoteLinks(note, noteIndex);
  return resolved;
}
