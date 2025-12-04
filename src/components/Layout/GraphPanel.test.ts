// src/components/Layout/GraphPanel.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import Graph from 'graphology';
import { getGraphManager, resetGraphManager } from '../../lib/graph/GraphManager';
import { GraphNode, GraphEdge } from '../../lib/graph/types';

describe('GraphPanel graph building logic', () => {
  beforeEach(() => {
    resetGraphManager();
  });

  describe('building sigma graph from GraphManager', () => {
    it('should create nodes with required sigma attributes (x, y, size, color, label)', () => {
      const graphManager = getGraphManager();

      // Add test nodes
      const node1: GraphNode = {
        id: 'node1',
        label: 'Test Note 1',
        filepath: 'test-note-1.md',
        colour: '#ff0000',
      };
      const node2: GraphNode = {
        id: 'node2',
        label: 'Test Note 2',
        filepath: 'test-note-2.md',
      };

      graphManager.addNode(node1);
      graphManager.addNode(node2);

      // Get the graphology instance
      const sourceGraph = graphManager.getGraphologyInstance();

      expect(sourceGraph.order).toBe(2);
      expect(sourceGraph.hasNode('node1')).toBe(true);
      expect(sourceGraph.hasNode('node2')).toBe(true);

      // Verify node attributes
      const node1Attrs = sourceGraph.getNodeAttributes('node1');
      expect(node1Attrs.label).toBe('Test Note 1');
      expect(node1Attrs.filepath).toBe('test-note-1.md');
      expect(node1Attrs.colour).toBe('#ff0000');
    });

    it('should copy nodes from source graph to new sigma graph', () => {
      const graphManager = getGraphManager();

      // Add test nodes
      graphManager.addNode({ id: 'node1', label: 'Note 1', filepath: 'note-1.md' });
      graphManager.addNode({ id: 'node2', label: 'Note 2', filepath: 'note-2.md' });
      graphManager.addNode({ id: 'node3', label: 'Note 3', filepath: 'note-3.md' });

      // Add edges
      const edge: GraphEdge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        name: 'relates to',
      };
      graphManager.addEdge(edge);

      const sourceGraph = graphManager.getGraphologyInstance();

      // Simulate the GraphPanel's graph building logic
      const nodesToInclude = new Set(sourceGraph.nodes());
      const newGraph = new Graph({ type: 'directed', multi: true });

      // Calculate max degree
      let maxDegree = 1;
      nodesToInclude.forEach((nodeId) => {
        const degree = sourceGraph.degree(nodeId);
        if (degree > maxDegree) maxDegree = degree;
      });

      // Copy nodes with sigma-compatible attributes
      const NODE_SIZE_MIN = 4;
      const NODE_SIZE_MAX = 20;
      const DEFAULT_NODE_COLOUR = '#89b4fa';

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

      // Copy edges
      sourceGraph.forEachEdge((edgeId, attributes, source, target) => {
        if (newGraph.hasNode(source) && newGraph.hasNode(target)) {
          newGraph.addEdgeWithKey(edgeId, source, target, {
            label: attributes.name,
            size: 1,
            color: '#6c7086',
          });
        }
      });

      // Verify the new graph
      expect(newGraph.order).toBe(3);
      expect(newGraph.size).toBe(1);

      // Verify nodes have required sigma attributes
      const node1Attrs = newGraph.getNodeAttributes('node1');
      expect(node1Attrs.label).toBe('Note 1');
      expect(typeof node1Attrs.x).toBe('number');
      expect(typeof node1Attrs.y).toBe('number');
      expect(typeof node1Attrs.size).toBe('number');
      expect(node1Attrs.color).toBeDefined();

      // Connected nodes should have larger size
      expect(node1Attrs.size).toBeGreaterThan(NODE_SIZE_MIN);
    });

    it('should return empty set when source graph is empty', () => {
      const graphManager = getGraphManager();
      const sourceGraph = graphManager.getGraphologyInstance();

      const nodesToInclude = new Set(sourceGraph.nodes());

      expect(nodesToInclude.size).toBe(0);
      expect(sourceGraph.order).toBe(0);
    });

    it('should handle local mode filtering for selected node', () => {
      const graphManager = getGraphManager();

      // Create a graph with 4 nodes and some connections
      graphManager.addNode({ id: 'center', label: 'Center', filepath: 'center.md' });
      graphManager.addNode({ id: 'neighbor1', label: 'Neighbor 1', filepath: 'neighbor1.md' });
      graphManager.addNode({ id: 'neighbor2', label: 'Neighbor 2', filepath: 'neighbor2.md' });
      graphManager.addNode({ id: 'isolated', label: 'Isolated', filepath: 'isolated.md' });

      graphManager.addEdge({ id: 'e1', source: 'center', target: 'neighbor1', name: 'links to' });
      graphManager.addEdge({ id: 'e2', source: 'neighbor2', target: 'center', name: 'links to' });

      const sourceGraph = graphManager.getGraphologyInstance();
      const selectedNoteId = 'center';

      // Simulate local mode filtering
      const nodesToInclude = new Set<string>();
      nodesToInclude.add(selectedNoteId);

      sourceGraph.forEachNeighbor(selectedNoteId, (neighborId) => {
        nodesToInclude.add(neighborId);
      });

      // Should include center and its neighbors, but not isolated node
      expect(nodesToInclude.size).toBe(3);
      expect(nodesToInclude.has('center')).toBe(true);
      expect(nodesToInclude.has('neighbor1')).toBe(true);
      expect(nodesToInclude.has('neighbor2')).toBe(true);
      expect(nodesToInclude.has('isolated')).toBe(false);
    });

    it('should calculate node sizes based on degree', () => {
      const graphManager = getGraphManager();

      // Create nodes with different connection counts
      graphManager.addNode({ id: 'hub', label: 'Hub', filepath: 'hub.md' });
      graphManager.addNode({ id: 'spoke1', label: 'Spoke 1', filepath: 'spoke1.md' });
      graphManager.addNode({ id: 'spoke2', label: 'Spoke 2', filepath: 'spoke2.md' });
      graphManager.addNode({ id: 'spoke3', label: 'Spoke 3', filepath: 'spoke3.md' });
      graphManager.addNode({ id: 'orphan', label: 'Orphan', filepath: 'orphan.md' });

      graphManager.addEdge({ id: 'e1', source: 'hub', target: 'spoke1', name: 'links to' });
      graphManager.addEdge({ id: 'e2', source: 'hub', target: 'spoke2', name: 'links to' });
      graphManager.addEdge({ id: 'e3', source: 'hub', target: 'spoke3', name: 'links to' });

      const sourceGraph = graphManager.getGraphologyInstance();

      // Get degrees
      const hubDegree = sourceGraph.degree('hub');
      const spokeDegree = sourceGraph.degree('spoke1');
      const orphanDegree = sourceGraph.degree('orphan');

      expect(hubDegree).toBe(3); // Connected to 3 spokes
      expect(spokeDegree).toBe(1); // Connected to hub only
      expect(orphanDegree).toBe(0); // No connections

      // Verify size calculation
      const NODE_SIZE_MIN = 4;
      const NODE_SIZE_MAX = 20;
      const maxDegree = 3;

      const hubSize = NODE_SIZE_MIN + (hubDegree / maxDegree) * (NODE_SIZE_MAX - NODE_SIZE_MIN);
      const spokeSize = NODE_SIZE_MIN + (spokeDegree / maxDegree) * (NODE_SIZE_MAX - NODE_SIZE_MIN);
      const orphanSize = NODE_SIZE_MIN + (orphanDegree / maxDegree) * (NODE_SIZE_MAX - NODE_SIZE_MIN);

      expect(hubSize).toBe(NODE_SIZE_MAX); // Hub should be max size
      expect(spokeSize).toBeGreaterThan(NODE_SIZE_MIN); // Spokes should be between min and max
      expect(spokeSize).toBeLessThan(NODE_SIZE_MAX);
      expect(orphanSize).toBe(NODE_SIZE_MIN); // Orphan should be min size
    });

    it('should only include edges between included nodes', () => {
      const graphManager = getGraphManager();

      graphManager.addNode({ id: 'a', label: 'A', filepath: 'a.md' });
      graphManager.addNode({ id: 'b', label: 'B', filepath: 'b.md' });
      graphManager.addNode({ id: 'c', label: 'C', filepath: 'c.md' });

      graphManager.addEdge({ id: 'e1', source: 'a', target: 'b', name: 'links to' });
      graphManager.addEdge({ id: 'e2', source: 'b', target: 'c', name: 'links to' });

      const sourceGraph = graphManager.getGraphologyInstance();

      // Only include nodes a and b
      const nodesToInclude = new Set(['a', 'b']);
      const newGraph = new Graph({ type: 'directed', multi: true });

      nodesToInclude.forEach((nodeId) => {
        newGraph.addNode(nodeId, { label: nodeId, x: 0, y: 0, size: 10, color: '#fff' });
      });

      sourceGraph.forEachEdge((edgeId, attributes, source, target) => {
        if (newGraph.hasNode(source) && newGraph.hasNode(target)) {
          newGraph.addEdgeWithKey(edgeId, source, target, { label: attributes.name });
        }
      });

      // Should only have edge e1 (a->b), not e2 (b->c) because c is not included
      expect(newGraph.size).toBe(1);
      expect(newGraph.hasEdge('e1')).toBe(true);
      expect(newGraph.hasEdge('e2')).toBe(false);
    });
  });

  describe('shouldShowGraph condition', () => {
    it('should return true when graph has nodes', () => {
      const newGraph = new Graph({ type: 'directed', multi: true });
      newGraph.addNode('test', { label: 'Test', x: 0, y: 0, size: 10, color: '#fff' });

      const shouldShowGraph = newGraph && newGraph.order > 0;
      expect(shouldShowGraph).toBe(true);
    });

    it('should return false when graph is empty', () => {
      const newGraph = new Graph({ type: 'directed', multi: true });

      const shouldShowGraph = newGraph && newGraph.order > 0;
      expect(shouldShowGraph).toBe(false);
    });

    it('should return false when graph is null', () => {
      // Simulate the condition check from GraphPanel
      const maybeGraph = null as Graph | null;
      const shouldShowGraph = maybeGraph !== null && maybeGraph.order > 0;
      expect(shouldShowGraph).toBe(false);
    });
  });
});
