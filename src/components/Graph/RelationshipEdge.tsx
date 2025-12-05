import { memo } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { EdgeAppearance } from '../../lib/graph/types';

interface RelationshipEdgeData {
  label: string;
  appearance: EdgeAppearance;
}

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps & { data: RelationshipEdgeData }) {
  const { label, appearance } = data;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Map thickness to stroke width
  const strokeWidth =
    appearance.thickness === 'thin' ? 1 : appearance.thickness === 'thick' ? 4 : 2;

  // Map style to stroke dash array
  const strokeDasharray =
    appearance.style === 'dashed'
      ? '8,4'
      : appearance.style === 'dotted'
      ? '2,2'
      : undefined;

  // Determine marker ends based on direction
  const markerEnd =
    appearance.direction === 'forward' || appearance.direction === 'bidirectional'
      ? `url(#arrow-${id})`
      : undefined;

  const markerStart =
    appearance.direction === 'backward' || appearance.direction === 'bidirectional'
      ? `url(#arrow-start-${id})`
      : undefined;

  return (
    <>
      {/* Define arrow markers */}
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="12"
          markerHeight="12"
          refX="10"
          refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M2,2 L10,6 L2,10 L4,6 Z"
            fill={appearance.colour}
          />
        </marker>
        <marker
          id={`arrow-start-${id}`}
          markerWidth="12"
          markerHeight="12"
          refX="2"
          refY="6"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M10,2 L2,6 L10,10 L8,6 Z"
            fill={appearance.colour}
          />
        </marker>
      </defs>

      {/* The edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: appearance.colour,
          strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
          strokeDasharray,
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />

      {/* Animated flow effect */}
      {appearance.animated && (
        <path
          d={edgePath}
          fill="none"
          stroke={appearance.colour}
          strokeWidth={strokeWidth}
          strokeDasharray="10,10"
          className="animated-edge"
        />
      )}

      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`
              edge-label px-2 py-0.5 text-[10px] font-medium rounded
              transition-all duration-200
              ${
                selected
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-elevated text-text-secondary border border-border-subtle'
              }
            `}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export default RelationshipEdge;
