import { useEffect, useRef } from 'react';
import {
  FileText,
  Edit3,
  Copy,
  Trash2,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';

interface MenuItem {
  label: string;
  icon: typeof FileText;
  action: () => void;
  shortcut?: string;
  danger?: boolean;
  dividerAfter?: boolean;
}

export function ContextMenu() {
  const {
    contextMenu,
    closeContextMenu,
    setShowDeleteConfirmation,
    setRenamingNoteId,
  } = useUIStore();
  const { loadNote, notesList, duplicateNote } = useNoteStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (contextMenu.isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = contextMenu;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 8;
      }
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 8;
      }

      menuRef.current.style.left = `${x}px`;
      menuRef.current.style.top = `${y}px`;
    }
  }, [contextMenu]);

  if (!contextMenu.isOpen || !contextMenu.targetPath) return null;

  const targetNote = notesList.find(n => n.filepath === contextMenu.targetPath);
  const targetTitle = targetNote?.title || contextMenu.targetPath.split('/').pop()?.replace('.md', '') || 'Note';

  const handleOpen = () => {
    if (contextMenu.targetPath) {
      loadNote(contextMenu.targetPath);
    }
    closeContextMenu();
  };

  const handleRename = () => {
    if (targetNote?.id) {
      setRenamingNoteId(targetNote.id);
    }
    closeContextMenu();
  };

  const handleDuplicate = async () => {
    if (contextMenu.targetPath) {
      await duplicateNote(contextMenu.targetPath);
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (contextMenu.targetPath) {
      // Load the note first so it becomes currentNote
      loadNote(contextMenu.targetPath).then(() => {
        setShowDeleteConfirmation(true);
      });
    }
    closeContextMenu();
  };

  const handleCopyPath = () => {
    if (contextMenu.targetPath) {
      navigator.clipboard.writeText(contextMenu.targetPath);
    }
    closeContextMenu();
  };

  const handleRevealInFinder = () => {
    // This would need Tauri shell command - for now just copy path
    if (contextMenu.targetPath) {
      navigator.clipboard.writeText(contextMenu.targetPath);
    }
    closeContextMenu();
  };

  const fileMenuItems: MenuItem[] = [
    {
      label: 'Open',
      icon: FileText,
      action: handleOpen,
      shortcut: 'Enter',
    },
    {
      label: 'Rename',
      icon: Edit3,
      action: handleRename,
      shortcut: 'F2',
      dividerAfter: true,
    },
    {
      label: 'Duplicate',
      icon: Copy,
      action: handleDuplicate,
    },
    {
      label: 'Copy Path',
      icon: FolderOpen,
      action: handleCopyPath,
      dividerAfter: true,
    },
    {
      label: 'Reveal in Finder',
      icon: ExternalLink,
      action: handleRevealInFinder,
      dividerAfter: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      action: handleDelete,
      shortcut: '\u2318\u232B',
      danger: true,
    },
  ];

  const menuItems = contextMenu.targetType === 'file' ? fileMenuItems : fileMenuItems;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] py-1 bg-bg-primary border border-border-default rounded-lg shadow-xl"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {/* Header showing target */}
      <div className="px-3 py-1.5 text-xs text-text-tertiary border-b border-border-subtle mb-1 truncate">
        {targetTitle}
      </div>

      {menuItems.map((item, index) => (
        <div key={item.label}>
          <button
            onClick={item.action}
            className={`
              w-full flex items-center gap-2 px-3 py-1.5 text-sm
              transition-colors duration-fast
              ${item.danger
                ? 'text-accent-error hover:bg-accent-error/10'
                : 'text-text-primary hover:bg-bg-tertiary'
              }
            `}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-text-tertiary">{item.shortcut}</span>
            )}
          </button>
          {item.dividerAfter && index < menuItems.length - 1 && (
            <div className="my-1 border-t border-border-subtle" />
          )}
        </div>
      ))}
    </div>
  );
}
