import { Note, LinkDefinition } from '../notes/types';
import { extractWikilinks } from './linkParser';
import {
  GraphNode,
  GraphEdge,
  GraphStats,
  GraphFilter,
  DEFAULT_EDGE_APPEARANCE,
  EdgeAppearance,
} from './types';

export class GraphManager {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private nodesByFilepath: Map<string, string> = new Map(); // filepath -> id
  private nodesByTitle: Map<string, string> = new Map(); // lowercase title -> id

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.nodesByFilepath = new Map();
    this.nodesByTitle = new Map();
  }

  /**
   * Build the entire graph from a list of notes
   */
  buildFromNotes(notes: Note[]): void {
    this.clear();

    // First pass: create all nodes
    for (const note of notes) {
      this.addNode(note);
    }

    // Second pass: create edges from links
    for (const note of notes) {
      this.processNoteLinks(note);
    }

    // Update link counts
    this.updateLinkCounts();
  }

  /**
   * Clear all graph data
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.nodesByFilepath.clear();
    this.nodesByTitle.clear();
  }

  /**
   * Add a node for a note
   */
  addNode(note: Note): GraphNode {
    const node: GraphNode = {
      id: note.id,
      title: note.frontmatter.title,
      filepath: note.filepath,
      created: note.frontmatter.created,
      modified: note.frontmatter.modified,
      superTags: note.frontmatter.superTags,
      incomingLinkCount: 0,
      outgoingLinkCount: 0,
    };

    this.nodes.set(node.id, node);
    this.nodesByFilepath.set(note.filepath, node.id);
    this.nodesByTitle.set(note.frontmatter.title.toLowerCase(), node.id);

    return node;
  }

  /**
   * Remove a node and its associated edges
   */
  removeNode(noteId: string): void {
    const node = this.nodes.get(noteId);
    if (!node) return;

    // Remove associated edges
    for (const [edgeId, edge] of this.edges) {
      if (edge.source === noteId || edge.target === noteId) {
        this.edges.delete(edgeId);
      }
    }

    // Remove from lookup maps
    this.nodesByFilepath.delete(node.filepath);
    this.nodesByTitle.delete(node.title.toLowerCase());
    this.nodes.delete(noteId);

    this.updateLinkCounts();
  }

  /**
   * Update a node when a note changes
   */
  updateNode(note: Note): void {
    const existingNode = this.nodes.get(note.id);
    if (!existingNode) {
      this.addNode(note);
      this.processNoteLinks(note);
      this.updateLinkCounts();
      return;
    }

    // Update lookup maps if title changed
    if (existingNode.title !== note.frontmatter.title) {
      this.nodesByTitle.delete(existingNode.title.toLowerCase());
      this.nodesByTitle.set(note.frontmatter.title.toLowerCase(), note.id);
    }

    // Update node data
    existingNode.title = note.frontmatter.title;
    existingNode.filepath = note.filepath;
    existingNode.modified = note.frontmatter.modified;
    existingNode.superTags = note.frontmatter.superTags;

    // Re-process links (remove old ones, add new ones)
    this.removeEdgesFromNode(note.id);
    this.processNoteLinks(note);
    this.updateLinkCounts();
  }

  /**
   * Process links from a note and create edges
   */
  private processNoteLinks(note: Note): void {
    // Process explicit link definitions from frontmatter
    if (note.frontmatter.links) {
      for (const link of note.frontmatter.links) {
        this.addEdgeFromLinkDefinition(note.id, link);
      }
    }

    // Process inline wikilinks from content
    const wikilinks = extractWikilinks(note.content);
    for (const wikilink of wikilinks) {
      // Check if this wikilink already has a corresponding link definition
      const hasExplicitLink = note.frontmatter.links?.some(
        (l) => l.target.toLowerCase() === wikilink.target.toLowerCase()
      );

      if (!hasExplicitLink) {
        // Create an implicit link
        this.addImplicitEdge(note.id, wikilink.target);
      }
    }
  }

  /**
   * Add an edge from an explicit link definition
   */
  private addEdgeFromLinkDefinition(sourceId: string, link: LinkDefinition): void {
    const targetId = this.resolveTarget(link.target);
    if (!targetId) return; // Target note doesn't exist

    const edge: GraphEdge = {
      id: link.id,
      source: sourceId,
      target: targetId,
      name: link.name,
      description: link.description,
      created: link.created,
      appearance: link.appearance,
    };

    this.edges.set(edge.id, edge);
  }

  /**
   * Add an implicit edge from a wikilink without explicit definition
   */
  private addImplicitEdge(sourceId: string, targetRef: string): void {
    const targetId = this.resolveTarget(targetRef);
    if (!targetId || targetId === sourceId) return; // Target doesn't exist or self-reference

    // Check if edge already exists
    for (const edge of this.edges.values()) {
      if (edge.source === sourceId && edge.target === targetId) {
        return; // Edge already exists
      }
    }

    const edge: GraphEdge = {
      id: `${sourceId}-${targetId}-implicit`,
      source: sourceId,
      target: targetId,
      name: 'references',
      created: new Date().toISOString(),
      appearance: DEFAULT_EDGE_APPEARANCE,
    };

    this.edges.set(edge.id, edge);
  }

  /**
   * Resolve a target reference to a note ID
   */
  private resolveTarget(target: string): string | null {
    // Try exact ID match
    if (this.nodes.has(target)) {
      return target;
    }

    // Try title match (case-insensitive)
    const byTitle = this.nodesByTitle.get(target.toLowerCase());
    if (byTitle) {
      return byTitle;
    }

    // Try filepath match
    const byFilepath = this.nodesByFilepath.get(target);
    if (byFilepath) {
      return byFilepath;
    }

    // Try filename match (without extension)
    for (const [filepath, id] of this.nodesByFilepath) {
      const filename = filepath.split('/').pop()?.replace('.md', '') || '';
      if (filename.toLowerCase() === target.toLowerCase()) {
        return id;
      }
    }

    return null;
  }

  /**
   * Remove all edges originating from a node
   */
  private removeEdgesFromNode(nodeId: string): void {
    for (const [edgeId, edge] of this.edges) {
      if (edge.source === nodeId) {
        this.edges.delete(edgeId);
      }
    }
  }

  /**
   * Update incoming/outgoing link counts for all nodes
   */
  private updateLinkCounts(): void {
    // Reset counts
    for (const node of this.nodes.values()) {
      node.incomingLinkCount = 0;
      node.outgoingLinkCount = 0;
    }

    // Count edges
    for (const edge of this.edges.values()) {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);

      if (sourceNode) {
        sourceNode.outgoingLinkCount++;
      }
      if (targetNode) {
        targetNode.incomingLinkCount++;
      }
    }
  }

  /**
   * Get all nodes
   */
  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  /**
   * Get incoming edges (backlinks) for a node
   */
  getIncomingEdges(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.target === nodeId);
  }

  /**
   * Get outgoing edges (outlinks) for a node
   */
  getOutgoingEdges(nodeId: string): GraphEdge[] {
    return Array.from(this.edges.values()).filter((e) => e.source === nodeId);
  }

  /**
   * Get neighboring nodes (connected by edges)
   */
  getNeighbors(nodeId: string): GraphNode[] {
    const neighborIds = new Set<string>();

    for (const edge of this.edges.values()) {
      if (edge.source === nodeId) {
        neighborIds.add(edge.target);
      }
      if (edge.target === nodeId) {
        neighborIds.add(edge.source);
      }
    }

    return Array.from(neighborIds)
      .map((id) => this.nodes.get(id))
      .filter((n): n is GraphNode => n !== undefined);
  }

  /**
   * Add or update an edge
   */
  setEdge(edge: GraphEdge): void {
    this.edges.set(edge.id, edge);
    this.updateLinkCounts();
  }

  /**
   * Remove an edge
   */
  removeEdge(edgeId: string): void {
    this.edges.delete(edgeId);
    this.updateLinkCounts();
  }

  /**
   * Update edge appearance
   */
  updateEdgeAppearance(edgeId: string, appearance: Partial<EdgeAppearance>): void {
    const edge = this.edges.get(edgeId);
    if (edge) {
      edge.appearance = { ...edge.appearance, ...appearance };
    }
  }

  /**
   * Get graph statistics
   */
  getStats(): GraphStats {
    const orphanedNodes = Array.from(this.nodes.values()).filter(
      (n) => n.incomingLinkCount === 0 && n.outgoingLinkCount === 0
    );

    const nodeConnections = Array.from(this.nodes.values())
      .map((n) => ({
        id: n.id,
        title: n.title,
        connections: n.incomingLinkCount + n.outgoingLinkCount,
      }))
      .sort((a, b) => b.connections - a.connections);

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      orphanedNodes: orphanedNodes.length,
      mostConnectedNodes: nodeConnections.slice(0, 10),
    };
  }

  /**
   * Filter nodes based on criteria
   */
  filterNodes(filter: GraphFilter): GraphNode[] {
    let nodes = Array.from(this.nodes.values());

    // Filter by tags
    if (filter.includeTags?.length) {
      nodes = nodes.filter((n) =>
        n.superTags?.some((t) => filter.includeTags!.includes(t))
      );
    }
    if (filter.excludeTags?.length) {
      nodes = nodes.filter(
        (n) => !n.superTags?.some((t) => filter.excludeTags!.includes(t))
      );
    }

    // Filter by date range
    if (filter.dateRange?.start) {
      nodes = nodes.filter((n) => n.modified >= filter.dateRange!.start!);
    }
    if (filter.dateRange?.end) {
      nodes = nodes.filter((n) => n.modified <= filter.dateRange!.end!);
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      nodes = nodes.filter((n) => n.title.toLowerCase().includes(query));
    }

    return nodes;
  }

  /**
   * Get subgraph around a node up to a certain depth
   */
  getSubgraph(
    centerNodeId: string,
    maxDepth: number = 2
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const visitedNodes = new Set<string>();
    const includedEdges = new Set<string>();

    const traverse = (nodeId: string, depth: number) => {
      if (depth > maxDepth || visitedNodes.has(nodeId)) return;
      visitedNodes.add(nodeId);

      // Get all edges connected to this node
      for (const edge of this.edges.values()) {
        if (edge.source === nodeId || edge.target === nodeId) {
          includedEdges.add(edge.id);
          const neighborId = edge.source === nodeId ? edge.target : edge.source;
          traverse(neighborId, depth + 1);
        }
      }
    };

    traverse(centerNodeId, 0);

    return {
      nodes: Array.from(visitedNodes)
        .map((id) => this.nodes.get(id))
        .filter((n): n is GraphNode => n !== undefined),
      edges: Array.from(includedEdges)
        .map((id) => this.edges.get(id))
        .filter((e): e is GraphEdge => e !== undefined),
    };
  }
}

// Singleton instance
export const graphManager = new GraphManager();
