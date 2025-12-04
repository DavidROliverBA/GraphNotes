// src/components/Graph/GraphView.tsx

import React, { useEffect, useState } from 'react';
import { useRegisterEvents, useSigma, useSetSettings } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { useUIStore } from '../../stores/uiStore';
import {
  colourPalette,
} from './NodeStyles';

interface GraphViewProps {
  focusNodeId?: string | null; // For local graph view
}

/**
 * GraphView component - handles events and visual effects within SigmaContainer
 */
const GraphView: React.FC<GraphViewProps> = ({ focusNodeId }) => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const { selectedNoteId, setSelectedNoteId, setSelectedNodeId } = useUIStore();

  // Register event handlers
  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        setHoveredNode(event.node);
        // Change cursor to pointer
        const container = sigma.getContainer();
        if (container) {
          container.style.cursor = 'pointer';
        }
      },
      leaveNode: () => {
        setHoveredNode(null);
        // Reset cursor
        const container = sigma.getContainer();
        if (container) {
          container.style.cursor = 'default';
        }
      },
      clickNode: (event) => {
        const nodeId = event.node;
        setSelectedNoteId(nodeId);
        setSelectedNodeId(nodeId);
      },
      doubleClickNode: (event) => {
        // Double click could center the view on the node
        const camera = sigma.getCamera();
        const nodePosition = sigma.getNodeDisplayData(event.node);
        if (nodePosition) {
          camera.animate(
            { x: nodePosition.x, y: nodePosition.y, ratio: 0.5 },
            { duration: 300 }
          );
        }
      },
    });
  }, [registerEvents, sigma, setSelectedNoteId, setSelectedNodeId]);

  // Update visual settings based on hover/selection
  useEffect(() => {
    const graph = sigma.getGraph();

    setSettings({
      nodeReducer: (node, data) => {
        const res = { ...data };

        // Determine node state
        const isSelected = node === selectedNoteId;
        const isHovered = node === hoveredNode;
        const isFocused = focusNodeId ? node === focusNodeId : false;

        // Check if node is neighbor of hovered node
        let isNeighbor = false;
        if (hoveredNode && hoveredNode !== node) {
          try {
            isNeighbor =
              graph.hasEdge(hoveredNode, node) || graph.hasEdge(node, hoveredNode);
          } catch {
            isNeighbor = false;
          }
        }

        // Check if should be dimmed
        const shouldDim = hoveredNode && !isHovered && !isNeighbor && !isSelected;

        // Apply visual styles based on state
        if (isSelected) {
          res.color = colourPalette.selected;
          res.highlighted = true;
          res.zIndex = 3;
        } else if (isHovered) {
          res.color = colourPalette.hovered;
          res.highlighted = true;
          res.zIndex = 2;
        } else if (isNeighbor) {
          res.color = colourPalette.neighbor;
          res.zIndex = 1;
        } else if (shouldDim) {
          res.color = colourPalette.dimmed;
          res.zIndex = 0;
        } else if (isFocused) {
          res.color = colourPalette.selected;
          res.zIndex = 3;
        }

        return res;
      },
      edgeReducer: (edge, data) => {
        const res = { ...data };
        const graph = sigma.getGraph();

        // Get source and target
        const source = graph.source(edge);
        const target = graph.target(edge);

        // Check if edge connects to hovered or selected node
        const isConnectedToHovered =
          hoveredNode && (source === hoveredNode || target === hoveredNode);
        const isConnectedToSelected =
          selectedNoteId && (source === selectedNoteId || target === selectedNoteId);

        // Check if should be dimmed
        const shouldDim = hoveredNode && !isConnectedToHovered && !isConnectedToSelected;

        if (isConnectedToHovered || isConnectedToSelected) {
          res.color = colourPalette.edgeHighlighted;
          res.size = (res.size ?? 1) * 1.5;
          res.zIndex = 1;
        } else if (shouldDim) {
          res.color = colourPalette.edgeDimmed;
          res.zIndex = 0;
        }

        return res;
      },
    });
  }, [sigma, setSettings, hoveredNode, selectedNoteId, focusNodeId]);

  // Apply initial layout when component mounts
  useEffect(() => {
    applyForceLayout(sigma);
    sigma.refresh();

    // Fit view after layout
    const camera = sigma.getCamera();
    setTimeout(() => {
      camera.animatedReset({ duration: 300 });
    }, 100);
  }, [sigma]);

  return null;
};

/**
 * Simple force-directed layout
 */
function applyForceLayout(sigma: ReturnType<typeof useSigma>): void {
  const graph = sigma.getGraph();
  const nodes = graph.nodes();

  if (nodes.length === 0) return;

  // Initialize random positions if not already set
  nodes.forEach((node) => {
    const attrs = graph.getNodeAttributes(node);
    if (attrs.x === undefined || attrs.y === undefined) {
      graph.setNodeAttribute(node, 'x', Math.random() * 100 - 50);
      graph.setNodeAttribute(node, 'y', Math.random() * 100 - 50);
    }
  });

  const iterations = 50;
  const repulsionStrength = 100;
  const attractionStrength = 0.01;
  const centerGravity = 0.01;

  for (let i = 0; i < iterations; i++) {
    const forces: Record<string, { x: number; y: number }> = {};

    // Initialize forces
    nodes.forEach((node) => {
      forces[node] = { x: 0, y: 0 };
    });

    // Calculate repulsion between all nodes
    for (let j = 0; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const nodeA = nodes[j];
        const nodeB = nodes[k];
        const posA = graph.getNodeAttributes(nodeA);
        const posB = graph.getNodeAttributes(nodeB);

        const dx = (posB.x ?? 0) - (posA.x ?? 0);
        const dy = (posB.y ?? 0) - (posA.y ?? 0);
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = repulsionStrength / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        forces[nodeA].x -= fx;
        forces[nodeA].y -= fy;
        forces[nodeB].x += fx;
        forces[nodeB].y += fy;
      }
    }

    // Calculate attraction along edges
    graph.forEachEdge((_, __, source, target) => {
      const posA = graph.getNodeAttributes(source);
      const posB = graph.getNodeAttributes(target);

      const dx = (posB.x ?? 0) - (posA.x ?? 0);
      const dy = (posB.y ?? 0) - (posA.y ?? 0);
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      const force = distance * attractionStrength;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      forces[source].x += fx;
      forces[source].y += fy;
      forces[target].x -= fx;
      forces[target].y -= fy;
    });

    // Apply center gravity
    nodes.forEach((node) => {
      const pos = graph.getNodeAttributes(node);
      forces[node].x -= (pos.x ?? 0) * centerGravity;
      forces[node].y -= (pos.y ?? 0) * centerGravity;
    });

    // Apply forces
    nodes.forEach((node) => {
      const pos = graph.getNodeAttributes(node);
      graph.setNodeAttribute(node, 'x', (pos.x ?? 0) + forces[node].x);
      graph.setNodeAttribute(node, 'y', (pos.y ?? 0) + forces[node].y);
    });
  }
}

export default GraphView;
