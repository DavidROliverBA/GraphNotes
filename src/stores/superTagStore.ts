import { create } from 'zustand';
import { SuperTag, SuperTagAttribute } from '../lib/superTags/types';
import { isTauriEnvironment } from '../lib/tauri/environment';

// Dynamically import Tauri APIs only when in Tauri environment
const getTauriApis = async () => {
  if (!isTauriEnvironment()) {
    return null;
  }
  const [fs, path] = await Promise.all([
    import('@tauri-apps/plugin-fs'),
    import('@tauri-apps/api/path'),
  ]);
  return { fs, path };
};

interface SuperTagState {
  // State
  superTags: Map<string, SuperTag>;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSuperTags: (vaultPath: string) => Promise<void>;
  getSuperTag: (id: string) => SuperTag | undefined;
  createSuperTag: (tag: SuperTag) => Promise<void>;
  updateSuperTag: (id: string, updates: Partial<SuperTag>) => Promise<void>;
  deleteSuperTag: (id: string) => Promise<void>;
  addAttribute: (tagId: string, attribute: SuperTagAttribute) => Promise<void>;
  updateAttribute: (tagId: string, attributeId: string, updates: Partial<SuperTagAttribute>) => Promise<void>;
  removeAttribute: (tagId: string, attributeId: string) => Promise<void>;
}

let currentVaultPath: string | null = null;

export const useSuperTagStore = create<SuperTagState>((set, get) => ({
  superTags: new Map(),
  isLoading: false,
  error: null,

  loadSuperTags: async (vaultPath: string) => {
    set({ isLoading: true, error: null });
    currentVaultPath = vaultPath;

    // In browser mode, just use empty super tags
    const tauri = await getTauriApis();
    if (!tauri) {
      console.log('Running in browser mode - using empty super tags');
      set({ superTags: new Map(), isLoading: false });
      return;
    }

    try {
      const superTagsPath = await tauri.path.join(vaultPath, '.graphnotes', 'supertags');

      // Ensure directory exists
      try {
        await tauri.fs.mkdir(superTagsPath, { recursive: true });
      } catch {
        // Directory might already exist
      }

      // Read all super tag files
      const entries = await tauri.fs.readDir(superTagsPath);
      const superTags = new Map<string, SuperTag>();

      for (const entry of entries) {
        if (entry.name?.endsWith('.json')) {
          try {
            const filePath = await tauri.path.join(superTagsPath, entry.name);
            const content = await tauri.fs.readTextFile(filePath);
            const tag = JSON.parse(content) as SuperTag;
            superTags.set(tag.id, tag);
          } catch (err) {
            console.error(`Failed to load super tag ${entry.name}:`, err);
          }
        }
      }

      set({ superTags, isLoading: false });
    } catch (err) {
      console.error('Failed to load super tags:', err);
      set({ error: 'Failed to load super tags', isLoading: false });
    }
  },

  getSuperTag: (id: string) => {
    return get().superTags.get(id);
  },

  createSuperTag: async (tag: SuperTag) => {
    if (!currentVaultPath) {
      throw new Error('No vault path set');
    }

    const tauri = await getTauriApis();
    if (!tauri) {
      // Browser mode - just update state
      set((state) => {
        const newTags = new Map(state.superTags);
        newTags.set(tag.id, tag);
        return { superTags: newTags };
      });
      return;
    }

    try {
      const filePath = await tauri.path.join(currentVaultPath, '.graphnotes', 'supertags', `${tag.id}.json`);
      await tauri.fs.writeTextFile(filePath, JSON.stringify(tag, null, 2));

      set((state) => {
        const newTags = new Map(state.superTags);
        newTags.set(tag.id, tag);
        return { superTags: newTags };
      });
    } catch (err) {
      console.error('Failed to create super tag:', err);
      throw err;
    }
  },

  updateSuperTag: async (id: string, updates: Partial<SuperTag>) => {
    if (!currentVaultPath) {
      throw new Error('No vault path set');
    }

    const existing = get().superTags.get(id);
    if (!existing) {
      throw new Error(`Super tag ${id} not found`);
    }

    const updated: SuperTag = {
      ...existing,
      ...updates,
      modified: new Date().toISOString(),
    };

    const tauri = await getTauriApis();
    if (!tauri) {
      // Browser mode - just update state
      set((state) => {
        const newTags = new Map(state.superTags);
        newTags.set(id, updated);
        return { superTags: newTags };
      });
      return;
    }

    try {
      const filePath = await tauri.path.join(currentVaultPath, '.graphnotes', 'supertags', `${id}.json`);
      await tauri.fs.writeTextFile(filePath, JSON.stringify(updated, null, 2));

      set((state) => {
        const newTags = new Map(state.superTags);
        newTags.set(id, updated);
        return { superTags: newTags };
      });
    } catch (err) {
      console.error('Failed to update super tag:', err);
      throw err;
    }
  },

  deleteSuperTag: async (id: string) => {
    if (!currentVaultPath) {
      throw new Error('No vault path set');
    }

    const tauri = await getTauriApis();
    if (!tauri) {
      // Browser mode - just update state
      set((state) => {
        const newTags = new Map(state.superTags);
        newTags.delete(id);
        return { superTags: newTags };
      });
      return;
    }

    try {
      const filePath = await tauri.path.join(currentVaultPath, '.graphnotes', 'supertags', `${id}.json`);
      await tauri.fs.remove(filePath);

      set((state) => {
        const newTags = new Map(state.superTags);
        newTags.delete(id);
        return { superTags: newTags };
      });
    } catch (err) {
      console.error('Failed to delete super tag:', err);
      throw err;
    }
  },

  addAttribute: async (tagId: string, attribute: SuperTagAttribute) => {
    const tag = get().superTags.get(tagId);
    if (!tag) {
      throw new Error(`Super tag ${tagId} not found`);
    }

    await get().updateSuperTag(tagId, {
      attributes: [...tag.attributes, attribute],
    });
  },

  updateAttribute: async (tagId: string, attributeId: string, updates: Partial<SuperTagAttribute>) => {
    const tag = get().superTags.get(tagId);
    if (!tag) {
      throw new Error(`Super tag ${tagId} not found`);
    }

    const attributes = tag.attributes.map((attr) =>
      attr.id === attributeId ? { ...attr, ...updates } : attr
    );

    await get().updateSuperTag(tagId, { attributes });
  },

  removeAttribute: async (tagId: string, attributeId: string) => {
    const tag = get().superTags.get(tagId);
    if (!tag) {
      throw new Error(`Super tag ${tagId} not found`);
    }

    const attributes = tag.attributes.filter((attr) => attr.id !== attributeId);
    await get().updateSuperTag(tagId, { attributes });
  },
}));

// Helper to get all super tags as array
export function useSuperTagList(): SuperTag[] {
  const superTags = useSuperTagStore((state) => state.superTags);
  return Array.from(superTags.values());
}
