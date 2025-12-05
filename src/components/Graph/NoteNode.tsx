import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText, Tag, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface NoteNodeData {
  label: string;
  filepath: string;
  superTags?: string[];
  incomingCount: number;
  outgoingCount: number;
  isSelected: boolean;
}

export const NoteNode = memo(function NoteNode({
  data,
  selected,
}: NodeProps & { data: NoteNodeData }) {
  const { label, superTags, incomingCount, outgoingCount, isSelected } = data;

  const hasConnections = incomingCount > 0 || outgoingCount > 0;

  return (
    <div
      className={`
        note-node px-3 py-2 rounded-lg border-2 min-w-[140px] max-w-[200px]
        transition-all duration-200 cursor-pointer
        ${
          isSelected || selected
            ? 'border-accent-primary bg-accent-primary/10 shadow-lg scale-105'
            : 'border-border-default bg-bg-elevated hover:border-accent-primary/50 hover:shadow-md'
        }
      `}
    >
      {/* Input handle (for incoming edges) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-accent-primary !border-0"
      />

      {/* Node content */}
      <div className="flex items-start gap-2">
        <FileText
          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            isSelected || selected ? 'text-accent-primary' : 'text-text-tertiary'
          }`}
        />
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium truncate ${
              isSelected || selected ? 'text-accent-primary' : 'text-text-primary'
            }`}
            title={label}
          >
            {label}
          </div>

          {/* Super tags */}
          {superTags && superTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {superTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-bg-tertiary text-text-secondary rounded"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
              {superTags.length > 2 && (
                <span className="text-[10px] text-text-tertiary">
                  +{superTags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Connection counts */}
          {hasConnections && (
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-tertiary">
              {incomingCount > 0 && (
                <span className="flex items-center gap-0.5" title="Incoming links">
                  <ArrowDownLeft className="w-3 h-3" />
                  {incomingCount}
                </span>
              )}
              {outgoingCount > 0 && (
                <span className="flex items-center gap-0.5" title="Outgoing links">
                  <ArrowUpRight className="w-3 h-3" />
                  {outgoingCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output handle (for outgoing edges) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-accent-primary !border-0"
      />
    </div>
  );
});

export default NoteNode;
