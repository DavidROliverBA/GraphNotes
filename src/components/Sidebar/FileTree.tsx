import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useNoteStore } from '../../stores/noteStore';
import { readDirectory } from '../../lib/tauri/commands';

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  extension: string | null;
  children?: TreeNode[];
  isExpanded?: boolean;
}

interface FlattenedNode {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
}

// Virtual scrolling configuration
const ITEM_HEIGHT = 28; // Height of each row in pixels
const OVERSCAN = 10; // Number of items to render outside visible area

export function FileTree() {
  const { currentVault } = useSettingsStore();
  const { selectedNoteId, setSelectedNoteId, openContextMenu, renamingNoteId, setRenamingNoteId } = useUIStore();
  const { notesList, renameNote } = useNoteStore();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Virtual scrolling state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Track if a note is being renamed by ID
  useEffect(() => {
    if (renamingNoteId) {
      const note = notesList.find(n => n.id === renamingNoteId);
      if (note) {
        setEditingPath(note.filepath);
        const filename = note.filepath.split('/').pop()?.replace('.md', '') || '';
        setEditingName(filename);
      }
    } else {
      setEditingPath(null);
      setEditingName('');
    }
  }, [renamingNoteId, notesList]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, node.path, node.isDirectory ? 'folder' : 'file');
  }, [openContextMenu]);

  const handleRenameSubmit = useCallback(async (path: string) => {
    if (!editingName.trim()) {
      setEditingPath(null);
      setRenamingNoteId(null);
      return;
    }

    const dir = path.substring(0, path.lastIndexOf('/'));
    const newPath = `${dir}/${editingName.trim()}.md`;

    if (newPath !== path) {
      await renameNote(path, newPath);
    }

    setEditingPath(null);
    setRenamingNoteId(null);
  }, [editingName, renameNote, setRenamingNoteId]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit(path);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingPath(null);
      setRenamingNoteId(null);
    }
  }, [handleRenameSubmit, setRenamingNoteId]);

  useEffect(() => {
    if (currentVault) {
      loadDirectory(currentVault.path);
    }
  }, [currentVault]);

  // Set up container height observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const entries = await readDirectory(path);
      const nodes: TreeNode[] = entries
        .filter((entry) => {
          // Filter out hidden files and .graphnotes directory
          if (entry.name.startsWith('.')) return false;
          // Only show markdown files
          if (entry.is_file && entry.extension !== 'md') return false;
          return true;
        })
        .map((entry) => ({
          name: entry.name,
          path: entry.path,
          isDirectory: entry.is_directory,
          isFile: entry.is_file,
          extension: entry.extension,
        }));

      setTree(nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (node: TreeNode) => {
    const newExpanded = new Set(expandedPaths);

    if (newExpanded.has(node.path)) {
      newExpanded.delete(node.path);
    } else {
      newExpanded.add(node.path);

      // Load children if not already loaded
      if (!node.children) {
        try {
          const entries = await readDirectory(node.path);
          const children: TreeNode[] = entries
            .filter((entry) => {
              if (entry.name.startsWith('.')) return false;
              if (entry.is_file && entry.extension !== 'md') return false;
              return true;
            })
            .map((entry) => ({
              name: entry.name,
              path: entry.path,
              isDirectory: entry.is_directory,
              isFile: entry.is_file,
              extension: entry.extension,
            }));

          // Update tree with children
          setTree((prevTree) => updateTreeNode(prevTree, node.path, { children }));
        } catch (err) {
          console.error('Failed to load directory:', err);
        }
      }
    }

    setExpandedPaths(newExpanded);
  };

  const updateTreeNode = (
    nodes: TreeNode[],
    path: string,
    updates: Partial<TreeNode>
  ): TreeNode[] => {
    return nodes.map((node) => {
      if (node.path === path) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeNode(node.children, path, updates),
        };
      }
      return node;
    });
  };

  const handleFileClick = useCallback((node: TreeNode) => {
    if (node.isFile) {
      setSelectedNoteId(node.path);
    }
  }, [setSelectedNoteId]);

  // Flatten tree into a list for virtual scrolling
  const flattenedNodes = useMemo(() => {
    const result: FlattenedNode[] = [];

    const flatten = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        const isExpanded = expandedPaths.has(node.path);
        result.push({ node, depth, isExpanded });

        if (node.isDirectory && isExpanded && node.children) {
          flatten(node.children, depth + 1);
        }
      }
    };

    flatten(tree, 0);
    return result;
  }, [tree, expandedPaths]);

  // Calculate visible items for virtual scrolling
  const visibleItems = useMemo(() => {
    if (flattenedNodes.length === 0 || containerHeight === 0) {
      return [];
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(
      flattenedNodes.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
    );

    return flattenedNodes.slice(startIndex, endIndex + 1).map((item, i) => ({
      ...item,
      index: startIndex + i,
      offsetY: (startIndex + i) * ITEM_HEIGHT,
    }));
  }, [flattenedNodes, scrollTop, containerHeight]);

  const totalHeight = flattenedNodes.length * ITEM_HEIGHT;

  if (loading && tree.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-text-tertiary">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2">
        <div className="text-sm text-accent-danger">{error}</div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="w-8 h-8 text-text-tertiary mb-2" />
        <p className="text-sm text-text-secondary">No notes yet</p>
        <button className="mt-2 text-sm text-accent-primary hover:underline">
          Create your first note
        </button>
      </div>
    );
  }

  // Use regular rendering for small lists, virtual scrolling for large ones
  const useVirtualization = flattenedNodes.length > 100;

  if (!useVirtualization) {
    // Regular rendering for small lists
    return (
      <div className="select-none">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            depth={0}
            isExpanded={expandedPaths.has(node.path)}
            isSelected={selectedNoteId === node.path}
            isEditing={editingPath === node.path}
            editingName={editingName}
            onToggle={toggleExpand}
            onClick={handleFileClick}
            onContextMenu={handleContextMenu}
            onEditingNameChange={setEditingName}
            onRenameSubmit={handleRenameSubmit}
            onRenameKeyDown={handleRenameKeyDown}
            expandedPaths={expandedPaths}
            selectedNoteId={selectedNoteId}
            editingPath={editingPath}
          />
        ))}
      </div>
    );
  }

  // Virtual scrolling for large lists
  return (
    <div
      ref={containerRef}
      className="select-none h-full overflow-y-auto"
    >
      <div
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map(({ node, depth, isExpanded, offsetY }) => (
          <VirtualTreeNodeItem
            key={node.path}
            node={node}
            depth={depth}
            isExpanded={isExpanded}
            isSelected={selectedNoteId === node.path}
            onToggle={toggleExpand}
            onClick={handleFileClick}
            offsetY={offsetY}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editingName: string;
  onToggle: (node: TreeNode) => void;
  onClick: (node: TreeNode) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
  onEditingNameChange: (name: string) => void;
  onRenameSubmit: (path: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent, path: string) => void;
  expandedPaths: Set<string>;
  selectedNoteId: string | null;
  editingPath: string | null;
}

function TreeNodeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  isEditing,
  editingName,
  onToggle,
  onClick,
  onContextMenu,
  onEditingNameChange,
  onRenameSubmit,
  onRenameKeyDown,
  expandedPaths,
  selectedNoteId,
  editingPath,
}: TreeNodeItemProps) {
  const paddingLeft = 8 + depth * 16;
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDirectory) {
      onToggle(node);
    } else {
      onClick(node);
    }
  };

  const getDisplayName = (name: string) => {
    // Remove .md extension
    if (name.endsWith('.md')) {
      return name.slice(0, -3);
    }
    return name;
  };

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 py-1 px-1 cursor-pointer rounded-sm
          transition-colors duration-fast
          ${isSelected ? 'bg-accent-primary/10 text-accent-primary' : 'hover:bg-bg-tertiary'}
        `}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {node.isDirectory && (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-text-tertiary" />
            ) : (
              <ChevronRight className="w-3 h-3 text-text-tertiary" />
            )}
          </span>
        )}
        {!node.isDirectory && <span className="w-4" />}

        <span className="flex-shrink-0">
          {node.isDirectory ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-accent-warning" />
            ) : (
              <Folder className="w-4 h-4 text-accent-warning" />
            )
          ) : (
            <FileText className="w-4 h-4 text-text-tertiary" />
          )}
        </span>

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={(e) => onRenameKeyDown(e, node.path)}
            onBlur={() => onRenameSubmit(node.path)}
            className="flex-1 px-1 py-0 text-sm bg-bg-secondary border border-accent-primary rounded outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-sm">{getDisplayName(node.name)}</span>
        )}
      </div>

      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={expandedPaths.has(child.path)}
              isSelected={selectedNoteId === child.path}
              isEditing={editingPath === child.path}
              editingName={editingName}
              onToggle={onToggle}
              onClick={onClick}
              onContextMenu={onContextMenu}
              onEditingNameChange={onEditingNameChange}
              onRenameSubmit={onRenameSubmit}
              onRenameKeyDown={onRenameKeyDown}
              expandedPaths={expandedPaths}
              selectedNoteId={selectedNoteId}
              editingPath={editingPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Virtual tree node item for virtual scrolling
interface VirtualTreeNodeItemProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (node: TreeNode) => void;
  onClick: (node: TreeNode) => void;
  offsetY: number;
}

function VirtualTreeNodeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onClick,
  offsetY,
}: VirtualTreeNodeItemProps) {
  const paddingLeft = 8 + depth * 16;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDirectory) {
      onToggle(node);
    } else {
      onClick(node);
    }
  };

  const getDisplayName = (name: string) => {
    if (name.endsWith('.md')) {
      return name.slice(0, -3);
    }
    return name;
  };

  return (
    <div
      className={`
        absolute left-0 right-0 flex items-center gap-1 py-1 px-1 cursor-pointer rounded-sm
        transition-colors duration-fast
        ${isSelected ? 'bg-accent-primary/10 text-accent-primary' : 'hover:bg-bg-tertiary'}
      `}
      style={{
        paddingLeft,
        height: ITEM_HEIGHT,
        transform: `translateY(${offsetY}px)`,
      }}
      onClick={handleClick}
    >
      {node.isDirectory && (
        <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-text-tertiary" />
          ) : (
            <ChevronRight className="w-3 h-3 text-text-tertiary" />
          )}
        </span>
      )}
      {!node.isDirectory && <span className="w-4" />}

      <span className="flex-shrink-0">
        {node.isDirectory ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-accent-warning" />
          ) : (
            <Folder className="w-4 h-4 text-accent-warning" />
          )
        ) : (
          <FileText className="w-4 h-4 text-text-tertiary" />
        )}
      </span>

      <span className="truncate text-sm">{getDisplayName(node.name)}</span>
    </div>
  );
}
