import { useMemo } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Link2Off } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';

interface LinkInfo {
  noteId: string;
  noteTitle: string;
  notePath: string;
  linkName?: string;
  context?: string;
}

export function BacklinksPanel() {
  const { showBacklinksPanel, setShowBacklinksPanel } = useUIStore();
  const { currentNote, notesList, notes, loadNote } = useNoteStore();

  // Calculate outgoing links (links FROM this note)
  const outgoingLinks = useMemo((): LinkInfo[] => {
    if (!currentNote?.frontmatter.links) return [];

    const results: LinkInfo[] = [];
    for (const link of currentNote.frontmatter.links) {
      const targetNote = notesList.find(n => n.id === link.target);
      if (targetNote) {
        results.push({
          noteId: targetNote.id,
          noteTitle: targetNote.title,
          notePath: targetNote.filepath,
          linkName: link.name,
        });
      }
    }
    return results;
  }, [currentNote, notesList]);

  // Calculate backlinks (links TO this note)
  const backlinks = useMemo((): LinkInfo[] => {
    if (!currentNote) return [];

    const results: LinkInfo[] = [];

    for (const [filepath, note] of notes) {
      if (filepath === currentNote.filepath) continue;

      // Check if this note links to current note
      const linkToCurrentNote = note.frontmatter.links?.find(l => l.target === currentNote.id);
      if (linkToCurrentNote) {
        results.push({
          noteId: note.id,
          noteTitle: note.frontmatter.title,
          notePath: filepath,
          linkName: linkToCurrentNote.name,
        });
      }

      // Also check for wikilinks in content
      const wikiLinkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
      let match;
      while ((match = wikiLinkPattern.exec(note.content)) !== null) {
        const linkTarget = match[1];
        // Check if this links to current note by title
        if (
          linkTarget.toLowerCase() === currentNote.frontmatter.title.toLowerCase() ||
          linkTarget.toLowerCase() === currentNote.filepath.split('/').pop()?.replace('.md', '').toLowerCase()
        ) {
          // Avoid duplicates
          if (!results.some(r => r.noteId === note.id)) {
            // Get context around the link
            const startContext = Math.max(0, match.index - 50);
            const endContext = Math.min(note.content.length, match.index + match[0].length + 50);
            const context = '...' + note.content.substring(startContext, endContext) + '...';

            results.push({
              noteId: note.id,
              noteTitle: note.frontmatter.title,
              notePath: filepath,
              context: context.replace(/\n/g, ' '),
            });
          }
        }
      }
    }

    return results;
  }, [currentNote, notes]);

  // Calculate unlinked mentions
  const unlinkedMentions = useMemo((): LinkInfo[] => {
    if (!currentNote) return [];

    const results: LinkInfo[] = [];
    const currentTitle = currentNote.frontmatter.title.toLowerCase();

    for (const [filepath, note] of notes) {
      if (filepath === currentNote.filepath) continue;

      // Skip if already a backlink
      if (backlinks.some(b => b.noteId === note.id)) continue;

      // Check if note content mentions current note's title (case insensitive)
      const contentLower = note.content.toLowerCase();
      const titleIndex = contentLower.indexOf(currentTitle);

      if (titleIndex !== -1) {
        // Get context around the mention
        const startContext = Math.max(0, titleIndex - 30);
        const endContext = Math.min(note.content.length, titleIndex + currentTitle.length + 30);
        const context = '...' + note.content.substring(startContext, endContext) + '...';

        results.push({
          noteId: note.id,
          noteTitle: note.frontmatter.title,
          notePath: filepath,
          context: context.replace(/\n/g, ' '),
        });
      }
    }

    return results;
  }, [currentNote, notes, backlinks]);

  const handleOpenNote = (filepath: string) => {
    loadNote(filepath);
    setShowBacklinksPanel(false);
  };

  if (!showBacklinksPanel || !currentNote) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-bg-primary border-l border-border-default shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Links</h2>
        <button
          onClick={() => setShowBacklinksPanel(false)}
          className="p-1 rounded hover:bg-bg-tertiary transition-colors"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Outgoing Links */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-4 h-4 text-accent-primary" />
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Outgoing Links ({outgoingLinks.length})
            </h3>
          </div>
          {outgoingLinks.length === 0 ? (
            <p className="text-sm text-text-tertiary">No outgoing links</p>
          ) : (
            <div className="space-y-2">
              {outgoingLinks.map((link) => (
                <button
                  key={link.noteId}
                  onClick={() => handleOpenNote(link.notePath)}
                  className="w-full text-left p-2 rounded bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                >
                  <div className="text-sm text-text-primary font-medium truncate">
                    {link.noteTitle}
                  </div>
                  {link.linkName && (
                    <div className="text-xs text-accent-primary mt-0.5">
                      {link.linkName}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Backlinks */}
        <div className="p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownLeft className="w-4 h-4 text-accent-success" />
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Backlinks ({backlinks.length})
            </h3>
          </div>
          {backlinks.length === 0 ? (
            <p className="text-sm text-text-tertiary">No backlinks</p>
          ) : (
            <div className="space-y-2">
              {backlinks.map((link) => (
                <button
                  key={link.noteId}
                  onClick={() => handleOpenNote(link.notePath)}
                  className="w-full text-left p-2 rounded bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                >
                  <div className="text-sm text-text-primary font-medium truncate">
                    {link.noteTitle}
                  </div>
                  {link.linkName && (
                    <div className="text-xs text-accent-success mt-0.5">
                      {link.linkName}
                    </div>
                  )}
                  {link.context && (
                    <div className="text-xs text-text-tertiary mt-1 line-clamp-2">
                      {link.context}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Unlinked Mentions */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2Off className="w-4 h-4 text-text-tertiary" />
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Unlinked Mentions ({unlinkedMentions.length})
            </h3>
          </div>
          {unlinkedMentions.length === 0 ? (
            <p className="text-sm text-text-tertiary">No unlinked mentions</p>
          ) : (
            <div className="space-y-2">
              {unlinkedMentions.map((link) => (
                <button
                  key={link.noteId}
                  onClick={() => handleOpenNote(link.notePath)}
                  className="w-full text-left p-2 rounded bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                >
                  <div className="text-sm text-text-primary font-medium truncate">
                    {link.noteTitle}
                  </div>
                  {link.context && (
                    <div className="text-xs text-text-tertiary mt-1 line-clamp-2">
                      {link.context}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
