import { useCallback, useMemo } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useNoteStore } from '../stores/noteStore';
import { useUIStore } from '../stores/uiStore';
import { formatDate, getTemplateById, generateNoteFromTemplate } from '../lib/templates/noteTemplates';

export interface DailyNoteConfig {
  folder: string;
  template: string;
  dateFormat: string;
}

const DEFAULT_CONFIG: DailyNoteConfig = {
  folder: 'daily',
  template: 'daily',
  dateFormat: 'YYYY-MM-DD',
};

export function useDailyNote(config: Partial<DailyNoteConfig> = {}) {
  const { currentVault } = useSettingsStore();
  const { notes, createNote } = useNoteStore();
  const { setSelectedNoteId } = useUIStore();

  const fullConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // Get the filename for a given date
  const getDailyNoteFilename = useCallback(
    (date: Date = new Date()): string => {
      const dateStr = formatDate(date, fullConfig.dateFormat);
      return `${fullConfig.folder}/${dateStr}.md`;
    },
    [fullConfig.dateFormat, fullConfig.folder]
  );

  // Check if a daily note exists for a given date
  const hasDailyNote = useCallback(
    (date: Date = new Date()): boolean => {
      const filename = getDailyNoteFilename(date);
      // Check if note exists in our notes map by filepath
      for (const note of notes.values()) {
        if (note.filepath.endsWith(filename) || note.filepath.endsWith(`/${filename}`)) {
          return true;
        }
      }
      return false;
    },
    [getDailyNoteFilename, notes]
  );

  // Get daily note for a given date
  const getDailyNote = useCallback(
    (date: Date = new Date()) => {
      const filename = getDailyNoteFilename(date);
      for (const note of notes.values()) {
        if (note.filepath.endsWith(filename) || note.filepath.endsWith(`/${filename}`)) {
          return note;
        }
      }
      return null;
    },
    [getDailyNoteFilename, notes]
  );

  // Open or create daily note for a given date
  const openDailyNote = useCallback(
    async (date: Date = new Date()) => {
      if (!currentVault) {
        console.warn('[useDailyNote] No vault selected');
        return null;
      }

      // Check if note already exists
      const existingNote = getDailyNote(date);
      if (existingNote) {
        setSelectedNoteId(existingNote.id);
        return existingNote;
      }

      // Create new daily note from template
      const template = getTemplateById(fullConfig.template);
      if (!template) {
        console.error(`[useDailyNote] Template not found: ${fullConfig.template}`);
        return null;
      }

      const { filename, title, content } = generateNoteFromTemplate(template, { date });
      const filepath = `${fullConfig.folder}/${filename}`;

      try {
        // Create the note
        const newNote = await createNote(currentVault.path, filepath, title);

        // Update content if template has content
        if (content) {
          // The createNote function should handle setting initial content
          // In a more complete implementation, we'd update the content here
        }

        setSelectedNoteId(newNote.id);
        return newNote;
      } catch (err) {
        console.error('[useDailyNote] Failed to create daily note:', err);
        return null;
      }
    },
    [currentVault, getDailyNote, fullConfig.template, fullConfig.folder, createNote, setSelectedNoteId]
  );

  // Open today's daily note
  const openToday = useCallback(() => {
    return openDailyNote(new Date());
  }, [openDailyNote]);

  // Open yesterday's daily note
  const openYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return openDailyNote(yesterday);
  }, [openDailyNote]);

  // Open tomorrow's daily note
  const openTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return openDailyNote(tomorrow);
  }, [openDailyNote]);

  // Navigate between daily notes
  const navigateDailyNote = useCallback(
    (direction: 'prev' | 'next', currentDate: Date = new Date()) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      return openDailyNote(newDate);
    },
    [openDailyNote]
  );

  // Get recent daily notes
  const getRecentDailyNotes = useCallback(
    (count: number = 7) => {
      const dailyNotes = [];
      const today = new Date();

      for (let i = 0; i < count; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const note = getDailyNote(date);
        if (note) {
          dailyNotes.push({ date, note });
        }
      }

      return dailyNotes;
    },
    [getDailyNote]
  );

  // Check if today's daily note exists
  const hasTodayNote = useMemo(() => hasDailyNote(new Date()), [hasDailyNote]);

  // Get today's note if it exists
  const todayNote = useMemo(() => getDailyNote(new Date()), [getDailyNote]);

  return {
    // State
    hasTodayNote,
    todayNote,

    // Actions
    openDailyNote,
    openToday,
    openYesterday,
    openTomorrow,
    navigateDailyNote,

    // Utilities
    getDailyNoteFilename,
    hasDailyNote,
    getDailyNote,
    getRecentDailyNotes,
  };
}
