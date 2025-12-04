// src/hooks/useGraph.ts

import { useCallback, useMemo } from 'react';
import { useNoteStore } from '../stores/noteStore';
import { useGraphStore } from '../stores/graphStore';
import { getGraphManager, resetGraphManager } from '../lib/graph/GraphManager';
import { GraphNode, GraphEdge } from '../lib/graph/types';
import {
  parseAllLinks,
  generateEdgeId,
  buildNoteIndex,
  parseNoteLinks,
} from '../lib/graph/linkParser';
import { Note, LinkDefinition } from '../lib/notes/types';

export function useGraph() {
  const { notes } = useNoteStore();
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
  } = useGraphStore();

  const graphManager = useMemo(() => getGraphManager(), []);

  /**
   * Build the complete graph from all notes
   */
  const buildGraph = useCallback(() => {
    // Clear existing graph
    graphManager.clear();

    // Add all notes as nodes
    for (const note of notes.values()) {
      const node: GraphNode = {
        id: note.id,
        label: note.frontmatter.title,
        filepath: note.filepath,
        size: 1,
      };
      graphManager.addNode(node);
    }

    // Parse all links and add as edges
    const { allResolved, allUnresolved } = parseAllLinks(notes);

    for (const link of allResolved) {
      const edge: GraphEdge = {
        id: generateEdgeId(link.sourceId, link.targetId, link.name),
        source: link.sourceId,
        target: link.targetId,
        name: link.name,
        description: link.description,
      };
      graphManager.addEdge(edge);
    }

    // Update node sizes based on connections
    graphManager.updateNodeSizes();

    // Sync to store
    const { nodes: graphNodes, edges: graphEdges } = graphManager.exportToMaps();
    setNodes(graphNodes);
    setEdges(graphEdges);

    // Log unresolved links for debugging
    if (allUnresolved.length > 0) {
      console.warn('Unresolved links:', allUnresolved);
    }

    return { resolved: allResolved, unresolved: allUnresolved };
  }, [notes, graphManager, setNodes, setEdges]);

  /**
   * Update the graph when a single note changes
   */
  const updateGraphForNote = useCallback((note: Note) => {
    // Update or add the node
    const node: GraphNode = {
      id: note.id,
      label: note.frontmatter.title,
      filepath: note.filepath,
    };

    if (graphManager.hasNode(note.id)) {
      graphManager.updateNode(note.id, node);
      updateNode(note.id, node);
    } else {
      graphManager.addNode(node);
      addNode(node);
    }

    // Remove existing outbound edges from this note
    const existingOutbound = graphManager.getOutboundEdges(note.id);
    for (const edge of existingOutbound) {
      graphManager.removeEdge(edge.id);
      removeEdge(edge.id);
    }

    // Re-parse links for this note and add new edges
    const noteIndex = buildNoteIndex(notes);
    const { resolved } = parseNoteLinks(note, noteIndex);

    for (const link of resolved) {
      const edge: GraphEdge = {
        id: generateEdgeId(link.sourceId, link.targetId, link.name),
        source: link.sourceId,
        target: link.targetId,
        name: link.name,
        description: link.description,
      };
      graphManager.addEdge(edge);
      addEdge(edge);
    }

    // Update node sizes
    graphManager.updateNodeSizes();
    const { nodes: graphNodes } = graphManager.exportToMaps();
    setNodes(graphNodes);
  }, [notes, graphManager, addNode, updateNode, addEdge, removeEdge, setNodes]);

  /**
   * Remove a note from the graph
   */
  const removeNoteFromGraph = useCallback((noteId: string) => {
    // Remove the node (this also removes connected edges in Graphology)
    const connectedEdges = graphManager.getConnectedEdges(noteId);

    for (const edge of connectedEdges) {
      removeEdge(edge.id);
    }

    graphManager.removeNode(noteId);
    removeNode(noteId);

    // Update node sizes
    graphManager.updateNodeSizes();
    const { nodes: graphNodes } = graphManager.exportToMaps();
    setNodes(graphNodes);
  }, [graphManager, removeNode, removeEdge, setNodes]);

  /**
   * Get links for a specific note (both outlinks and backlinks)
   */
  const getLinksForNote = useCallback((noteId: string): {
    outlinks: GraphEdge[];
    backlinks: GraphEdge[];
  } => {
    return {
      outlinks: graphManager.getOutboundEdges(noteId),
      backlinks: graphManager.getInboundEdges(noteId),
    };
  }, [graphManager]);

  /**
   * Get connected notes for a specific note
   */
  const getConnectedNotesForNote = useCallback((noteId: string): {
    linkedNotes: GraphNode[];
    backlinkNotes: GraphNode[];
  } => {
    return {
      linkedNotes: graphManager.getLinkedNodes(noteId),
      backlinkNotes: graphManager.getBacklinkNodes(noteId),
    };
  }, [graphManager]);

  /**
   * Add a new link between two notes
   */
  const addLink = useCallback((
    sourceId: string,
    targetId: string,
    name: string,
    description?: string
  ): GraphEdge | null => {
    if (!graphManager.hasNode(sourceId) || !graphManager.hasNode(targetId)) {
      console.warn('Cannot add link: source or target node does not exist');
      return null;
    }

    const edge: GraphEdge = {
      id: generateEdgeId(sourceId, targetId, name),
      source: sourceId,
      target: targetId,
      name,
      description,
    };

    graphManager.addEdge(edge);
    addEdge(edge);

    return edge;
  }, [graphManager, addEdge]);

  /**
   * Update an existing link
   */
  const updateLink = useCallback((
    edgeId: string,
    updates: { name?: string; description?: string }
  ): boolean => {
    if (!graphManager.hasEdge(edgeId)) {
      return false;
    }

    const existingEdge = graphManager.getEdge(edgeId);
    if (!existingEdge) return false;

    // If name changed, we need to create a new edge with new ID
    if (updates.name && updates.name !== existingEdge.name) {
      const newEdge: GraphEdge = {
        ...existingEdge,
        id: generateEdgeId(existingEdge.source, existingEdge.target, updates.name),
        name: updates.name,
        description: updates.description ?? existingEdge.description,
      };

      // Remove old edge
      graphManager.removeEdge(edgeId);
      removeEdge(edgeId);

      // Add new edge
      graphManager.addEdge(newEdge);
      addEdge(newEdge);

      return true;
    }

    // Just update description
    graphManager.updateEdge(edgeId, { description: updates.description });
    updateEdge(edgeId, { description: updates.description });

    return true;
  }, [graphManager, addEdge, removeEdge, updateEdge]);

  /**
   * Remove a link
   */
  const removeLink = useCallback((edgeId: string): boolean => {
    if (!graphManager.hasEdge(edgeId)) {
      return false;
    }

    graphManager.removeEdge(edgeId);
    removeEdge(edgeId);

    return true;
  }, [graphManager, removeEdge]);

  /**
   * Get orphan nodes (notes with no connections)
   */
  const getOrphanNotes = useCallback((): GraphNode[] => {
    return graphManager.getOrphanNodes();
  }, [graphManager]);

  /**
   * Get graph statistics
   */
  const getGraphStats = useCallback(() => {
    return {
      nodeCount: graphManager.getNodeCount(),
      edgeCount: graphManager.getEdgeCount(),
      orphanCount: graphManager.getOrphanNodes().length,
    };
  }, [graphManager]);

  /**
   * Get the Graphology instance for use with Sigma.js
   */
  const getGraphologyInstance = useCallback(() => {
    return graphManager.getGraphologyInstance();
  }, [graphManager]);

  /**
   * Reset the graph
   */
  const resetGraph = useCallback(() => {
    resetGraphManager();
    setNodes(new Map());
    setEdges(new Map());
  }, [setNodes, setEdges]);

  /**
   * Convert frontmatter links to LinkDefinitions for saving
   */
  const getLinksForFrontmatter = useCallback((noteId: string): LinkDefinition[] => {
    const outlinks = graphManager.getOutboundEdges(noteId);

    // Only include links that should be in frontmatter
    // (named relationships, not just 'relates to' from inline wikilinks)
    return outlinks
      .filter((edge) => edge.name !== 'relates to' || edge.description)
      .map((edge) => ({
        target: edge.target,
        name: edge.name,
        description: edge.description,
        created: new Date().toISOString(),
      }));
  }, [graphManager]);

  return {
    // Graph data
    nodes,
    edges,

    // Build operations
    buildGraph,
    updateGraphForNote,
    removeNoteFromGraph,
    resetGraph,

    // Query operations
    getLinksForNote,
    getConnectedNotesForNote,
    getOrphanNotes,
    getGraphStats,

    // Link operations
    addLink,
    updateLink,
    removeLink,
    getLinksForFrontmatter,

    // Advanced
    getGraphologyInstance,
  };
}

export default useGraph;
