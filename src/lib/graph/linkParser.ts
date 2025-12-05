export interface WikilinkMatch {
  raw: string;
  target: string;
  displayText: string | null;
  start: number;
  end: number;
}

// Match [[target]] or [[target|display text]]
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function extractWikilinks(content: string): WikilinkMatch[] {
  const matches: WikilinkMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    matches.push({
      raw: match[0],
      target: match[1].trim(),
      displayText: match[2]?.trim() || null,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
}

export function createWikilink(target: string, displayText?: string): string {
  if (displayText && displayText !== target) {
    return `[[${target}|${displayText}]]`;
  }
  return `[[${target}]]`;
}

export function resolveWikilinkTarget(
  target: string,
  notes: Array<{ id: string; title: string; filepath: string }>
): { id: string; title: string; filepath: string } | null {
  const normalizedTarget = target.toLowerCase();

  // First try exact match on ID
  const idMatch = notes.find((note) => note.id === target);
  if (idMatch) return idMatch;

  // Then try exact match on title
  const titleMatch = notes.find(
    (note) => note.title.toLowerCase() === normalizedTarget
  );
  if (titleMatch) return titleMatch;

  // Then try match on filename (without extension)
  const filenameMatch = notes.find((note) => {
    const filename = note.filepath.split('/').pop()?.replace('.md', '') || '';
    return filename.toLowerCase() === normalizedTarget;
  });
  if (filenameMatch) return filenameMatch;

  // Fuzzy match (contains)
  const fuzzyMatch = notes.find(
    (note) =>
      note.title.toLowerCase().includes(normalizedTarget) ||
      note.filepath.toLowerCase().includes(normalizedTarget)
  );

  return fuzzyMatch || null;
}

export function searchNotes(
  query: string,
  notes: Array<{ id: string; title: string; filepath: string }>,
  limit: number = 10
): Array<{ id: string; title: string; filepath: string; score: number }> {
  if (!query.trim()) {
    return notes.slice(0, limit).map((note) => ({ ...note, score: 1 }));
  }

  const normalizedQuery = query.toLowerCase();

  const results = notes
    .map((note) => {
      const normalizedTitle = note.title.toLowerCase();
      const filename =
        note.filepath.split('/').pop()?.replace('.md', '').toLowerCase() || '';

      let score = 0;

      // Exact match on title
      if (normalizedTitle === normalizedQuery) {
        score = 100;
      }
      // Starts with query
      else if (normalizedTitle.startsWith(normalizedQuery)) {
        score = 80;
      }
      // Filename exact match
      else if (filename === normalizedQuery) {
        score = 70;
      }
      // Filename starts with
      else if (filename.startsWith(normalizedQuery)) {
        score = 60;
      }
      // Title contains
      else if (normalizedTitle.includes(normalizedQuery)) {
        score = 40;
      }
      // Filename contains
      else if (filename.includes(normalizedQuery)) {
        score = 30;
      }

      return { ...note, score };
    })
    .filter((note) => note.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}
