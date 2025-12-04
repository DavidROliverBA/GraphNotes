// src/components/Graph/NodeStyles.ts

import { DEFAULT_RELATIONSHIP_TYPES } from '../../lib/graph/types';

/**
 * Default node colour (Catppuccin Mocha lavender)
 */
export const DEFAULT_NODE_COLOUR = '#b4befe';

/**
 * Highlighted node colour
 */
export const HIGHLIGHTED_NODE_COLOUR = '#f5c2e7';

/**
 * Selected node colour
 */
export const SELECTED_NODE_COLOUR = '#cba6f7';

/**
 * Default edge colour
 */
export const DEFAULT_EDGE_COLOUR = '#6c7086';

/**
 * Node size range
 */
export const NODE_SIZE_MIN = 5;
export const NODE_SIZE_MAX = 20;

/**
 * Get edge colour by relationship type
 */
export function getEdgeColour(relationshipName: string): string {
  const relType = DEFAULT_RELATIONSHIP_TYPES.find(
    (rt) => rt.name.toLowerCase() === relationshipName.toLowerCase()
  );
  return relType?.colour ?? DEFAULT_EDGE_COLOUR;
}

/**
 * Sigma.js settings for the graph
 */
export const sigmaSettings = {
  // Renderer settings
  renderLabels: true,
  labelDensity: 0.07,
  labelGridCellSize: 60,
  labelFont: 'Inter, system-ui, sans-serif',
  labelSize: 12,
  labelWeight: 'normal',
  labelColor: { color: '#cdd6f4' },

  // Node settings
  defaultNodeColor: DEFAULT_NODE_COLOUR,
  defaultNodeType: 'circle',
  nodeReducer: undefined, // Will be set dynamically

  // Edge settings
  defaultEdgeColor: DEFAULT_EDGE_COLOUR,
  defaultEdgeType: 'line',
  edgeReducer: undefined, // Will be set dynamically

  // Interaction settings
  zoomToSizeRatioFunction: (ratio: number) => ratio,
  minCameraRatio: 0.1,
  maxCameraRatio: 10,

  // Performance
  hideEdgesOnMove: false,
  hideLabelsOnMove: false,
};

/**
 * Force atlas 2 layout settings
 */
export const forceAtlas2Settings = {
  iterations: 100,
  settings: {
    gravity: 1,
    scalingRatio: 2,
    strongGravityMode: false,
    slowDown: 1,
    barnesHutOptimize: true,
    barnesHutTheta: 0.5,
    outboundAttractionDistribution: false,
    linLogMode: false,
    adjustSizes: false,
  },
};

/**
 * Colour palette for node highlighting
 */
export const colourPalette = {
  // Node states
  normal: DEFAULT_NODE_COLOUR,
  hovered: HIGHLIGHTED_NODE_COLOUR,
  selected: SELECTED_NODE_COLOUR,
  neighbor: '#89b4fa',
  dimmed: '#45475a',

  // Edge states
  edgeNormal: DEFAULT_EDGE_COLOUR,
  edgeHighlighted: '#cdd6f4',
  edgeDimmed: '#313244',
};
