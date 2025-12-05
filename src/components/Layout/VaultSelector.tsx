import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  FolderOpen,
  Clock,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { fileExists, createDirectory, createFile } from '../../lib/tauri/commands';

export function VaultSelector() {
  const { recentVaults, setCurrentVault, removeRecentVault } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenVault = async () => {
    setLoading(true);
    setError(null);

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select a vault folder',
      });

      if (selected && typeof selected === 'string') {
        await openVault(selected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open vault');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVault = async () => {
    setLoading(true);
    setError(null);

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select a folder for your new vault',
      });

      if (selected && typeof selected === 'string') {
        // Create .graphnotes directory
        const graphnotesPath = `${selected}/.graphnotes`;
        await createDirectory(graphnotesPath);
        await createDirectory(`${graphnotesPath}/supertags`);

        // Create config.json
        const config = {
          version: '1.0.0',
          created: new Date().toISOString(),
        };
        await createFile(
          `${graphnotesPath}/config.json`,
          JSON.stringify(config, null, 2)
        );

        // Create empty events.jsonl
        await createFile(`${graphnotesPath}/events.jsonl`, '');

        // Create welcome note
        const welcomeContent = `---
id: ${crypto.randomUUID()}
title: Welcome to GraphNotes
created: ${new Date().toISOString()}
modified: ${new Date().toISOString()}
---

# Welcome to GraphNotes

This is your new vault. Start by creating notes and linking them together with [[wikilinks]].

## Quick Tips

- Press \`Cmd+N\` to create a new note
- Type \`[[\` to create a link to another note
- Press \`Cmd+K\` to search your notes
- Press \`Cmd+2\` to view your knowledge graph

Happy note-taking!
`;
        await createFile(`${selected}/Welcome.md`, welcomeContent);

        await openVault(selected);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vault');
    } finally {
      setLoading(false);
    }
  };

  const openVault = async (path: string) => {
    // Check if .graphnotes directory exists
    const graphnotesPath = `${path}/.graphnotes`;
    const hasGraphnotes = await fileExists(graphnotesPath);

    if (!hasGraphnotes) {
      // Initialize as a new vault
      await createDirectory(graphnotesPath);
      await createDirectory(`${graphnotesPath}/supertags`);

      const config = {
        version: '1.0.0',
        created: new Date().toISOString(),
      };
      await createFile(
        `${graphnotesPath}/config.json`,
        JSON.stringify(config, null, 2)
      );
      await createFile(`${graphnotesPath}/events.jsonl`, '');
    }

    // Extract vault name from path
    const name = path.split('/').pop() || 'Vault';

    setCurrentVault({
      path,
      name,
      lastOpened: new Date().toISOString(),
    });
  };

  const handleOpenRecent = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const exists = await fileExists(path);
      if (!exists) {
        setError('Vault folder no longer exists');
        removeRecentVault(path);
        return;
      }

      await openVault(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open vault');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">GraphNotes</h1>
          <p className="text-text-secondary">
            A graph-based note-taking application
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent-danger/10 border border-accent-danger/20 rounded-lg text-sm text-accent-danger">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8">
          <button
            onClick={handleOpenVault}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Vault</span>
          </button>

          <button
            onClick={handleCreateVault}
            disabled={loading}
            className="btn-secondary w-full"
          >
            Create New Vault
          </button>
        </div>

        {recentVaults.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
              <Clock className="w-4 h-4" />
              <span>Recent Vaults</span>
            </div>
            <div className="space-y-1">
              {recentVaults.map((vault) => (
                <div
                  key={vault.path}
                  className="group flex items-center gap-2 p-2 rounded-md hover:bg-bg-secondary cursor-pointer transition-colors duration-fast"
                  onClick={() => handleOpenRecent(vault.path)}
                >
                  <FolderOpen className="w-4 h-4 text-accent-warning flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {vault.name}
                    </div>
                    <div className="text-xs text-text-tertiary truncate">
                      {vault.path}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentVault(vault.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-tertiary rounded transition-all duration-fast"
                    title="Remove from recent"
                  >
                    <Trash2 className="w-3 h-3 text-text-tertiary" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
