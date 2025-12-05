import { useEffect } from 'react';
import { useUIStore, ViewMode } from '../../stores/uiStore';
import { Sidebar } from '../Sidebar/Sidebar';
import {
  PanelLeft,
  PanelLeftClose,
  FileText,
  Network,
  Columns,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const {
    sidebarOpen,
    toggleSidebar,
    theme,
    focusModeActive,
    viewMode,
    setViewMode,
  } = useUIStore();

  const viewModeOptions: { mode: ViewMode; icon: typeof FileText; label: string }[] = [
    { mode: 'editor', icon: FileText, label: 'Editor' },
    { mode: 'graph', icon: Network, label: 'Graph' },
    { mode: 'split', icon: Columns, label: 'Split' },
  ];

  // Handle theme
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + \ to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  if (focusModeActive) {
    return (
      <div className="h-screen w-screen flex flex-col bg-bg-primary">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[700px] h-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* Title Bar */}
      <header className="h-7 flex items-center justify-between px-4 bg-bg-secondary border-b border-border-subtle titlebar-drag">
        <div className="flex items-center gap-2">
          {/* macOS traffic light space */}
          <div className="w-16" />
          <button
            onClick={toggleSidebar}
            className="titlebar-no-drag p-1 rounded hover:bg-bg-tertiary transition-colors duration-fast"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-text-secondary" />
            ) : (
              <PanelLeft className="w-4 h-4 text-text-secondary" />
            )}
          </button>
        </div>
        <div className="flex-1 text-center">
          <span className="text-sm text-text-secondary font-medium">GraphNotes</span>
        </div>
        <div className="flex items-center gap-1 titlebar-no-drag">
          {viewModeOptions.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                p-1.5 rounded transition-colors duration-fast
                ${
                  viewMode === mode
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-tertiary hover:bg-bg-tertiary hover:text-text-secondary'
                }
              `}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            border-r border-border-subtle bg-bg-secondary
            transition-all duration-normal ease-out
            ${sidebarOpen ? 'w-[280px]' : 'w-0'}
            overflow-hidden flex-shrink-0
          `}
        >
          <div className="w-[280px] h-full">
            <Sidebar />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="h-6 flex items-center justify-between px-4 bg-bg-secondary border-t border-border-subtle text-xs text-text-tertiary">
        <div className="flex items-center gap-4">
          <span>Ready</span>
        </div>
        <div className="flex items-center gap-4">
          <span>GraphNotes v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
