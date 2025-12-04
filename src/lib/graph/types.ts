// src/lib/graph/types.ts

export interface GraphNode {
  id: string;                      // Note ID
  label: string;                   // Note title
  filepath: string;
  icon?: string;                   // Custom icon identifier
  colour?: string;                 // Node colour
  size?: number;                   // Node size (based on connections)
}

export interface EdgeStyle {
  colour: string;
  width: number;
  dashed: boolean;
}

export interface GraphEdge {
  id: string;                      // Unique edge ID
  source: string;                  // Source note ID
  target: string;                  // Target note ID
  name: string;                    // Relationship name
  description?: string;
  style?: EdgeStyle;
}

export interface RelationshipType {
  name: string;                    // e.g., "supports", "contradicts"
  colour: string;
  inverseLabel?: string;           // e.g., "is supported by"
}

export const DEFAULT_RELATIONSHIP_TYPES: RelationshipType[] = [
  { name: 'relates to', colour: '#6c7086', inverseLabel: 'is related to' },
  { name: 'supports', colour: '#a6e3a1', inverseLabel: 'is supported by' },
  { name: 'contradicts', colour: '#f38ba8', inverseLabel: 'is contradicted by' },
  { name: 'extends', colour: '#89b4fa', inverseLabel: 'is extended by' },
  { name: 'references', colour: '#f5c2e7', inverseLabel: 'is referenced by' },
  { name: 'depends on', colour: '#fab387', inverseLabel: 'is dependency of' },
];
