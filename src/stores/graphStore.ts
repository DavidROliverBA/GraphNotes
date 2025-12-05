import { create } from 'zustand';
import {
  GraphNode,
  GraphEdge,
  GraphStats,
  GraphFilter,
  RelationshipPreset,
  DEFAULT_RELATIONSHIP_PRESETS,
  LayoutType,
  EdgeAppearance,
} from '../lib/graph/types';
import { graphManager } from '../lib/graph/GraphManager';
import { Note } from '../lib/notes/types';

interface GraphState {
  // Graph data
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;

  // UI state
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  focusedNodeId: string | null; // For subgraph view
  filter: GraphFilter;
  layoutType: LayoutType;

  // Relationship presets
  relationshipPresets: RelationshipPreset[];

  // Actions
  buildGraph: (notes: Note[]) => void;
  updateNote: (note: Note) => void;
  removeNote: (noteId: string) => void;

  // Selection
  setSelectedNodeId: (id: string | null) => void;
  setHoveredNodeId: (id: string | null) => void;
  setFocusedNodeId: (id: string | null) => void;

  // Filtering
  setFilter: (filter: GraphFilter) => void;
  clearFilter: () => void;

  // Layout
  setLayoutType: (type: LayoutType) => void;

  // Edge operations
  updateEdgeAppearance: (edgeId: string, appearance: Partial<EdgeAppearance>) => void;
  removeEdge: (edgeId: string) => void;

  // Relationship presets
  addRelationshipPreset: (preset: RelationshipPreset) => void;
  removeRelationshipPreset: (presetId: string) => void;

  // Helpers
  getIncomingLinks: (nodeId: string) => GraphEdge[];
  getOutgoingLinks: (nodeId: string) => GraphEdge[];
  getNeighbors: (nodeId: string) => GraphNode[];
  getSubgraph: (nodeId: string, depth?: number) => { nodes: GraphNode[]; edges: GraphEdge[] };
}

const initialStats: GraphStats = {
  totalNodes: 0,
  totalEdges: 0,
  orphanedNodes: 0,
  mostConnectedNodes: [],
};

export const useGraphStore = create<GraphState>((set) => ({
  // Initial state
  nodes: [],
  edges: [],
  stats: initialStats,
  selectedNodeId: null,
  hoveredNodeId: null,
  focusedNodeId: null,
  filter: {},
  layoutType: 'force',
  relationshipPresets: DEFAULT_RELATIONSHIP_PRESETS,

  // Build the entire graph from notes
  buildGraph: (notes: Note[]) => {
    graphManager.buildFromNotes(notes);
    set({
      nodes: graphManager.getNodes(),
      edges: graphManager.getEdges(),
      stats: graphManager.getStats(),
    });
  },

  // Update graph when a note changes
  updateNote: (note: Note) => {
    graphManager.updateNode(note);
    set({
      nodes: graphManager.getNodes(),
      edges: graphManager.getEdges(),
      stats: graphManager.getStats(),
    });
  },

  // Remove a note from the graph
  removeNote: (noteId: string) => {
    graphManager.removeNode(noteId);
    set({
      nodes: graphManager.getNodes(),
      edges: graphManager.getEdges(),
      stats: graphManager.getStats(),
    });
  },

  // Selection
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setFocusedNodeId: (id) => set({ focusedNodeId: id }),

  // Filtering
  setFilter: (filter) => set({ filter }),
  clearFilter: () => set({ filter: {} }),

  // Layout
  setLayoutType: (type) => set({ layoutType: type }),

  // Edge operations
  updateEdgeAppearance: (edgeId, appearance) => {
    graphManager.updateEdgeAppearance(edgeId, appearance);
    set({ edges: graphManager.getEdges() });
  },

  removeEdge: (edgeId) => {
    graphManager.removeEdge(edgeId);
    set({
      edges: graphManager.getEdges(),
      stats: graphManager.getStats(),
    });
  },

  // Relationship presets
  addRelationshipPreset: (preset) => {
    set((state) => ({
      relationshipPresets: [...state.relationshipPresets, preset],
    }));
  },

  removeRelationshipPreset: (presetId) => {
    set((state) => ({
      relationshipPresets: state.relationshipPresets.filter((p) => p.id !== presetId),
    }));
  },

  // Helpers
  getIncomingLinks: (nodeId) => graphManager.getIncomingEdges(nodeId),
  getOutgoingLinks: (nodeId) => graphManager.getOutgoingEdges(nodeId),
  getNeighbors: (nodeId) => graphManager.getNeighbors(nodeId),
  getSubgraph: (nodeId, depth = 2) => graphManager.getSubgraph(nodeId, depth),
}));
