// Graph node representing a note
export interface GraphNode {
  id: string;
  title: string;
  filepath: string;
  created: string;
  modified: string;
  superTags?: string[];
  // Position for graph visualization (optional, managed by layout)
  position?: { x: number; y: number };
  // Computed properties
  incomingLinkCount: number;
  outgoingLinkCount: number;
}

// Graph edge representing a link between notes
export interface GraphEdge {
  id: string;
  source: string; // Source note ID
  target: string; // Target note ID
  name: string; // Relationship name
  description?: string;
  created: string;
  appearance: EdgeAppearance;
}

// Visual styling for edges
export interface EdgeAppearance {
  direction: 'forward' | 'backward' | 'bidirectional' | 'none';
  colour: string;
  style: 'solid' | 'dashed' | 'dotted';
  thickness: 'thin' | 'normal' | 'thick';
  animated?: boolean;
}

// Default edge appearance
export const DEFAULT_EDGE_APPEARANCE: EdgeAppearance = {
  direction: 'forward',
  colour: '#6366f1', // accent-primary
  style: 'solid',
  thickness: 'normal',
  animated: false,
};

// Relationship type preset
export interface RelationshipPreset {
  id: string;
  name: string;
  description?: string;
  appearance: EdgeAppearance;
}

// Built-in relationship presets
export const DEFAULT_RELATIONSHIP_PRESETS: RelationshipPreset[] = [
  {
    id: 'reference',
    name: 'References',
    description: 'Generic reference link',
    appearance: {
      direction: 'forward',
      colour: '#6366f1',
      style: 'solid',
      thickness: 'normal',
    },
  },
  {
    id: 'supports',
    name: 'Supports',
    description: 'This note supports or provides evidence for the target',
    appearance: {
      direction: 'forward',
      colour: '#22c55e',
      style: 'solid',
      thickness: 'normal',
    },
  },
  {
    id: 'contradicts',
    name: 'Contradicts',
    description: 'This note contradicts or challenges the target',
    appearance: {
      direction: 'forward',
      colour: '#ef4444',
      style: 'dashed',
      thickness: 'normal',
    },
  },
  {
    id: 'extends',
    name: 'Extends',
    description: 'This note extends or builds upon the target',
    appearance: {
      direction: 'forward',
      colour: '#3b82f6',
      style: 'solid',
      thickness: 'normal',
    },
  },
  {
    id: 'related',
    name: 'Related To',
    description: 'Bidirectional relationship',
    appearance: {
      direction: 'bidirectional',
      colour: '#a855f7',
      style: 'solid',
      thickness: 'thin',
    },
  },
  {
    id: 'parent',
    name: 'Parent Of',
    description: 'Hierarchical parent relationship',
    appearance: {
      direction: 'forward',
      colour: '#f59e0b',
      style: 'solid',
      thickness: 'thick',
    },
  },
];

// Graph statistics
export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  orphanedNodes: number; // Nodes with no connections
  mostConnectedNodes: Array<{ id: string; title: string; connections: number }>;
}

// Graph filter options
export interface GraphFilter {
  includeTags?: string[];
  excludeTags?: string[];
  includeRelationships?: string[];
  excludeRelationships?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  searchQuery?: string;
  maxDepth?: number; // Depth from selected node
}

// Graph layout options
export type LayoutType = 'force' | 'hierarchical' | 'radial' | 'grid';

export interface LayoutOptions {
  type: LayoutType;
  spacing?: number;
  centerNode?: string; // Node ID to center the layout around
}
