import { useState } from 'react';
import {
  MoreHorizontal,
  Link,
  Hash,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface EditorToolbarProps {
  title: string;
  saving: boolean;
  modified: string;
}

export function EditorToolbar({ title, saving, modified }: EditorToolbarProps) {
  const [showProperties, setShowProperties] = useState(false);

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
          onClick={() => setShowProperties(!showProperties)}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded text-xs
            transition-colors duration-fast
            ${showProperties
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
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors duration-fast"
        >
          <Link className="w-3 h-3" />
          <span>Links</span>
        </button>

        {/* More options */}
        <button
          className="p-1 rounded text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors duration-fast"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
