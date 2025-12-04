// src/hooks/useVaultLoader.ts

import { useEffect, useRef, useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useNoteStore } from '../stores/noteStore';
import { useNotes } from './useNotes';
import { useGraph } from './useGraph';

/**
 * Hook that manages vault loading and graph building when a vault is opened.
 * Should be used once at the app level.
 */
export function useVaultLoader() {
  const { vaultPath, isVaultOpen } = useUIStore();
  const { notes, isLoading } = useNoteStore();
  const { loadVault } = useNotes();
  const { buildGraph, resetGraph } = useGraph();

  // Track if we've loaded for the current vault
  const loadedVaultRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * Load the vault and build the graph
   */
  const loadVaultAndBuildGraph = useCallback(async () => {
    if (!vaultPath || !isVaultOpen) return;

    // Skip if we've already loaded this vault
    if (loadedVaultRef.current === vaultPath && !isInitialLoadRef.current) {
      return;
    }

    console.log('[VaultLoader] Loading vault:', vaultPath);
    loadedVaultRef.current = vaultPath;
    isInitialLoadRef.current = false;

    // Load all notes from the vault
    await loadVault();
  }, [vaultPath, isVaultOpen, loadVault]);

  // Effect to load vault when it changes
  useEffect(() => {
    if (isVaultOpen && vaultPath) {
      loadVaultAndBuildGraph();
    }
  }, [isVaultOpen, vaultPath, loadVaultAndBuildGraph]);

  // Effect to build graph after notes are loaded
  useEffect(() => {
    if (!isLoading && notes.size > 0 && isVaultOpen) {
      console.log('[VaultLoader] Building graph with', notes.size, 'notes');
      const result = buildGraph();
      console.log(
        '[VaultLoader] Graph built:',
        result.resolved.length,
        'resolved links,',
        result.unresolved.length,
        'unresolved links'
      );
    }
  }, [notes, isLoading, isVaultOpen, buildGraph]);

  // Effect to reset graph when vault is closed
  useEffect(() => {
    if (!isVaultOpen) {
      resetGraph();
      loadedVaultRef.current = null;
    }
  }, [isVaultOpen, resetGraph]);

  return {
    isLoading,
    notesCount: notes.size,
    reload: loadVaultAndBuildGraph,
  };
}

export default useVaultLoader;
