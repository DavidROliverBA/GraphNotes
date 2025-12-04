// src/components/settings/SettingsPanel.tsx

import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore, ThemePreset, FontSizePreset, GraphLayout } from '../../stores/settingsStore';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';

type SettingsTab = 'appearance' | 'editor' | 'graph' | 'sync' | 'shortcuts';

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'editor', label: 'Editor' },
  { id: 'graph', label: 'Graph' },
  { id: 'sync', label: 'Sync' },
  { id: 'shortcuts', label: 'Shortcuts' },
];

const themeOptions: { value: ThemePreset; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'catppuccin', label: 'Catppuccin' },
  { value: 'nord', label: 'Nord' },
  { value: 'solarized', label: 'Solarized' },
];

const fontSizeOptions: { value: FontSizePreset; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'comfortable', label: 'Comfortable' },
];

const graphLayoutOptions: { value: GraphLayout; label: string }[] = [
  { value: 'force', label: 'Force-directed' },
  { value: 'radial', label: 'Radial' },
  { value: 'hierarchical', label: 'Hierarchical' },
];

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="text-xs text-gray-400">{description}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-accent-primary' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

interface SelectProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function Select({ label, description, value, options, onChange }: SelectProps) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          {description && <div className="text-xs text-gray-400">{description}</div>}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-accent-primary"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface SliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  displayValue?: string;
}

function Slider({ label, description, value, min, max, step = 1, onChange, displayValue }: SliderProps) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          {description && <div className="text-xs text-gray-400">{description}</div>}
        </div>
        <span className="text-sm text-gray-300">{displayValue || value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-primary"
      />
    </div>
  );
}

function AppearanceSettings() {
  const { settings, setSetting } = useSettingsStore();

  return (
    <div className="space-y-4">
      <Select
        label="Theme"
        description="Color scheme for the application"
        value={settings.theme}
        options={themeOptions}
        onChange={(v) => setSetting('theme', v as ThemePreset)}
      />

      <Select
        label="UI Font Size"
        description="Size of text in the interface"
        value={settings.fontSizePreset}
        options={fontSizeOptions}
        onChange={(v) => setSetting('fontSizePreset', v as FontSizePreset)}
      />

      <Slider
        label="Editor Font Size"
        description="Font size in the markdown editor"
        value={settings.editorFontSize}
        min={12}
        max={24}
        onChange={(v) => setSetting('editorFontSize', v)}
        displayValue={`${settings.editorFontSize}px`}
      />

      <Slider
        label="Line Height"
        description="Spacing between lines in the editor"
        value={settings.lineHeight}
        min={1.2}
        max={2.0}
        step={0.1}
        onChange={(v) => setSetting('lineHeight', v)}
        displayValue={settings.lineHeight.toFixed(1)}
      />
    </div>
  );
}

function EditorSettings() {
  const { settings, setSetting } = useSettingsStore();

  return (
    <div className="space-y-4">
      <Toggle
        label="Auto Save"
        description="Automatically save notes while editing"
        checked={settings.autoSave}
        onChange={(v) => setSetting('autoSave', v)}
      />

      {settings.autoSave && (
        <Slider
          label="Auto Save Interval"
          description="How often to auto-save"
          value={settings.autoSaveInterval / 1000}
          min={1}
          max={30}
          onChange={(v) => setSetting('autoSaveInterval', v * 1000)}
          displayValue={`${settings.autoSaveInterval / 1000}s`}
        />
      )}

      <Toggle
        label="Spell Check"
        description="Check spelling while typing"
        checked={settings.spellCheck}
        onChange={(v) => setSetting('spellCheck', v)}
      />

      <Toggle
        label="Line Numbers"
        description="Show line numbers in the editor"
        checked={settings.lineNumbers}
        onChange={(v) => setSetting('lineNumbers', v)}
      />

      <Toggle
        label="Word Wrap"
        description="Wrap long lines in the editor"
        checked={settings.wordWrap}
        onChange={(v) => setSetting('wordWrap', v)}
      />
    </div>
  );
}

function GraphSettings() {
  const { settings, setSetting } = useSettingsStore();

  return (
    <div className="space-y-4">
      <Select
        label="Graph Layout"
        description="How nodes are arranged in the graph"
        value={settings.graphLayout}
        options={graphLayoutOptions}
        onChange={(v) => setSetting('graphLayout', v as GraphLayout)}
      />

      <Slider
        label="Node Size"
        description="Size of nodes in the graph"
        value={settings.graphNodeSize}
        min={4}
        max={20}
        onChange={(v) => setSetting('graphNodeSize', v)}
        displayValue={`${settings.graphNodeSize}px`}
      />

      <Slider
        label="Link Distance"
        description="Distance between connected nodes"
        value={settings.graphLinkDistance}
        min={50}
        max={200}
        onChange={(v) => setSetting('graphLinkDistance', v)}
        displayValue={`${settings.graphLinkDistance}px`}
      />

      <Toggle
        label="Show Labels"
        description="Display note titles on nodes"
        checked={settings.graphShowLabels}
        onChange={(v) => setSetting('graphShowLabels', v)}
      />

      <Toggle
        label="Physics Simulation"
        description="Enable force-directed layout animation"
        checked={settings.graphPhysicsEnabled}
        onChange={(v) => setSetting('graphPhysicsEnabled', v)}
      />
    </div>
  );
}

function SyncSettings() {
  const { settings, setSetting } = useSettingsStore();

  return (
    <div className="space-y-4">
      <Toggle
        label="Enable Sync"
        description="Allow syncing with other devices"
        checked={settings.syncEnabled}
        onChange={(v) => setSetting('syncEnabled', v)}
      />

      {settings.syncEnabled && (
        <Toggle
          label="Auto Connect"
          description="Automatically connect to known peers"
          checked={settings.syncAutoConnect}
          onChange={(v) => setSetting('syncAutoConnect', v)}
        />
      )}

      <div className="py-3">
        <div className="text-sm font-medium text-white">Daily Note Folder</div>
        <div className="text-xs text-gray-400 mb-2">Folder pattern for daily notes</div>
        <input
          type="text"
          value={settings.dailyNoteFolder}
          onChange={(e) => setSetting('dailyNoteFolder', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-accent-primary"
          placeholder="daily/{{year}}"
        />
      </div>

      <div className="py-3">
        <div className="text-sm font-medium text-white">Daily Note Format</div>
        <div className="text-xs text-gray-400 mb-2">Filename pattern for daily notes</div>
        <input
          type="text"
          value={settings.dailyNoteFormat}
          onChange={(e) => setSetting('dailyNoteFormat', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-accent-primary"
          placeholder="{{date}}.md"
        />
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const { isSettingsOpen, setIsSettingsOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const { resetSettings } = useSettingsStore();

  if (!isSettingsOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setIsSettingsOpen(false)}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(80vh-120px)]">
          {/* Sidebar */}
          <nav className="w-48 border-r border-gray-700 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-primary text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'editor' && <EditorSettings />}
            {activeTab === 'graph' && <GraphSettings />}
            {activeTab === 'sync' && <SyncSettings />}
            {activeTab === 'shortcuts' && <KeyboardShortcutsPanel />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
          >
            Reset to Defaults
          </button>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-2 bg-accent-primary text-white rounded text-sm hover:bg-accent-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
