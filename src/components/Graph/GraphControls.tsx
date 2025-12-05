import { useState } from 'react';
import {
  Filter,
  Search,
  X,
  Grid3X3,
  GitBranch,
  Circle,
  LayoutGrid,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useGraph } from '../../hooks/useGraph';
import { LayoutType } from '../../lib/graph/types';

export function GraphControls() {
  const { fitView, setNodes, getNodes } = useReactFlow();
  const {
    stats,
    filter,
    setFilter,
    clearFilter,
    layoutType,
    setLayoutType,
    relationshipPresets,
  } = useGraph();

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setFilter({ ...filter, searchQuery: query });
    } else {
      const { searchQuery: _, ...rest } = filter;
      if (Object.keys(rest).length > 0) {
        setFilter(rest);
      } else {
        clearFilter();
      }
    }
  };

  const handleLayoutChange = (type: LayoutType) => {
    setLayoutType(type);
    applyLayout(type);
  };

  const applyLayout = (type: LayoutType) => {
    const nodes = getNodes();
    if (nodes.length === 0) return;

    let newNodes;

    switch (type) {
      case 'grid':
        newNodes = applyGridLayout(nodes);
        break;
      case 'hierarchical':
        newNodes = applyHierarchicalLayout(nodes);
        break;
      case 'radial':
        newNodes = applyRadialLayout(nodes);
        break;
      case 'force':
      default:
        newNodes = applyForceLayout(nodes);
        break;
    }

    setNodes(newNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const applyGridLayout = (nodes: ReturnType<typeof getNodes>) => {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 250;

    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % cols) * spacing,
        y: Math.floor(index / cols) * spacing,
      },
    }));
  };

  const applyHierarchicalLayout = (nodes: ReturnType<typeof getNodes>) => {
    const spacing = { x: 250, y: 150 };
    const cols = Math.ceil(Math.sqrt(nodes.length));

    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % cols) * spacing.x,
        y: Math.floor(index / cols) * spacing.y,
      },
    }));
  };

  const applyRadialLayout = (nodes: ReturnType<typeof getNodes>) => {
    const centerX = 400;
    const centerY = 300;
    const radius = Math.max(150, nodes.length * 20);

    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      return {
        ...node,
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
      };
    });
  };

  const applyForceLayout = (nodes: ReturnType<typeof getNodes>) => {
    // Simple force-directed-ish layout
    const spacing = 200;
    const cols = Math.ceil(Math.sqrt(nodes.length));

    return nodes.map((node, index) => {
      // Add some randomness for organic feel
      const jitterX = (Math.random() - 0.5) * 50;
      const jitterY = (Math.random() - 0.5) * 50;

      return {
        ...node,
        position: {
          x: (index % cols) * spacing + jitterX,
          y: Math.floor(index / cols) * spacing + jitterY,
        },
      };
    });
  };

  const layoutOptions: { type: LayoutType; label: string; icon: typeof Grid3X3 }[] = [
    { type: 'force', label: 'Force', icon: Circle },
    { type: 'grid', label: 'Grid', icon: Grid3X3 },
    { type: 'hierarchical', label: 'Tree', icon: GitBranch },
    { type: 'radial', label: 'Radial', icon: LayoutGrid },
  ];

  const hasActiveFilter = Object.keys(filter).length > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search nodes..."
          className="w-48 pl-8 pr-8 py-1.5 text-sm bg-bg-elevated border border-border-subtle rounded-md focus:outline-none focus:border-accent-primary"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Layout buttons */}
      <div className="flex items-center gap-1 p-1 bg-bg-elevated border border-border-subtle rounded-md">
        {layoutOptions.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => handleLayoutChange(type)}
            className={`
              flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
              ${
                layoutType === type
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }
            `}
            title={`${label} layout`}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilterPanel(!showFilterPanel)}
        className={`
          flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-colors
          ${
            hasActiveFilter
              ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
              : 'bg-bg-elevated border-border-subtle text-text-secondary hover:bg-bg-tertiary'
          }
        `}
      >
        <Filter className="w-3 h-3" />
        <span>Filter</span>
        {hasActiveFilter && (
          <span className="ml-1 px-1.5 py-0.5 bg-accent-primary text-white rounded-full text-[10px]">
            Active
          </span>
        )}
      </button>

      {/* Filter panel */}
      {showFilterPanel && (
        <div className="absolute top-full right-0 mt-1 w-64 p-3 bg-bg-elevated border border-border-subtle rounded-lg shadow-lg z-10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-text-primary">Filters</h4>
            {hasActiveFilter && (
              <button
                onClick={clearFilter}
                className="text-xs text-accent-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Relationship type filter */}
          <div className="mb-3">
            <label className="block text-xs text-text-tertiary mb-1">
              Relationship Type
            </label>
            <div className="flex flex-wrap gap-1">
              {relationshipPresets.slice(0, 4).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    const current = filter.includeRelationships || [];
                    const isActive = current.includes(preset.name);
                    setFilter({
                      ...filter,
                      includeRelationships: isActive
                        ? current.filter((r) => r !== preset.name)
                        : [...current, preset.name],
                    });
                  }}
                  className={`
                    flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-colors
                    ${
                      filter.includeRelationships?.includes(preset.name)
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-border-subtle text-text-secondary hover:bg-bg-tertiary'
                    }
                  `}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: preset.appearance.colour }}
                  />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="pt-2 border-t border-border-subtle">
            <div className="text-xs text-text-tertiary">
              <div className="flex justify-between">
                <span>Total nodes:</span>
                <span className="text-text-secondary">{stats.totalNodes}</span>
              </div>
              <div className="flex justify-between">
                <span>Total edges:</span>
                <span className="text-text-secondary">{stats.totalEdges}</span>
              </div>
              <div className="flex justify-between">
                <span>Orphaned:</span>
                <span className="text-text-secondary">{stats.orphanedNodes}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GraphControls;
