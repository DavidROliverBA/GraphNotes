// src/components/Layout/GraphPanel.tsx

import React, { useState, useCallback, useRef, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import Graph from 'graphology';
import { SigmaContainer } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { useGraphStore } from '../../stores/graphStore';
import { useUIStore } from '../../stores/uiStore';
import { useGraph } from '../../hooks/useGraph';
import GraphView from '../Graph/GraphView';
import GraphControls, { GraphFilters } from '../Graph/GraphControls';
import NodeTooltip from '../Graph/NodeTooltip';
import {
  sigmaSettings,
  DEFAULT_NODE_COLOUR,
  NODE_SIZE_MIN,
  NODE_SIZE_MAX,
  getEdgeColour,
} from '../Graph/NodeStyles';

type GraphMode = 'full' | 'local';

// Error boundary to catch WebGL errors gracefully
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class GraphErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Graph rendering error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center p-4">
            <p className="text-sm mb-2">Graph rendering error</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReset();
              }}
              className="px-3 py-1 bg-sidebar-hover text-editor-text rounded text-xs hover:bg-sidebar-active"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const GraphPanel: React.FC = () => {
  const { nodes, edges } = useGraphStore();
  const { viewMode, setViewMode, selectedNoteId } = useUIStore();
  const { getGraphologyInstance } = useGraph();
  const [graphMode, setGraphMode] = useState<GraphMode>('full');
  const [graphKey, setGraphKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track previous values to detect actual changes
  const prevNodeCountRef = useRef(0);
  const prevEdgeCountRef = useRef(0);

  const nodeCount = nodes.size;
  const edgeCount = edges.size;

  const handleFilterChange = useCallback((_newFilters: GraphFilters) => {
    // Filter application would be done through the graph reducer
    // This is a placeholder for future filter implementation
  }, []);

  const handleGraphReset = useCallback(() => {
    setGraphKey((prev) => prev + 1);
  }, []);

  // Build the sigma graph - only rebuild when graph data actually changes
  const sigmaGraph = useMemo(() => {
    if (nodeCount === 0) {
      prevNodeCountRef.current = 0;
      prevEdgeCountRef.current = 0;
      return null;
    }

    const sourceGraph = getGraphologyInstance();
    const newGraph = new Graph({ type: 'directed', multi: true });

    // Determine which nodes to include based on graph mode
    let nodesToInclude: Set<string>;

    if (graphMode === 'local' && selectedNoteId && sourceGraph.hasNode(selectedNoteId)) {
      // Local mode: only include selected node and its neighbors
      nodesToInclude = new Set<string>();
      nodesToInclude.add(selectedNoteId);

      // Add all neighbors (both in and out)
      sourceGraph.forEachNeighbor(selectedNoteId, (neighborId) => {
        nodesToInclude.add(neighborId);
      });
    } else {
      // Full mode: include all nodes
      nodesToInclude = new Set(sourceGraph.nodes());
    }

    if (nodesToInclude.size === 0) {
      return null;
    }

    // Calculate max degree for sizing (within included nodes)
    let maxDegree = 1;
    nodesToInclude.forEach((nodeId) => {
      const degree = sourceGraph.degree(nodeId);
      if (degree > maxDegree) maxDegree = degree;
    });

    // Copy nodes with positions and sizes
    nodesToInclude.forEach((nodeId) => {
      const attributes = sourceGraph.getNodeAttributes(nodeId);
      const degree = sourceGraph.degree(nodeId);
      const normalizedSize =
        NODE_SIZE_MIN + (degree / maxDegree) * (NODE_SIZE_MAX - NODE_SIZE_MIN);

      newGraph.addNode(nodeId, {
        label: attributes.label || nodeId,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        size: normalizedSize,
        color: attributes.colour || DEFAULT_NODE_COLOUR,
      });
    });

    // Copy edges (only between included nodes)
    sourceGraph.forEachEdge((edgeId, attributes, source, target) => {
      if (newGraph.hasNode(source) && newGraph.hasNode(target)) {
        newGraph.addEdgeWithKey(edgeId, source, target, {
          label: attributes.name,
          size: attributes.style?.width ?? 1,
          color: attributes.style?.colour || getEdgeColour(attributes.name),
        });
      }
    });

    // Track that we've processed this data
    prevNodeCountRef.current = nodeCount;
    prevEdgeCountRef.current = edgeCount;

    return newGraph;
  }, [nodeCount, edgeCount, getGraphologyInstance, graphMode, selectedNoteId]);

  // Only show graph when we have valid data
  const shouldShowGraph = sigmaGraph && nodeCount > 0 && containerRef.current;

  return (
    <div className="flex flex-col h-full">
      {/* Graph header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-sidebar-hover flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-editor-text">Knowledge Graph</h2>
          <p className="text-xs text-gray-500 mt-1">
            {nodeCount} notes, {edgeCount} links
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* Graph mode toggle */}
          <div className="flex gap-1 mr-2">
            <button
              onClick={() => setGraphMode('full')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                graphMode === 'full'
                  ? 'bg-accent-primary text-sidebar-bg'
                  : 'bg-sidebar-hover text-editor-text hover:bg-sidebar-active'
              }`}
              title="Full graph"
            >
              Full
            </button>
            <button
              onClick={() => setGraphMode('local')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                graphMode === 'local'
                  ? 'bg-accent-primary text-sidebar-bg'
                  : 'bg-sidebar-hover text-editor-text hover:bg-sidebar-active'
              }`}
              title="Local graph (connected to selected note)"
              disabled={!selectedNoteId}
            >
              Local
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'editor'
                  ? 'bg-accent-primary text-sidebar-bg'
                  : 'bg-sidebar-hover text-editor-text hover:bg-sidebar-active'
              }`}
              title="Editor only"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-accent-primary text-sidebar-bg'
                  : 'bg-sidebar-hover text-editor-text hover:bg-sidebar-active'
              }`}
              title="Split view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                viewMode === 'graph'
                  ? 'bg-accent-primary text-sidebar-bg'
                  : 'bg-sidebar-hover text-editor-text hover:bg-sidebar-active'
              }`}
              title="Graph only"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Graph visualization area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {!shouldShowGraph ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto opacity-50">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <p className="text-lg">No notes in graph yet</p>
              <p className="text-sm mt-2 text-gray-600">
                Create notes with links to build your knowledge graph
              </p>
            </div>
          </div>
        ) : (
          <GraphErrorBoundary onReset={handleGraphReset}>
            <SigmaContainer
              key={graphKey}
              style={{ width: '100%', height: '100%', background: 'transparent' }}
              settings={{
                ...sigmaSettings,
                allowInvalidContainer: true,
              }}
              graph={sigmaGraph}
            >
              <GraphView
                focusNodeId={graphMode === 'local' ? selectedNoteId : null}
              />
              <NodeTooltip />
              <ControlsWrapper onFilterChange={handleFilterChange} />
            </SigmaContainer>
          </GraphErrorBoundary>
        )}
      </div>
    </div>
  );
};

/**
 * Controls wrapper positioned absolutely
 */
const ControlsWrapper: React.FC<{ onFilterChange: (filters: GraphFilters) => void }> = ({
  onFilterChange,
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-10">
      <GraphControls onFilterChange={onFilterChange} />
    </div>
  );
};

export default GraphPanel;
