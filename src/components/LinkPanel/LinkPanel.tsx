import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { useGraph } from '../../hooks/useGraph';
import { useUIStore } from '../../stores/uiStore';
import { GraphEdge, GraphNode } from '../../lib/graph/types';

interface LinkPanelProps {
  noteId: string;
}

export function LinkPanel({ noteId }: LinkPanelProps) {
  const { getBacklinks, getOutlinks } = useGraph();
  const { setSelectedNoteId } = useUIStore();
  const [showBacklinks, setShowBacklinks] = useState(true);
  const [showOutlinks, setShowOutlinks] = useState(true);

  const backlinks = getBacklinks(noteId);
  const outlinks = getOutlinks(noteId);

  const handleNavigate = (filepath: string) => {
    setSelectedNoteId(filepath);
  };

  return (
    <div className="h-full flex flex-col bg-bg-secondary border-l border-border-subtle">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Link2 className="w-4 h-4" />
          <span>Links</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Backlinks section */}
        <div className="border-b border-border-subtle">
          <button
            onClick={() => setShowBacklinks(!showBacklinks)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            <div className="flex items-center gap-2">
              {showBacklinks ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <ArrowLeft className="w-4 h-4" />
              <span>Backlinks</span>
            </div>
            <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">
              {backlinks.length}
            </span>
          </button>

          {showBacklinks && (
            <div className="px-2 pb-2">
              {backlinks.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-tertiary">
                  No backlinks
                </div>
              ) : (
                backlinks.map(({ edge, sourceNode }) => (
                  <LinkItem
                    key={edge.id}
                    edge={edge}
                    node={sourceNode}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Outlinks section */}
        <div>
          <button
            onClick={() => setShowOutlinks(!showOutlinks)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            <div className="flex items-center gap-2">
              {showOutlinks ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <ArrowRight className="w-4 h-4" />
              <span>Outlinks</span>
            </div>
            <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded-full">
              {outlinks.length}
            </span>
          </button>

          {showOutlinks && (
            <div className="px-2 pb-2">
              {outlinks.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-tertiary">
                  No outlinks
                </div>
              ) : (
                outlinks.map(({ edge, targetNode }) => (
                  <LinkItem
                    key={edge.id}
                    edge={edge}
                    node={targetNode}
                    onNavigate={handleNavigate}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LinkItemProps {
  edge: GraphEdge;
  node?: GraphNode;
  onNavigate: (filepath: string) => void;
}

function LinkItem({ edge, node, onNavigate }: LinkItemProps) {
  if (!node) return null;

  const getStyleClasses = () => {
    const baseClasses =
      'w-full flex items-start gap-2 px-3 py-2 rounded-md text-left transition-colors hover:bg-bg-tertiary';
    return baseClasses;
  };

  const getEdgeIndicator = () => {
    const { appearance } = edge;
    const style: React.CSSProperties = {
      backgroundColor: appearance.colour,
      width: appearance.thickness === 'thin' ? 2 : appearance.thickness === 'thick' ? 6 : 4,
      height: 16,
      borderRadius: 2,
    };

    if (appearance.style === 'dashed') {
      style.background = `repeating-linear-gradient(
        to bottom,
        ${appearance.colour} 0px,
        ${appearance.colour} 4px,
        transparent 4px,
        transparent 8px
      )`;
    } else if (appearance.style === 'dotted') {
      style.background = `repeating-linear-gradient(
        to bottom,
        ${appearance.colour} 0px,
        ${appearance.colour} 2px,
        transparent 2px,
        transparent 4px
      )`;
    }

    return <div style={style} />;
  };

  return (
    <button
      onClick={() => onNavigate(node.filepath)}
      className={getStyleClasses()}
    >
      {getEdgeIndicator()}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {node.title}
        </div>
        <div className="text-xs text-text-tertiary truncate">
          {edge.name}
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-text-tertiary flex-shrink-0 mt-1" />
    </button>
  );
}

export default LinkPanel;
