// src/components/Graph/NodeTooltip.tsx

import React, { useEffect, useState } from 'react';
import { useSigma, useRegisterEvents } from '@react-sigma/core';
import { useNoteStore } from '../../stores/noteStore';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

/**
 * NodeTooltip - Shows a preview of the note when hovering over a node
 */
const NodeTooltip: React.FC = () => {
  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const { getNoteById } = useNoteStore();
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
  });

  useEffect(() => {
    registerEvents({
      enterNode: (event) => {
        const nodeData = sigma.getNodeDisplayData(event.node);
        if (nodeData) {
          // Get mouse position from the sigma container
          const container = sigma.getContainer();
          if (container) {
            const rect = container.getBoundingClientRect();
            setTooltip({
              visible: true,
              x: nodeData.x * sigma.getCamera().ratio + rect.width / 2 + 10,
              y: nodeData.y * sigma.getCamera().ratio + rect.height / 2 - 10,
              nodeId: event.node,
            });
          }
        }
      },
      leaveNode: () => {
        setTooltip((prev) => ({ ...prev, visible: false, nodeId: null }));
      },
    });
  }, [sigma, registerEvents]);

  if (!tooltip.visible || !tooltip.nodeId) {
    return null;
  }

  const note = getNoteById(tooltip.nodeId);
  const graph = sigma.getGraph();
  const nodeAttrs = graph.hasNode(tooltip.nodeId)
    ? graph.getNodeAttributes(tooltip.nodeId)
    : null;

  if (!nodeAttrs) {
    return null;
  }

  // Get connection counts
  const inDegree = graph.hasNode(tooltip.nodeId) ? graph.inDegree(tooltip.nodeId) : 0;
  const outDegree = graph.hasNode(tooltip.nodeId) ? graph.outDegree(tooltip.nodeId) : 0;

  // Get preview text from note content
  let preview = '';
  if (note?.content) {
    // Strip markdown heading and get first ~100 chars
    const contentWithoutHeading = note.content.replace(/^#\s+[^\n]+\n*/, '').trim();
    preview = contentWithoutHeading.slice(0, 100);
    if (contentWithoutHeading.length > 100) {
      preview += '...';
    }
  }

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        transform: 'translate(0, -50%)',
      }}
    >
      <div className="bg-sidebar-bg border border-sidebar-hover rounded-lg shadow-lg p-3 max-w-xs">
        {/* Title */}
        <h3 className="font-medium text-editor-text text-sm mb-1">
          {nodeAttrs.label}
        </h3>

        {/* Tags */}
        {note?.frontmatter.tags && note.frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {note.frontmatter.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-sidebar-hover text-gray-400 rounded"
              >
                #{tag}
              </span>
            ))}
            {note.frontmatter.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{note.frontmatter.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Preview text */}
        {preview && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-3">{preview}</p>
        )}

        {/* Connection stats */}
        <div className="flex gap-3 text-xs text-gray-500 border-t border-sidebar-hover pt-2 mt-2">
          <span title="Outgoing links">{outDegree} outlinks</span>
          <span title="Incoming links">{inDegree} backlinks</span>
        </div>
      </div>
    </div>
  );
};

export default NodeTooltip;
