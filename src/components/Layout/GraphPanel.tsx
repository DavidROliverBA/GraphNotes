import { GraphView } from '../Graph';

interface GraphPanelProps {
  className?: string;
}

export function GraphPanel({ className = '' }: GraphPanelProps) {
  return (
    <div className={`h-full w-full bg-bg-primary ${className}`}>
      <GraphView />
    </div>
  );
}

export default GraphPanel;
