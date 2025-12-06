import { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Link,
  Hash,
  Clock,
  CheckCircle,
  Loader2,
  Trash2,
  Edit3,
  Copy,
  Search,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';

interface EditorToolbarProps {
  title: string;
  saving: boolean;
  modified: string;
}

export function EditorToolbar({ title, saving, modified }: EditorToolbarProps) {
  const {
    showPropertiesPanel,
    setShowPropertiesPanel,
    showBacklinksPanel,
    setShowBacklinksPanel,
    setShowDeleteConfirmation,
    setShowFindInNote,
    setRenamingNoteId,
  } = useUIStore();
  const { currentNote, duplicateNote } = useNoteStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }

    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    // Show date
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-bg-secondary">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-text-primary truncate max-w-md">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          {saving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3 text-accent-success" />
              <span>Saved</span>
            </>
          )}
        </div>

        <span className="text-border-default">|</span>

        {/* Last modified */}
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <Clock className="w-3 h-3" />
          <span>{formatDate(modified)}</span>
        </div>

        <span className="text-border-default">|</span>

        {/* Properties toggle */}
        <button
          onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded text-xs
            transition-colors duration-fast
            ${showPropertiesPanel
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }
          `}
        >
          <Hash className="w-3 h-3" />
          <span>Properties</span>
        </button>

        {/* Backlinks */}
        <button
          onClick={() => setShowBacklinksPanel(!showBacklinksPanel)}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded text-xs
            transition-colors duration-fast
            ${showBacklinksPanel
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }
          `}
        >
          <Link className="w-3 h-3" />
          <span>Links</span>
        </button>

        {/* More options */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`
              p-1 rounded transition-colors duration-fast
              ${showDropdown
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }
            `}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-bg-primary border border-border-default rounded-lg shadow-xl z-50">
              <button
                onClick={() => {
                  setShowFindInNote(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary"
              >
                <Search className="w-4 h-4" />
                <span>Find in Note</span>
                <span className="ml-auto text-xs text-text-tertiary">⌘F</span>
              </button>

              <div className="my-1 border-t border-border-subtle" />

              <button
                onClick={() => {
                  if (currentNote) {
                    setRenamingNoteId(currentNote.id);
                  }
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary"
              >
                <Edit3 className="w-4 h-4" />
                <span>Rename</span>
                <span className="ml-auto text-xs text-text-tertiary">F2</span>
              </button>

              <button
                onClick={async () => {
                  if (currentNote) {
                    await duplicateNote(currentNote.filepath);
                  }
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate</span>
              </button>

              <div className="my-1 border-t border-border-subtle" />

              <button
                onClick={() => {
                  setShowDeleteConfirmation(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-accent-error hover:bg-accent-error/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
                <span className="ml-auto text-xs">⌘⌫</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
