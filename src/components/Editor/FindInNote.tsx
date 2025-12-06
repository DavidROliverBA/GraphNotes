import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, Replace } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';

interface Match {
  index: number;
  length: number;
  line: number;
  lineContent: string;
}

export function FindInNote() {
  const { showFindInNote, setShowFindInNote } = useUIStore();
  const { currentNote, updateCurrentNoteContent } = useNoteStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (showFindInNote) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [showFindInNote]);

  // Find matches when search term changes
  useEffect(() => {
    if (!currentNote?.content || !searchTerm) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const content = currentNote.content;
    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    const searchContent = caseSensitive ? content : content.toLowerCase();
    const newMatches: Match[] = [];

    let index = 0;
    while ((index = searchContent.indexOf(term, index)) !== -1) {
      // Find line number
      const beforeMatch = content.substring(0, index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;
      const lineStart = beforeMatch.lastIndexOf('\n') + 1;
      const lineEnd = content.indexOf('\n', index);
      const lineContent = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);

      newMatches.push({
        index,
        length: searchTerm.length,
        line: lineNumber,
        lineContent,
      });

      index += searchTerm.length;
    }

    setMatches(newMatches);
    if (newMatches.length > 0 && currentMatchIndex >= newMatches.length) {
      setCurrentMatchIndex(0);
    }
  }, [searchTerm, currentNote?.content, caseSensitive]);

  const handleClose = useCallback(() => {
    setShowFindInNote(false);
    setSearchTerm('');
    setReplaceTerm('');
    setMatches([]);
    setCurrentMatchIndex(0);
  }, [setShowFindInNote]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showFindInNote) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goToNextMatch();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      goToPreviousMatch();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
      e.preventDefault();
      setShowReplace(true);
    }
  }, [showFindInNote, handleClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goToNextMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const goToPreviousMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const replaceCurrentMatch = () => {
    if (!currentNote?.content || matches.length === 0) return;

    const match = matches[currentMatchIndex];
    const before = currentNote.content.substring(0, match.index);
    const after = currentNote.content.substring(match.index + match.length);
    const newContent = before + replaceTerm + after;

    updateCurrentNoteContent(newContent);
  };

  const replaceAllMatches = () => {
    if (!currentNote?.content || matches.length === 0) return;

    let newContent = currentNote.content;
    if (caseSensitive) {
      newContent = newContent.split(searchTerm).join(replaceTerm);
    } else {
      const regex = new RegExp(escapeRegex(searchTerm), 'gi');
      newContent = newContent.replace(regex, replaceTerm);
    }

    updateCurrentNoteContent(newContent);
  };

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (!showFindInNote) return null;

  return (
    <div className="absolute top-0 right-4 z-50 bg-bg-primary border border-border-default rounded-lg shadow-xl overflow-hidden">
      {/* Find row */}
      <div className="flex items-center gap-2 p-2">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Find in note..."
          className="w-64 px-3 py-1.5 text-sm bg-bg-secondary border border-border-subtle rounded focus:border-accent-primary focus:outline-none"
        />

        {/* Match counter */}
        <span className="text-xs text-text-tertiary min-w-[60px]">
          {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : 'No results'}
        </span>

        {/* Navigation buttons */}
        <button
          onClick={goToPreviousMatch}
          disabled={matches.length === 0}
          className="p-1 rounded hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        </button>
        <button
          onClick={goToNextMatch}
          disabled={matches.length === 0}
          className="p-1 rounded hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next match (Enter)"
        >
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        </button>

        {/* Options */}
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            caseSensitive
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'text-text-tertiary hover:bg-bg-tertiary'
          }`}
          title="Case sensitive"
        >
          Aa
        </button>

        {/* Toggle replace */}
        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1 rounded transition-colors ${
            showReplace
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'text-text-tertiary hover:bg-bg-tertiary'
          }`}
          title="Toggle replace (Cmd+H)"
        >
          <Replace className="w-4 h-4" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-bg-tertiary"
          title="Close (Escape)"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-2 p-2 border-t border-border-subtle">
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder="Replace with..."
            className="w-64 px-3 py-1.5 text-sm bg-bg-secondary border border-border-subtle rounded focus:border-accent-primary focus:outline-none"
          />

          <button
            onClick={replaceCurrentMatch}
            disabled={matches.length === 0}
            className="px-3 py-1.5 text-xs text-text-primary bg-bg-tertiary hover:bg-bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Replace
          </button>
          <button
            onClick={replaceAllMatches}
            disabled={matches.length === 0}
            className="px-3 py-1.5 text-xs text-white bg-accent-primary hover:bg-accent-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Replace All
          </button>
        </div>
      )}

      {/* Match preview */}
      {matches.length > 0 && (
        <div className="p-2 border-t border-border-subtle max-h-32 overflow-y-auto">
          <div className="text-xs text-text-tertiary mb-1">
            Line {matches[currentMatchIndex]?.line}
          </div>
          <div className="text-sm text-text-secondary font-mono whitespace-pre-wrap break-words">
            {matches[currentMatchIndex]?.lineContent}
          </div>
        </div>
      )}
    </div>
  );
}
