// src/lib/graph/GraphManager.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphManager, resetGraphManager } from './GraphManager';
import { GraphNode, GraphEdge } from './types';

describe('GraphManager', () => {
  let manager: GraphManager;

  beforeEach(() => {
    resetGraphManager();
    manager = new GraphManager();
  });

  describe('Node Operations', () => {
    it('should add a node', () => {
      const node: GraphNode = {
        id: 'node-1',
        label: 'Test Node',
        filepath: 'test.md',
      };

      manager.addNode(node);

      expect(manager.hasNode('node-1')).toBe(true);
      expect(manager.getNodeCount()).toBe(1);
    });

    it('should get a node by ID', () => {
      const node: GraphNode = {
        id: 'node-1',
        label: 'Test Node',
        filepath: 'test.md',
        colour: '#ff0000',
      };

      manager.addNode(node);
      const retrieved = manager.getNode('node-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('node-1');
      expect(retrieved?.label).toBe('Test Node');
      expect(retrieved?.colour).toBe('#ff0000');
    });

    it('should return undefined for non-existent node', () => {
      expect(manager.getNode('non-existent')).toBeUndefined();
    });

    it('should update an existing node', () => {
      const node: GraphNode = {
        id: 'node-1',
        label: 'Original',
        filepath: 'test.md',
      };

      manager.addNode(node);
      manager.updateNode('node-1', { label: 'Updated' });

      const updated = manager.getNode('node-1');
      expect(updated?.label).toBe('Updated');
    });

    it('should update node when adding with same ID', () => {
      manager.addNode({ id: 'node-1', label: 'First', filepath: 'a.md' });
      manager.addNode({ id: 'node-1', label: 'Second', filepath: 'b.md' });

      expect(manager.getNodeCount()).toBe(1);
      expect(manager.getNode('node-1')?.label).toBe('Second');
    });

    it('should remove a node', () => {
      manager.addNode({ id: 'node-1', label: 'Test', filepath: 'test.md' });
      manager.removeNode('node-1');

      expect(manager.hasNode('node-1')).toBe(false);
      expect(manager.getNodeCount()).toBe(0);
    });

    it('should get all nodes', () => {
      manager.addNode({ id: 'node-1', label: 'Node 1', filepath: '1.md' });
      manager.addNode({ id: 'node-2', label: 'Node 2', filepath: '2.md' });
      manager.addNode({ id: 'node-3', label: 'Node 3', filepath: '3.md' });

      const nodes = manager.getAllNodes();
      expect(nodes).toHaveLength(3);
    });
  });

  describe('Edge Operations', () => {
    beforeEach(() => {
      manager.addNode({ id: 'node-1', label: 'Node 1', filepath: '1.md' });
      manager.addNode({ id: 'node-2', label: 'Node 2', filepath: '2.md' });
      manager.addNode({ id: 'node-3', label: 'Node 3', filepath: '3.md' });
    });

    it('should add an edge between existing nodes', () => {
      const edge: GraphEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        name: 'relates to',
      };

      manager.addEdge(edge);

      expect(manager.hasEdge('edge-1')).toBe(true);
      expect(manager.getEdgeCount()).toBe(1);
    });

    it('should not add edge if source node missing', () => {
      const edge: GraphEdge = {
        id: 'edge-1',
        source: 'non-existent',
        target: 'node-2',
        name: 'relates to',
      };

      manager.addEdge(edge);

      expect(manager.hasEdge('edge-1')).toBe(false);
    });

    it('should not add edge if target node missing', () => {
      const edge: GraphEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'non-existent',
        name: 'relates to',
      };

      manager.addEdge(edge);

      expect(manager.hasEdge('edge-1')).toBe(false);
    });

    it('should get edge by ID', () => {
      manager.addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        name: 'supports',
        description: 'A supports B',
      });

      const edge = manager.getEdge('edge-1');

      expect(edge).toBeDefined();
      expect(edge?.source).toBe('node-1');
      expect(edge?.target).toBe('node-2');
      expect(edge?.name).toBe('supports');
      expect(edge?.description).toBe('A supports B');
    });

    it('should update an existing edge', () => {
      manager.addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        name: 'relates to',
      });

      manager.updateEdge('edge-1', { description: 'Updated description' });

      const edge = manager.getEdge('edge-1');
      expect(edge?.description).toBe('Updated description');
    });

    it('should remove an edge', () => {
      manager.addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        name: 'relates to',
      });

      manager.removeEdge('edge-1');

      expect(manager.hasEdge('edge-1')).toBe(false);
    });

    it('should remove edges when node is removed', () => {
      manager.addEdge({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        name: 'relates to',
      });
      manager.addEdge({
        id: 'edge-2',
        source: 'node-2',
        target: 'node-3',
        name: 'relates to',
      });

      manager.removeNode('node-2');

      expect(manager.hasEdge('edge-1')).toBe(false);
      expect(manager.hasEdge('edge-2')).toBe(false);
    });
  });

  describe('Relationship Queries', () => {
    beforeEach(() => {
      manager.addNode({ id: 'A', label: 'A', filepath: 'a.md' });
      manager.addNode({ id: 'B', label: 'B', filepath: 'b.md' });
      manager.addNode({ id: 'C', label: 'C', filepath: 'c.md' });
      manager.addNode({ id: 'D', label: 'D', filepath: 'd.md' });

      // A -> B -> C
      // A -> C
      manager.addEdge({ id: 'e1', source: 'A', target: 'B', name: 'supports' });
      manager.addEdge({ id: 'e2', source: 'B', target: 'C', name: 'extends' });
      manager.addEdge({ id: 'e3', source: 'A', target: 'C', name: 'relates to' });
      // D is orphan
    });

    it('should get outbound edges', () => {
      const outbound = manager.getOutboundEdges('A');

      expect(outbound).toHaveLength(2);
      expect(outbound.map((e) => e.target)).toContain('B');
      expect(outbound.map((e) => e.target)).toContain('C');
    });

    it('should get inbound edges (backlinks)', () => {
      const inbound = manager.getInboundEdges('C');

      expect(inbound).toHaveLength(2);
      expect(inbound.map((e) => e.source)).toContain('A');
      expect(inbound.map((e) => e.source)).toContain('B');
    });

    it('should get all connected edges', () => {
      const connected = manager.getConnectedEdges('B');

      expect(connected).toHaveLength(2);
    });

    it('should get connected nodes', () => {
      const connected = manager.getConnectedNodes('B');

      expect(connected).toHaveLength(2);
      expect(connected.map((n) => n.id)).toContain('A');
      expect(connected.map((n) => n.id)).toContain('C');
    });

    it('should get linked nodes (outbound only)', () => {
      const linked = manager.getLinkedNodes('A');

      expect(linked).toHaveLength(2);
      expect(linked.map((n) => n.id)).toContain('B');
      expect(linked.map((n) => n.id)).toContain('C');
    });

    it('should get backlink nodes (inbound only)', () => {
      const backlinks = manager.getBacklinkNodes('C');

      expect(backlinks).toHaveLength(2);
      expect(backlinks.map((n) => n.id)).toContain('A');
      expect(backlinks.map((n) => n.id)).toContain('B');
    });

    it('should get node degree', () => {
      const degreeA = manager.getNodeDegree('A');
      const degreeB = manager.getNodeDegree('B');
      const degreeD = manager.getNodeDegree('D');

      expect(degreeA.out).toBe(2);
      expect(degreeA.in).toBe(0);
      expect(degreeA.total).toBe(2);

      expect(degreeB.out).toBe(1);
      expect(degreeB.in).toBe(1);
      expect(degreeB.total).toBe(2);

      expect(degreeD.total).toBe(0);
    });

    it('should find orphan nodes', () => {
      const orphans = manager.getOrphanNodes();

      expect(orphans).toHaveLength(1);
      expect(orphans[0].id).toBe('D');
    });

    it('should return empty array for non-existent node queries', () => {
      expect(manager.getOutboundEdges('non-existent')).toEqual([]);
      expect(manager.getInboundEdges('non-existent')).toEqual([]);
      expect(manager.getConnectedNodes('non-existent')).toEqual([]);
    });
  });

  describe('Export/Import', () => {
    it('should export to maps', () => {
      manager.addNode({ id: 'A', label: 'A', filepath: 'a.md' });
      manager.addNode({ id: 'B', label: 'B', filepath: 'b.md' });
      manager.addEdge({ id: 'e1', source: 'A', target: 'B', name: 'supports' });

      const { nodes, edges } = manager.exportToMaps();

      expect(nodes.size).toBe(2);
      expect(edges.size).toBe(1);
      expect(nodes.get('A')?.label).toBe('A');
      expect(edges.get('e1')?.name).toBe('supports');
    });

    it('should import from maps', () => {
      const nodes = new Map<string, GraphNode>();
      const edges = new Map<string, GraphEdge>();

      nodes.set('X', { id: 'X', label: 'X', filepath: 'x.md' });
      nodes.set('Y', { id: 'Y', label: 'Y', filepath: 'y.md' });
      edges.set('e1', { id: 'e1', source: 'X', target: 'Y', name: 'extends' });

      manager.importFromMaps(nodes, edges);

      expect(manager.getNodeCount()).toBe(2);
      expect(manager.getEdgeCount()).toBe(1);
      expect(manager.getNode('X')?.label).toBe('X');
    });

    it('should clear graph before import', () => {
      manager.addNode({ id: 'A', label: 'A', filepath: 'a.md' });

      const nodes = new Map<string, GraphNode>();
      nodes.set('X', { id: 'X', label: 'X', filepath: 'x.md' });

      manager.importFromMaps(nodes, new Map());

      expect(manager.hasNode('A')).toBe(false);
      expect(manager.hasNode('X')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all nodes and edges', () => {
      manager.addNode({ id: 'A', label: 'A', filepath: 'a.md' });
      manager.addNode({ id: 'B', label: 'B', filepath: 'b.md' });
      manager.addEdge({ id: 'e1', source: 'A', target: 'B', name: 'relates to' });

      manager.clear();

      expect(manager.getNodeCount()).toBe(0);
      expect(manager.getEdgeCount()).toBe(0);
    });
  });

  describe('updateNodeSizes', () => {
    it('should update node sizes based on degree', () => {
      manager.addNode({ id: 'A', label: 'A', filepath: 'a.md' });
      manager.addNode({ id: 'B', label: 'B', filepath: 'b.md' });
      manager.addNode({ id: 'C', label: 'C', filepath: 'c.md' });
      manager.addEdge({ id: 'e1', source: 'A', target: 'B', name: 'r' });
      manager.addEdge({ id: 'e2', source: 'A', target: 'C', name: 'r' });
      manager.addEdge({ id: 'e3', source: 'B', target: 'C', name: 'r' });

      manager.updateNodeSizes(1, 5);

      const nodeA = manager.getNode('A');
      const nodeB = manager.getNode('B');
      const nodeC = manager.getNode('C');

      // A has degree 2, B has degree 2, C has degree 2 - all should have same size
      // Since all have same degree, they should all have max size
      expect(nodeA?.size).toBeDefined();
      expect(nodeB?.size).toBeDefined();
      expect(nodeC?.size).toBeDefined();
    });
  });
});
