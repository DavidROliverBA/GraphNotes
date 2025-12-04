// src/components/Graph/GraphControls.tsx

import React, { useCallback, useState } from 'react';
import { useSigma } from '@react-sigma/core';
import { DEFAULT_RELATIONSHIP_TYPES } from '../../lib/graph/types';

interface GraphControlsProps {
  onFilterChange?: (filters: GraphFilters) => void;
}

export interface GraphFilters {
  relationshipTypes: string[];
  showOrphans: boolean;
  minConnections: number;
}

const GraphControls: React.FC<GraphControlsProps> = ({ onFilterChange }) => {
  const sigma = useSigma();
  const [filters, setFilters] = useState<GraphFilters>({
    relationshipTypes: DEFAULT_RELATIONSHIP_TYPES.map((r) => r.name),
    showOrphans: true,
    minConnections: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleZoomIn = useCallback(() => {
    const camera = sigma.getCamera();
    camera.animatedZoom({ duration: 200 });
  }, [sigma]);

  const handleZoomOut = useCallback(() => {
    const camera = sigma.getCamera();
    camera.animatedUnzoom({ duration: 200 });
  }, [sigma]);

  const handleFitView = useCallback(() => {
    const camera = sigma.getCamera();
    camera.animatedReset({ duration: 300 });
  }, [sigma]);

  const handleRelayout = useCallback(() => {
    const graph = sigma.getGraph();
    const nodes = graph.nodes();

    // Reset positions randomly and let force layout run
    nodes.forEach((node) => {
      graph.setNodeAttribute(node, 'x', Math.random() * 100 - 50);
      graph.setNodeAttribute(node, 'y', Math.random() * 100 - 50);
    });

    // Simple force-directed layout
    const iterations = 100;
    const repulsionStrength = 100;
    const attractionStrength = 0.01;
    const centerGravity = 0.01;

    for (let i = 0; i < iterations; i++) {
      const forces: Record<string, { x: number; y: number }> = {};

      nodes.forEach((node) => {
        forces[node] = { x: 0, y: 0 };
      });

      // Repulsion
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const nodeA = nodes[j];
          const nodeB = nodes[k];
          const posA = graph.getNodeAttributes(nodeA);
          const posB = graph.getNodeAttributes(nodeB);

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          forces[nodeA].x -= fx;
          forces[nodeA].y -= fy;
          forces[nodeB].x += fx;
          forces[nodeB].y += fy;
        }
      }

      // Attraction
      graph.forEachEdge((_, __, source, target) => {
        const posA = graph.getNodeAttributes(source);
        const posB = graph.getNodeAttributes(target);

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = distance * attractionStrength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        forces[source].x += fx;
        forces[source].y += fy;
        forces[target].x -= fx;
        forces[target].y -= fy;
      });

      // Gravity
      nodes.forEach((node) => {
        const pos = graph.getNodeAttributes(node);
        forces[node].x -= pos.x * centerGravity;
        forces[node].y -= pos.y * centerGravity;
      });

      // Apply
      nodes.forEach((node) => {
        const pos = graph.getNodeAttributes(node);
        graph.setNodeAttribute(node, 'x', pos.x + forces[node].x);
        graph.setNodeAttribute(node, 'y', pos.y + forces[node].y);
      });
    }

    sigma.refresh();
    handleFitView();
  }, [sigma, handleFitView]);

  const toggleRelationshipFilter = useCallback(
    (relName: string) => {
      setFilters((prev) => {
        const newTypes = prev.relationshipTypes.includes(relName)
          ? prev.relationshipTypes.filter((r) => r !== relName)
          : [...prev.relationshipTypes, relName];
        const newFilters = { ...prev, relationshipTypes: newTypes };
        onFilterChange?.(newFilters);
        return newFilters;
      });
    },
    [onFilterChange]
  );

  const toggleOrphans = useCallback(() => {
    setFilters((prev) => {
      const newFilters = { ...prev, showOrphans: !prev.showOrphans };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* Main controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-sidebar-hover rounded hover:bg-sidebar-active transition-colors"
          title="Zoom in"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-sidebar-hover rounded hover:bg-sidebar-active transition-colors"
          title="Zoom out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
        </button>
        <button
          onClick={handleFitView}
          className="p-2 bg-sidebar-hover rounded hover:bg-sidebar-active transition-colors"
          title="Fit view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
        <button
          onClick={handleRelayout}
          className="p-2 bg-sidebar-hover rounded hover:bg-sidebar-active transition-colors"
          title="Re-layout graph"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </button>
        <div className="w-px h-6 bg-sidebar-hover mx-1" />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded transition-colors ${
            showFilters
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'bg-sidebar-hover hover:bg-sidebar-active'
          }`}
          title="Toggle filters"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-3 bg-sidebar-hover/50 rounded-lg text-xs">
          <div className="font-medium mb-2 text-editor-text">Relationship Types</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {DEFAULT_RELATIONSHIP_TYPES.map((rel) => (
              <button
                key={rel.name}
                onClick={() => toggleRelationshipFilter(rel.name)}
                className={`px-2 py-1 rounded transition-colors ${
                  filters.relationshipTypes.includes(rel.name)
                    ? 'text-sidebar-bg'
                    : 'bg-sidebar-hover text-gray-500'
                }`}
                style={{
                  backgroundColor: filters.relationshipTypes.includes(rel.name)
                    ? rel.colour
                    : undefined,
                }}
              >
                {rel.name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showOrphans}
              onChange={toggleOrphans}
              className="rounded border-gray-500"
            />
            <span className="text-editor-text">Show orphan nodes</span>
          </label>
        </div>
      )}
    </div>
  );
};

export default GraphControls;
