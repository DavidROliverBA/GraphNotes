// src/lib/graph/GraphManager.ts

import Graph from 'graphology';
import { GraphNode, GraphEdge, EdgeStyle, DEFAULT_RELATIONSHIP_TYPES } from './types';

// Type definitions for graph attributes
interface NodeAttributes {
  label: string;
  filepath: string;
  icon?: string;
  colour?: string;
  size?: number;
}

interface EdgeAttributes {
  name: string;
  description?: string;
  style?: EdgeStyle;
}

/**
 * GraphManager wraps Graphology to provide a clean API for managing
 * the note graph structure.
 */
export class GraphManager {
  private graph: Graph<NodeAttributes, EdgeAttributes>;

  constructor() {
    this.graph = new Graph<NodeAttributes, EdgeAttributes>({ type: 'directed', multi: true });
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.graph.clear();
  }

  // ============ Node Operations ============

  /**
   * Add a node to the graph
   */
  addNode(node: GraphNode): void {
    if (this.graph.hasNode(node.id)) {
      this.updateNode(node.id, node);
      return;
    }

    this.graph.addNode(node.id, {
      label: node.label,
      filepath: node.filepath,
      icon: node.icon,
      colour: node.colour,
      size: node.size ?? 1,
    });
  }

  /**
   * Update an existing node's attributes
   */
  updateNode(id: string, updates: Partial<GraphNode>): void {
    if (!this.graph.hasNode(id)) {
      return;
    }

    const currentAttrs = this.graph.getNodeAttributes(id);
    this.graph.setNodeAttribute(id, 'label', updates.label ?? currentAttrs.label);
    this.graph.setNodeAttribute(id, 'filepath', updates.filepath ?? currentAttrs.filepath);

    if (updates.icon !== undefined) {
      this.graph.setNodeAttribute(id, 'icon', updates.icon);
    }
    if (updates.colour !== undefined) {
      this.graph.setNodeAttribute(id, 'colour', updates.colour);
    }
    if (updates.size !== undefined) {
      this.graph.setNodeAttribute(id, 'size', updates.size);
    }
  }

  /**
   * Remove a node and all its connected edges
   */
  removeNode(id: string): void {
    if (this.graph.hasNode(id)) {
      this.graph.dropNode(id);
    }
  }

  /**
   * Check if a node exists
   */
  hasNode(id: string): boolean {
    return this.graph.hasNode(id);
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): GraphNode | undefined {
    if (!this.graph.hasNode(id)) {
      return undefined;
    }

    const attrs = this.graph.getNodeAttributes(id);
    return {
      id,
      label: attrs.label,
      filepath: attrs.filepath,
      icon: attrs.icon,
      colour: attrs.colour,
      size: attrs.size,
    };
  }

  /**
   * Get all nodes
   */
  getAllNodes(): GraphNode[] {
    return this.graph.mapNodes((id, attrs) => ({
      id,
      label: attrs.label,
      filepath: attrs.filepath,
      icon: attrs.icon,
      colour: attrs.colour,
      size: attrs.size,
    }));
  }

  /**
   * Get the total number of nodes
   */
  getNodeCount(): number {
    return this.graph.order;
  }

  // ============ Edge Operations ============

  /**
   * Add an edge to the graph
   */
  addEdge(edge: GraphEdge): void {
    // Check if source and target nodes exist
    if (!this.graph.hasNode(edge.source)) {
      console.warn(`Cannot add edge: source node ${edge.source} does not exist`);
      return;
    }
    if (!this.graph.hasNode(edge.target)) {
      console.warn(`Cannot add edge: target node ${edge.target} does not exist`);
      return;
    }

    // Check if edge already exists
    if (this.graph.hasEdge(edge.id)) {
      this.updateEdge(edge.id, edge);
      return;
    }

    // Get default style based on relationship name
    const defaultStyle = this.getDefaultStyleForRelationship(edge.name);

    this.graph.addEdgeWithKey(edge.id, edge.source, edge.target, {
      name: edge.name,
      description: edge.description,
      style: edge.style ?? defaultStyle,
    });
  }

  /**
   * Update an existing edge
   */
  updateEdge(id: string, updates: Partial<GraphEdge>): void {
    if (!this.graph.hasEdge(id)) {
      return;
    }

    if (updates.name !== undefined) {
      this.graph.setEdgeAttribute(id, 'name', updates.name);
      // Update style if relationship name changed
      const defaultStyle = this.getDefaultStyleForRelationship(updates.name);
      this.graph.setEdgeAttribute(id, 'style', updates.style ?? defaultStyle);
    }
    if (updates.description !== undefined) {
      this.graph.setEdgeAttribute(id, 'description', updates.description);
    }
    if (updates.style !== undefined) {
      this.graph.setEdgeAttribute(id, 'style', updates.style);
    }
  }

  /**
   * Remove an edge
   */
  removeEdge(id: string): void {
    if (this.graph.hasEdge(id)) {
      this.graph.dropEdge(id);
    }
  }

  /**
   * Check if an edge exists
   */
  hasEdge(id: string): boolean {
    return this.graph.hasEdge(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): GraphEdge | undefined {
    if (!this.graph.hasEdge(id)) {
      return undefined;
    }

    const attrs = this.graph.getEdgeAttributes(id);
    const source = this.graph.source(id);
    const target = this.graph.target(id);

    return {
      id,
      source,
      target,
      name: attrs.name,
      description: attrs.description,
      style: attrs.style,
    };
  }

  /**
   * Get all edges
   */
  getAllEdges(): GraphEdge[] {
    return this.graph.mapEdges((id, attrs, source, target) => ({
      id,
      source,
      target,
      name: attrs.name,
      description: attrs.description,
      style: attrs.style,
    }));
  }

  /**
   * Get the total number of edges
   */
  getEdgeCount(): number {
    return this.graph.size;
  }

  // ============ Relationship Queries ============

  /**
   * Get all outbound edges from a node (links from this note)
   */
  getOutboundEdges(nodeId: string): GraphEdge[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }

    return this.graph.mapOutEdges(nodeId, (id, attrs, source, target) => ({
      id,
      source,
      target,
      name: attrs.name,
      description: attrs.description,
      style: attrs.style,
    }));
  }

