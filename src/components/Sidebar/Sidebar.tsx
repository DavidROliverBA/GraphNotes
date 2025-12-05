import { useState } from 'react';
import {
  Search,
  Star,
  Clock,
  FolderTree,
  Plus,
  Settings,
  CalendarDays,
  Hash,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSuperTagList } from '../../stores/superTagStore';
import { useNoteStore } from '../../stores/noteStore';
import { FileTree } from './FileTree';

export function Sidebar() {
  const { setQuickSearchOpen } = useUIStore();
  const { currentVault } = useSettingsStore();
  const superTagList = useSuperTagList();
  const { notes } = useNoteStore();
  const [superTagsExpanded, setSuperTagsExpanded] = useState(true);

  const handleSearchFocus = () => {
    setQuickSearchOpen(true);
  };

  // Get note count for each super tag
  const getTagNoteCount = (tagId: string) => {
    return Array.from(notes.values()).filter((note) =>
      note.frontmatter.superTags?.includes(tagId)
    ).length;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3">
        <div
          className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary rounded-md cursor-pointer hover:bg-border-subtle transition-colors duration-fast"
          onClick={handleSearchFocus}
        >
          <Search className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-tertiary flex-1">Search...</span>
          <kbd className="text-xs text-text-tertiary bg-bg-secondary px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Quick Access */}
      <div className="px-3 mb-4">
        <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          Quick Access
        </div>
        <nav className="space-y-1">
          <SidebarItem icon={CalendarDays} label="Daily Note" />
          <SidebarItem icon={Star} label="Favourites" />
          <SidebarItem icon={Clock} label="Recent" />
        </nav>
      </div>

      {/* Vault */}
      {currentVault && (
        <div className="flex-1 overflow-hidden flex flex-col px-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              {currentVault.name}
            </div>
            <button
              className="p-1 rounded hover:bg-bg-tertiary transition-colors duration-fast"
              title="New note"
            >
              <Plus className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FileTree />
          </div>
        </div>
      )}

      {!currentVault && (
        <div className="flex-1 flex items-center justify-center px-3">
          <div className="text-center">
            <FolderTree className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary mb-3">No vault open</p>
            <button className="btn-primary text-sm">Open Vault</button>
          </div>
        </div>
      )}

      {/* Super Tags */}
      <div className="px-3 py-3 border-t border-border-subtle">
        <button
          onClick={() => setSuperTagsExpanded(!superTagsExpanded)}
          className="flex items-center gap-1 w-full text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 hover:text-text-secondary"
        >
          {superTagsExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          Super Tags
          <span className="ml-auto text-[10px] font-normal">
            {superTagList.length}
          </span>
        </button>
        {superTagsExpanded && (
          <div className="space-y-0.5">
            {superTagList.length === 0 ? (
              <div className="text-sm text-text-tertiary py-2">
                No super tags yet
              </div>
            ) : (
              superTagList.map((tag) => (
                <button
                  key={tag.id}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary hover:bg-bg-tertiary rounded transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      backgroundColor: `${tag.colour}30`,
                      color: tag.colour,
                    }}
                  >
                    {tag.icon || <Hash className="w-2.5 h-2.5" />}
                  </span>
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  <span className="text-xs text-text-tertiary">
                    {getTagNoteCount(tag.id)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border-subtle">
        <button className="sidebar-item w-full">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, active, count, onClick }: SidebarItemProps) {
  return (
    <button
      className={`sidebar-item w-full ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-text-tertiary">{count}</span>
      )}
    </button>
  );
}
