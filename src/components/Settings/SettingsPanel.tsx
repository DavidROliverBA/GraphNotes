import { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Keyboard,
  Palette,
  Share2,
  Database,
  Monitor,
  Moon,
  Sun,
  Check,
  Hash,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { SyncStatusPanel } from '../Sync/SyncStatusPanel';
import { SuperTagManager } from '../SuperTags/SuperTagManager';

type SettingsTab = 'general' | 'appearance' | 'keyboard' | 'supertags' | 'sync' | 'data';

interface SettingsPanelProps {
  className?: string;
}

export function SettingsPanel({ className = '' }: SettingsPanelProps) {
  const { showSettings, setShowSettings } = useUIStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Handle Escape key to close the modal
  useEffect(() => {
    if (!showSettings) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowSettings(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, setShowSettings]);

  if (!showSettings) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'keyboard', label: 'Keyboard', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'supertags', label: 'Super Tags', icon: <Hash className="w-4 h-4" /> },
    { id: 'sync', label: 'Sync', icon: <Share2 className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}
      onClick={() => setShowSettings(false)}
    >
      <div
        className="w-[800px] h-[600px] max-w-[90vw] max-h-[90vh] bg-bg-primary rounded-xl shadow-2xl flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-48 bg-bg-secondary border-r border-border-subtle flex flex-col">
          <div className="p-4 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          </div>
          <nav className="flex-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full px-3 py-2 flex items-center gap-2 rounded-lg text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <h3 className="text-lg font-medium text-text-primary">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'keyboard' && <KeyboardShortcutsPanel />}
            {activeTab === 'supertags' && <SuperTagManager />}
            {activeTab === 'sync' && <SyncSettings />}
            {activeTab === 'data' && <DataSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const { currentVault } = useSettingsStore();

  return (
    <div className="p-6 space-y-6">
      {/* Vault info */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Current Vault</h4>
        <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
          {currentVault ? (
            <>
              <div className="font-medium text-text-primary">{currentVault.name}</div>
              <div className="text-sm text-text-tertiary mt-1">{currentVault.path}</div>
            </>
          ) : (
            <div className="text-text-tertiary">No vault selected</div>
          )}
        </div>
      </section>

      {/* Editor settings */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Editor</h4>
        <div className="space-y-3">
          <SettingToggle
            label="Auto-save"
            description="Automatically save notes while editing"
            defaultChecked={true}
          />
          <SettingToggle
            label="Spell check"
            description="Enable spell checking in the editor"
            defaultChecked={true}
          />
          <SettingToggle
            label="Show line numbers"
            description="Display line numbers in code blocks"
            defaultChecked={false}
          />
        </div>
      </section>

      {/* Startup */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Startup</h4>
        <div className="space-y-3">
          <SettingToggle
            label="Open last vault on startup"
            description="Automatically open the last used vault"
            defaultChecked={true}
          />
          <SettingToggle
            label="Open daily note on startup"
            description="Automatically open today's daily note"
            defaultChecked={false}
          />
        </div>
      </section>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [accentColor, setAccentColor] = useState('#6366f1');

  const themes = [
    { id: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
    { id: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
  ];

  const accentColors = [
    { color: '#6366f1', label: 'Indigo' },
    { color: '#8b5cf6', label: 'Violet' },
    { color: '#ec4899', label: 'Pink' },
    { color: '#ef4444', label: 'Red' },
    { color: '#f97316', label: 'Orange' },
    { color: '#eab308', label: 'Yellow' },
    { color: '#22c55e', label: 'Green' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#3b82f6', label: 'Blue' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Theme */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Theme</h4>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id as typeof theme);
                if (t.id === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (t.id === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  // System preference
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.toggle('dark', prefersDark);
                }
              }}
              className={`
                p-4 flex flex-col items-center gap-2 rounded-lg border-2 transition-colors
                ${theme === t.id
                  ? 'border-accent-primary bg-accent-primary/5'
                  : 'border-border-default hover:border-border-subtle bg-bg-secondary'
                }
              `}
            >
              {t.icon}
              <span className="text-sm font-medium text-text-primary">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Accent color */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Accent Color</h4>
        <div className="flex flex-wrap gap-2">
          {accentColors.map((c) => (
            <button
              key={c.color}
              onClick={() => setAccentColor(c.color)}
              className="relative w-8 h-8 rounded-full border-2 border-white/20 shadow-sm"
              style={{ backgroundColor: c.color }}
              title={c.label}
            >
              {accentColor === c.color && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Font size */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Font Size</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="12"
            max="20"
            defaultValue="14"
            className="flex-1"
          />
          <span className="text-sm text-text-secondary w-12">14px</span>
        </div>
      </section>

      {/* Sidebar */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Sidebar</h4>
        <div className="space-y-3">
          <SettingToggle
            label="Show file icons"
            description="Display icons next to files in the sidebar"
            defaultChecked={true}
          />
          <SettingToggle
            label="Show note count"
            description="Display the total number of notes"
            defaultChecked={true}
          />
        </div>
      </section>
    </div>
  );
}

function SyncSettings() {
  return (
    <div className="p-6">
      <SyncStatusPanel />
    </div>
  );
}

function DataSettings() {
  const { currentVault } = useSettingsStore();

  return (
    <div className="p-6 space-y-6">
      {/* Export */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Export</h4>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 text-sm text-left bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors">
            Export all notes as Markdown
          </button>
          <button className="w-full px-4 py-2 text-sm text-left bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors">
            Export all notes as HTML
          </button>
          <button className="w-full px-4 py-2 text-sm text-left bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors">
            Export graph data as JSON
          </button>
        </div>
      </section>

      {/* Import */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Import</h4>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 text-sm text-left bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors">
            Import from Obsidian
          </button>
          <button className="w-full px-4 py-2 text-sm text-left bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors">
            Import from Markdown files
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section>
        <h4 className="text-sm font-medium text-text-primary mb-3">Vault Statistics</h4>
        <div className="p-4 bg-bg-secondary rounded-lg border border-border-subtle">
          {currentVault ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-text-tertiary">Total Notes</div>
                <div className="text-xl font-semibold text-text-primary">--</div>
              </div>
              <div>
                <div className="text-text-tertiary">Total Links</div>
                <div className="text-xl font-semibold text-text-primary">--</div>
              </div>
              <div>
                <div className="text-text-tertiary">Super Tags</div>
                <div className="text-xl font-semibold text-text-primary">--</div>
              </div>
              <div>
                <div className="text-text-tertiary">Vault Size</div>
                <div className="text-xl font-semibold text-text-primary">--</div>
              </div>
            </div>
          ) : (
            <div className="text-text-tertiary">No vault selected</div>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h4 className="text-sm font-medium text-accent-error mb-3">Danger Zone</h4>
        <div className="p-4 bg-accent-error/5 border border-accent-error/20 rounded-lg space-y-3">
          <button className="w-full px-4 py-2 text-sm text-left text-accent-error border border-accent-error/30 rounded-lg hover:bg-accent-error/10 transition-colors">
            Clear event log
          </button>
          <button className="w-full px-4 py-2 text-sm text-left text-accent-error border border-accent-error/30 rounded-lg hover:bg-accent-error/10 transition-colors">
            Reset all settings
          </button>
        </div>
      </section>
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

function SettingToggle({
  label,
  description,
  defaultChecked = false,
  onChange,
}: SettingToggleProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = () => {
    const newValue = !checked;
    setChecked(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-tertiary">{description}</div>
      </div>
      <button
        onClick={handleChange}
        className={`
          relative w-11 h-6 rounded-full transition-colors
          ${checked ? 'bg-accent-primary' : 'bg-bg-tertiary'}
        `}
      >
        <span
          className={`
            absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

export default SettingsPanel;