  /**
   * Get all inbound edges to a node (backlinks to this note)
   */
  getInboundEdges(nodeId: string): GraphEdge[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }

    return this.graph.mapInEdges(nodeId, (id, attrs, source, target) => ({
      id,
      source,
      target,
      name: attrs.name,
      description: attrs.description,
      style: attrs.style,
    }));
  }

  /**
   * Get all edges connected to a node (both inbound and outbound)
   */
  getConnectedEdges(nodeId: string): GraphEdge[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }

    return this.graph.mapEdges(nodeId, (id, attrs, source, target) => ({
      id,
      source,
      target,
      name: attrs.name,
      description: attrs.description,
      style: attrs.style,
    }));
  }

  /**
   * Get all nodes connected to a given node
   */
  getConnectedNodes(nodeId: string): GraphNode[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }

    const connectedIds = new Set<string>();

    this.graph.forEachNeighbor(nodeId, (neighborId) => {
      connectedIds.add(neighborId);
    });

    return Array.from(connectedIds).map((id) => this.getNode(id)!).filter(Boolean);
  }

  /**
   * Get nodes that this node links to (outbound only)
   */
  getLinkedNodes(nodeId: string): GraphNode[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }

    const linkedIds = new Set<string>();

    this.graph.forEachOutNeighbor(nodeId, (neighborId) => {
      linkedIds.add(neighborId);
    });

    return Array.from(linkedIds).map((id) => this.getNode(id)!).filter(Boolean);
  }

  /**
   * Get nodes that link to this node (backlinks)
   */
  getBacklinkNodes(nodeId: string): GraphNode[] {
    if (!this.graph.hasNode(nodeId)) {
      return [];
    }

    const backlinkIds = new Set<string>();

    this.graph.forEachInNeighbor(nodeId, (neighborId) => {
      backlinkIds.add(neighborId);
    });

    return Array.from(backlinkIds).map((id) => this.getNode(id)!).filter(Boolean);
  }

  /**
   * Get the degree (number of connections) for a node
   */
  getNodeDegree(nodeId: string): { in: number; out: number; total: number } {
    if (!this.graph.hasNode(nodeId)) {
      return { in: 0, out: 0, total: 0 };
    }

    return {
      in: this.graph.inDegree(nodeId),
      out: this.graph.outDegree(nodeId),
      total: this.graph.degree(nodeId),
    };
  }

  /**
   * Find orphan nodes (nodes with no connections)
   */
  getOrphanNodes(): GraphNode[] {
    return this.getAllNodes().filter((node) => {
      return this.graph.degree(node.id) === 0;
    });
  }

  // ============ Export/Import ============

  /**
   * Export graph data to Maps for use with Zustand store
   */
  exportToMaps(): { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> } {
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();

    for (const node of this.getAllNodes()) {
      nodes.set(node.id, node);
    }

    for (const edge of this.getAllEdges()) {
      edges.set(edge.id, edge);
    }

    return { nodes, edges };
  }

  /**
   * Import graph data from Maps
   */
  importFromMaps(nodes: Map<string, GraphNode>, edges: Map<string, GraphEdge>): void {
    this.clear();

    // Add nodes first
    for (const node of nodes.values()) {
      this.addNode(node);
    }

    // Then add edges
    for (const edge of edges.values()) {
      this.addEdge(edge);
    }
  }

  /**
   * Get the underlying Graphology instance (for advanced operations or Sigma.js)
   */
  getGraphologyInstance(): Graph<NodeAttributes, EdgeAttributes> {
    return this.graph;
  }

  // ============ Helpers ============

  /**
   * Get default style for a relationship type
   */
  private getDefaultStyleForRelationship(name: string): EdgeStyle {
    const relType = DEFAULT_RELATIONSHIP_TYPES.find(
      (rt) => rt.name.toLowerCase() === name.toLowerCase()
    );

    if (relType) {
      return {
        colour: relType.colour,
        width: 1,
        dashed: false,
      };
    }

    // Default style for unknown relationships
    return {
      colour: '#6c7086',
      width: 1,
      dashed: false,
    };
  }

  /**
   * Update node sizes based on connection count
   */
  updateNodeSizes(minSize: number = 1, maxSize: number = 5): void {
    const nodes = this.getAllNodes();
    if (nodes.length === 0) return;

    // Get degree range
    const degrees = nodes.map((n) => this.getNodeDegree(n.id).total);
    const minDegree = Math.min(...degrees);
    const maxDegree = Math.max(...degrees);
    const degreeRange = maxDegree - minDegree || 1;

    // Update each node's size
    for (const node of nodes) {
      const degree = this.getNodeDegree(node.id).total;
      const normalizedSize = minSize + ((degree - minDegree) / degreeRange) * (maxSize - minSize);
      this.graph.setNodeAttribute(node.id, 'size', normalizedSize);
    }
  }
}

// Singleton instance
let graphManagerInstance: GraphManager | null = null;

export function getGraphManager(): GraphManager {
  if (!graphManagerInstance) {
    graphManagerInstance = new GraphManager();
  }
  return graphManagerInstance;
}

export function resetGraphManager(): void {
  if (graphManagerInstance) {
    graphManagerInstance.clear();
  }
  graphManagerInstance = null;
}
