import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraph } from '../../hooks/useGraph';
import { useUIStore } from '../../stores/uiStore';
import { GraphNode, GraphEdge } from '../../lib/graph/types';
import { NoteNode } from './NoteNode';
import { RelationshipEdge } from './RelationshipEdge';
import { GraphControls } from './GraphControls';
import './graph.css';

// Register custom node types
const nodeTypes = {
  noteNode: NoteNode,
};

// Register custom edge types
const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

// Convert graph nodes to React Flow nodes
function toFlowNodes(graphNodes: GraphNode[], selectedId: string | null): Node[] {
  return graphNodes.map((node, index) => {
    // Simple grid layout if no position is set
    const cols = Math.ceil(Math.sqrt(graphNodes.length));
    const x = node.position?.x ?? (index % cols) * 250;
    const y = node.position?.y ?? Math.floor(index / cols) * 150;

    return {
      id: node.id,
      type: 'noteNode',
      position: { x, y },
      data: {
        label: node.title,
        filepath: node.filepath,
        superTags: node.superTags,
        incomingCount: node.incomingLinkCount,
        outgoingCount: node.outgoingLinkCount,
        isSelected: node.id === selectedId,
      },
    };
  });
}

// Convert graph edges to React Flow edges
function toFlowEdges(graphEdges: GraphEdge[]): Edge[] {
  return graphEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'relationshipEdge',
    data: {
      label: edge.name,
      appearance: edge.appearance,
    },
  }));
}

function GraphViewInner() {
  const {
    nodes: graphNodes,
    edges: graphEdges,
    selectedNodeId,
    setSelectedNodeId,
    setHoveredNodeId,
    filter,
    getFilteredNodes,
    getFilteredEdges,
  } = useGraph();

  const { setSelectedNoteId } = useUIStore();
  const { fitView } = useReactFlow();

  // Get filtered data if filter is active
  const displayNodes = useMemo(() => {
    if (Object.keys(filter).length > 0) {
      return getFilteredNodes();
    }
    return graphNodes;
  }, [graphNodes, filter, getFilteredNodes]);

  const displayEdges = useMemo(() => {
    if (Object.keys(filter).length > 0) {
      return getFilteredEdges();
    }
    return graphEdges;
  }, [graphEdges, filter, getFilteredEdges]);

  // Convert to React Flow format
  const initialNodes = useMemo(
    () => toFlowNodes(displayNodes, selectedNodeId),
    [displayNodes, selectedNodeId]
  );

  const initialEdges = useMemo(
    () => toFlowEdges(displayEdges),
    [displayEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when graph data changes
  useEffect(() => {
    setNodes(toFlowNodes(displayNodes, selectedNodeId));
  }, [displayNodes, selectedNodeId, setNodes]);

  // Update edges when graph data changes
  useEffect(() => {
    setEdges(toFlowEdges(displayEdges));
  }, [displayEdges, setEdges]);

  // Fit view when nodes change significantly
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [nodes.length, fitView]);

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  // Handle node double click - open the note
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const filepath = node.data.filepath as string;
      if (filepath) {
        setSelectedNoteId(filepath);
      }
    },
    [setSelectedNoteId]
  );

  // Handle node hover
  const onNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHoveredNodeId(node.id);
    },
    [setHoveredNodeId]
  );

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, [setHoveredNodeId]);

  // Handle background click - deselect
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="graph-container w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'relationshipEdge',
        }}
      >
        <Background color="var(--border-subtle)" gap={20} />
        <Controls className="graph-controls" />
        <MiniMap
          nodeColor={(node) =>
            node.data.isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)'
          }
          maskColor="rgba(0, 0, 0, 0.2)"
          className="graph-minimap"
        />
        <Panel position="top-right">
          <GraphControls />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function GraphView() {
  return (
    <ReactFlowProvider>
      <GraphViewInner />
    </ReactFlowProvider>
  );
}

export default GraphView;
