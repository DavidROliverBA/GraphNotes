// src/components/Layout/VaultSelector.tsx

import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useUIStore } from '../../stores/uiStore';
import { initVault, isVault } from '../../lib/tauri/commands';

const VaultSelector: React.FC = () => {
  const {
    setVaultPath,
    setIsVaultOpen,
    setIsVaultSelectorOpen,
    vaultPath,
  } = useUIStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenVault = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Notes Folder',
      });

      if (selected && typeof selected === 'string') {
        // Check if it's already a vault or initialize it
        const existingVault = await isVault(selected);

        if (!existingVault) {
          // Initialize as a new vault
          await initVault(selected);
        }

        setVaultPath(selected);
        setIsVaultOpen(true);
        setIsVaultSelectorOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVault = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Folder for New Vault',
      });

      if (selected && typeof selected === 'string') {
        // Initialize as a new vault
        await initVault(selected);
        setVaultPath(selected);
        setIsVaultOpen(true);
        setIsVaultSelectorOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vault');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-editor-bg">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-editor-text mb-2">
            🕸️ GraphNotes
          </h1>
          <p className="text-gray-400">
            Graph-based knowledge management for your markdown notes
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleOpenVault}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-accent-primary text-sidebar-bg rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : '📂 Open Existing Vault'}
          </button>

          <button
            onClick={handleCreateVault}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-sidebar-hover text-editor-text rounded-lg font-medium hover:bg-sidebar-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : '✨ Create New Vault'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-accent-error/20 text-accent-error rounded-lg text-sm">
            {error}
          </div>
        )}

        {vaultPath && (
          <button
            onClick={() => {
              setIsVaultOpen(true);
              setIsVaultSelectorOpen(false);
            }}
            className="mt-4 w-full py-2 px-4 text-gray-400 hover:text-editor-text text-sm"
          >
            ← Back to current vault
          </button>
        )}

        <div className="mt-8 text-center text-xs text-gray-600">
          <p>Your notes are stored locally as plain markdown files.</p>
          <p className="mt-1">No account required. No cloud sync.</p>
        </div>
      </div>
    </div>
  );
};

export default VaultSelector;
