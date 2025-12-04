// src/stores/graphStore.ts

import { create } from 'zustand';
import { GraphNode, GraphEdge, RelationshipType, DEFAULT_RELATIONSHIP_TYPES } from '../lib/graph/types';

interface GraphState {
  // Graph data
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  relationshipTypes: RelationshipType[];

  // Graph view state
  hoveredNodeId: string | null;
  selectedEdgeId: string | null;
  zoomLevel: number;

  // Filters
  filterByTags: string[];
  filterByRelationships: string[];
  showOrphanNodes: boolean;

  // Actions
  setNodes: (nodes: Map<string, GraphNode>) => void;
  addNode: (node: GraphNode) => void;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  removeNode: (id: string) => void;

  setEdges: (edges: Map<string, GraphEdge>) => void;
  addEdge: (edge: GraphEdge) => void;
  updateEdge: (id: string, updates: Partial<GraphEdge>) => void;
  removeEdge: (id: string) => void;

  setRelationshipTypes: (types: RelationshipType[]) => void;
  setHoveredNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setZoomLevel: (level: number) => void;
  setFilterByTags: (tags: string[]) => void;
  setFilterByRelationships: (relationships: string[]) => void;
  setShowOrphanNodes: (show: boolean) => void;

  // Selectors
  getNodeById: (id: string) => GraphNode | undefined;
  getEdgeById: (id: string) => GraphEdge | undefined;
  getEdgesForNode: (nodeId: string) => GraphEdge[];
  getConnectedNodes: (nodeId: string) => GraphNode[];
}

export const useGraphStore = create<GraphState>((set, get) => ({
  // Initial state
  nodes: new Map(),
  edges: new Map(),
  relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
  hoveredNodeId: null,
  selectedEdgeId: null,
  zoomLevel: 1,
  filterByTags: [],
  filterByRelationships: [],
  showOrphanNodes: true,

  // Node actions
  setNodes: (nodes) => set({ nodes }),

  addNode: (node) =>
    set((state) => {
      const newNodes = new Map(state.nodes);
      newNodes.set(node.id, node);
      return { nodes: newNodes };
    }),

  updateNode: (id, updates) =>
    set((state) => {
      const existingNode = state.nodes.get(id);
      if (!existingNode) return state;

      const newNodes = new Map(state.nodes);
      newNodes.set(id, { ...existingNode, ...updates });
      return { nodes: newNodes };
    }),

  removeNode: (id) =>
    set((state) => {
      const newNodes = new Map(state.nodes);
      newNodes.delete(id);
      return { nodes: newNodes };
    }),

  // Edge actions
  setEdges: (edges) => set({ edges }),

  addEdge: (edge) =>
    set((state) => {
      const newEdges = new Map(state.edges);
      newEdges.set(edge.id, edge);
      return { edges: newEdges };
    }),

  updateEdge: (id, updates) =>
    set((state) => {
      const existingEdge = state.edges.get(id);
      if (!existingEdge) return state;

      const newEdges = new Map(state.edges);
      newEdges.set(id, { ...existingEdge, ...updates });
      return { edges: newEdges };
    }),

  removeEdge: (id) =>
    set((state) => {
      const newEdges = new Map(state.edges);
      newEdges.delete(id);
      return { edges: newEdges };
    }),

  // Other actions
  setRelationshipTypes: (types) => set({ relationshipTypes: types }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  setFilterByTags: (tags) => set({ filterByTags: tags }),
  setFilterByRelationships: (relationships) => set({ filterByRelationships: relationships }),
  setShowOrphanNodes: (show) => set({ showOrphanNodes: show }),

  // Selectors
  getNodeById: (id) => get().nodes.get(id),
  getEdgeById: (id) => get().edges.get(id),

  getEdgesForNode: (nodeId) => {
    const edges = get().edges;
    const result: GraphEdge[] = [];
    for (const edge of edges.values()) {
      if (edge.source === nodeId || edge.target === nodeId) {
        result.push(edge);
      }
    }
    return result;
  },

  getConnectedNodes: (nodeId) => {
    const edges = get().getEdgesForNode(nodeId);
    const nodes = get().nodes;
    const connectedIds = new Set<string>();

    for (const edge of edges) {
      if (edge.source === nodeId) {
        connectedIds.add(edge.target);
      } else {
        connectedIds.add(edge.source);
      }
    }

    const result: GraphNode[] = [];
    for (const id of connectedIds) {
      const node = nodes.get(id);
      if (node) {
        result.push(node);
      }
    }
    return result;
  },
}));
