import { useCallback, useEffect, useMemo } from 'react';
import { useGraphStore } from '../stores/graphStore';
import { useNoteStore } from '../stores/noteStore';
import { GraphEdge, EdgeAppearance, RelationshipPreset } from '../lib/graph/types';
import { v4 as uuidv4 } from 'uuid';

export function useGraph() {
  const {
    nodes,
    edges,
    stats,
    selectedNodeId,
    hoveredNodeId,
    focusedNodeId,
    filter,
    layoutType,
    relationshipPresets,
    buildGraph,
    updateNote,
    removeNote,
    setSelectedNodeId,
    setHoveredNodeId,
    setFocusedNodeId,
    setFilter,
    clearFilter,
    setLayoutType,
    updateEdgeAppearance,
    removeEdge,
    addRelationshipPreset,
    removeRelationshipPreset,
    getIncomingLinks,
    getOutgoingLinks,
    getNeighbors,
    getSubgraph,
  } = useGraphStore();

  const { notes } = useNoteStore();

  // Convert notes Map to array for graph building
  const notesArray = useMemo(() => Array.from(notes.values()), [notes]);

  // Build graph when notes change
  useEffect(() => {
    if (notesArray.length > 0) {
      buildGraph(notesArray);
    }
  }, [notesArray, buildGraph]);

  // Get the selected node
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  // Get the focused node
  const focusedNode = focusedNodeId
    ? nodes.find((n) => n.id === focusedNodeId)
    : null;

  // Get filtered nodes based on current filter
  const getFilteredNodes = useCallback(() => {
    let filteredNodes = [...nodes];

    if (filter.includeTags?.length) {
      filteredNodes = filteredNodes.filter((n) =>
        n.superTags?.some((t) => filter.includeTags!.includes(t))
      );
    }

    if (filter.excludeTags?.length) {
      filteredNodes = filteredNodes.filter(
        (n) => !n.superTags?.some((t) => filter.excludeTags!.includes(t))
      );
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter((n) =>
        n.title.toLowerCase().includes(query)
      );
    }

    return filteredNodes;
  }, [nodes, filter]);

  // Get edges for filtered nodes
  const getFilteredEdges = useCallback(() => {
    const filteredNodes = getFilteredNodes();
    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    return edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
  }, [edges, getFilteredNodes]);

  // Create a new link between notes
  const createLink = useCallback(
    (
      sourceId: string,
      targetId: string,
      name: string,
      appearance?: Partial<EdgeAppearance>
    ): GraphEdge => {
      const defaultAppearance: EdgeAppearance = {
        direction: 'forward',
        colour: '#6366f1',
        style: 'solid',
        thickness: 'normal',
        animated: false,
      };

      const edge: GraphEdge = {
        id: uuidv4(),
        source: sourceId,
        target: targetId,
        name,
        created: new Date().toISOString(),
        appearance: { ...defaultAppearance, ...appearance },
      };

      // Note: This doesn't persist to the file yet
      // That would require updating the note's frontmatter
      return edge;
    },
    []
  );

  // Apply a relationship preset
  const applyPreset = useCallback(
    (edgeId: string, presetId: string) => {
      const preset = relationshipPresets.find((p) => p.id === presetId);
      if (preset) {
        updateEdgeAppearance(edgeId, preset.appearance);
      }
    },
    [relationshipPresets, updateEdgeAppearance]
  );

  // Create a custom relationship preset
  const createPreset = useCallback(
    (name: string, appearance: EdgeAppearance, description?: string) => {
      const preset: RelationshipPreset = {
        id: uuidv4(),
        name,
        description,
        appearance,
      };
      addRelationshipPreset(preset);
      return preset;
    },
    [addRelationshipPreset]
  );

  // Get backlinks for a note
  const getBacklinks = useCallback(
    (noteId: string) => {
      const incomingEdges = getIncomingLinks(noteId);
      return incomingEdges.map((edge) => ({
        edge,
        sourceNode: nodes.find((n) => n.id === edge.source),
      }));
    },
    [nodes, getIncomingLinks]
  );

  // Get outlinks for a note
  const getOutlinks = useCallback(
    (noteId: string) => {
      const outgoingEdges = getOutgoingLinks(noteId);
      return outgoingEdges.map((edge) => ({
        edge,
        targetNode: nodes.find((n) => n.id === edge.target),
      }));
    },
    [nodes, getOutgoingLinks]
  );

  return {
    // Data
    nodes,
    edges,
    stats,
    selectedNode,
    focusedNode,
    relationshipPresets,
    layoutType,
    filter,

    // Filtered data
    getFilteredNodes,
    getFilteredEdges,

    // Selection
    selectedNodeId,
    hoveredNodeId,
    focusedNodeId,
    setSelectedNodeId,
    setHoveredNodeId,
    setFocusedNodeId,

    // Graph operations
    updateNote,
    removeNote,

    // Link operations
    createLink,
    updateEdgeAppearance,
    removeEdge,
    getBacklinks,
    getOutlinks,
    getNeighbors,
    getSubgraph,

    // Filter operations
    setFilter,
    clearFilter,

    // Layout
    setLayoutType,

    // Preset operations
    applyPreset,
    createPreset,
    removeRelationshipPreset,
  };
}
