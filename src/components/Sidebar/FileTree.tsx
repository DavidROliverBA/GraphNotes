import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
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

export function FileTree() {
  const { currentVault } = useSettingsStore();
  const { selectedNoteId, setSelectedNoteId } = useUIStore();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentVault) {
      loadDirectory(currentVault.path);
    }
  }, [currentVault]);

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

  const handleFileClick = (node: TreeNode) => {
    if (node.isFile) {
      setSelectedNoteId(node.path);
    }
  };

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

  return (
    <div className="select-none">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          depth={0}
          isExpanded={expandedPaths.has(node.path)}
          isSelected={selectedNoteId === node.path}
          onToggle={toggleExpand}
          onClick={handleFileClick}
          expandedPaths={expandedPaths}
        />
      ))}
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (node: TreeNode) => void;
  onClick: (node: TreeNode) => void;
  expandedPaths: Set<string>;
}

function TreeNodeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onClick,
  expandedPaths,
}: TreeNodeItemProps) {
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

      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={expandedPaths.has(child.path)}
              isSelected={isSelected}
              onToggle={onToggle}
              onClick={onClick}
              expandedPaths={expandedPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
}
