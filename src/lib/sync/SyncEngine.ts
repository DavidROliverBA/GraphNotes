// src/lib/sync/SyncEngine.ts

import { v4 as uuidv4 } from 'uuid';
import { Note } from '../notes/types';
import { parseNote, serializeNote } from '../notes/noteParser';
import { readFile, writeFile, deleteFile, pathExists } from '../tauri/commands';
import {
  SyncEvent,
  NoteCreatedEvent,
  NoteUpdatedEvent,
  NoteDeletedEvent,
  NoteRenamedEvent,
  LinkCreatedEvent,
  LinkUpdatedEvent,
  LinkDeletedEvent,
} from './events';

/**
 * Conflict information for manual resolution
 */
export interface ConflictInfo {
  noteId: string;
  localVersion: string;
  remoteVersion: string;
  conflictFilepath: string;
  timestamp: string;
}

/**
 * Result of applying events
 */
export interface ApplyResult {
  applied: number;
  skipped: number;
  conflicts: ConflictInfo[];
  errors: string[];
}

/**
 * SyncEngine - Handles event replay and conflict detection
 *
 * Responsible for:
 * - Applying events to reconstruct state
 * - Detecting and handling conflicts
 * - Verifying consistency with file system
 */
export class SyncEngine {
  private vaultPath: string;
  private notes: Map<string, Note>;

  constructor(vaultPath: string, notes: Map<string, Note>) {
    this.vaultPath = vaultPath;
    this.notes = notes;
  }

  /**
   * Apply a list of events to the current state
   */
  async applyEvents(events: SyncEvent[]): Promise<ApplyResult> {
    const result: ApplyResult = {
      applied: 0,
      skipped: 0,
      conflicts: [],
      errors: [],
    };

    // Sort events by timestamp to apply in order
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const event of sortedEvents) {
      try {
        const applied = await this.applyEvent(event, result);
        if (applied) {
          result.applied++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`Failed to apply event ${event.id}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Apply a single event
   */
  private async applyEvent(event: SyncEvent, result: ApplyResult): Promise<boolean> {
    switch (event.type) {
      case 'NOTE_CREATED':
        return this.applyNoteCreated(event, result);
      case 'NOTE_UPDATED':
        return this.applyNoteUpdated(event, result);
      case 'NOTE_DELETED':
        return this.applyNoteDeleted(event);
      case 'NOTE_RENAMED':
        return this.applyNoteRenamed(event);
      case 'LINK_CREATED':
        return this.applyLinkCreated(event);
      case 'LINK_UPDATED':
        return this.applyLinkUpdated(event);
      case 'LINK_DELETED':
        return this.applyLinkDeleted(event);
      default:
        console.warn('[SyncEngine] Unknown event type:', (event as SyncEvent).type);
        return false;
    }
  }

  /**
   * Apply NOTE_CREATED event
   */
  private async applyNoteCreated(event: NoteCreatedEvent, result: ApplyResult): Promise<boolean> {
    const { noteId, filepath, content } = event.payload;
    const fullPath = `${this.vaultPath}/${filepath}`;

    // Check if note already exists
    if (this.notes.has(noteId)) {
      // Note exists - check for conflict
      const existingNote = this.notes.get(noteId)!;
      if (existingNote.rawContent !== content) {
        // Content differs - create conflict file
        const conflict = await this.createConflictFile(noteId, existingNote.rawContent, content, event);
        result.conflicts.push(conflict);
      }
      return false; // Skip, already exists
    }

    // Check if file exists on disk
    if (await pathExists(fullPath)) {
      // File exists but not in our notes map - load it first
      const fileContent = await readFile(fullPath);
      if (fileContent.exists && fileContent.content !== content) {
        // Different content - create conflict file
        const conflict = await this.createConflictFile(noteId, fileContent.content, content, event);
        result.conflicts.push(conflict);
        return false;
      }
    }

    // Create the note
    await writeFile(fullPath, content);

    // Parse and add to notes map
    const note = parseNote(content, filepath);
    // Ensure the note has the correct ID from the event
    note.id = noteId;
    this.notes.set(noteId, note);

    console.log('[SyncEngine] Applied NOTE_CREATED:', noteId);
    return true;
  }

  /**
   * Apply NOTE_UPDATED event
   */
  private async applyNoteUpdated(event: NoteUpdatedEvent, result: ApplyResult): Promise<boolean> {
    const { noteId, previousHash, newContent } = event.payload;

    const existingNote = this.notes.get(noteId);
    if (!existingNote) {
      console.warn('[SyncEngine] NOTE_UPDATED for unknown note:', noteId);
      return false;
    }

    const fullPath = `${this.vaultPath}/${existingNote.filepath}`;

    // Check for conflict using hash
    const currentHash = this.simpleHash(existingNote.rawContent);
    if (previousHash && currentHash !== previousHash) {
      // Local changes detected - conflict
      const conflict = await this.createConflictFile(noteId, existingNote.rawContent, newContent, event);
      result.conflicts.push(conflict);
      return false;
    }

    // Apply the update
    await writeFile(fullPath, newContent);

    // Update notes map
    const updatedNote = parseNote(newContent, existingNote.filepath);
    updatedNote.id = noteId;
    this.notes.set(noteId, updatedNote);

    console.log('[SyncEngine] Applied NOTE_UPDATED:', noteId);
    return true;
  }

  /**
   * Apply NOTE_DELETED event
   */
  private async applyNoteDeleted(event: NoteDeletedEvent): Promise<boolean> {
    const { noteId, filepath } = event.payload;
    const fullPath = `${this.vaultPath}/${filepath}`;

    // Remove from notes map
    this.notes.delete(noteId);

    // Delete file if it exists
    if (await pathExists(fullPath)) {
      await deleteFile(fullPath);
    }

    console.log('[SyncEngine] Applied NOTE_DELETED:', noteId);
    return true;
  }

  /**
   * Apply NOTE_RENAMED event
   */
  private async applyNoteRenamed(event: NoteRenamedEvent): Promise<boolean> {
    const { noteId, oldFilepath, newFilepath } = event.payload;

    const existingNote = this.notes.get(noteId);
    if (!existingNote) {
      console.warn('[SyncEngine] NOTE_RENAMED for unknown note:', noteId);
      return false;
    }

    const oldFullPath = `${this.vaultPath}/${oldFilepath}`;
    const newFullPath = `${this.vaultPath}/${newFilepath}`;

    // Read content from old location
    let content = existingNote.rawContent;
    if (await pathExists(oldFullPath)) {
      const fileContent = await readFile(oldFullPath);
      if (fileContent.exists) {
        content = fileContent.content;
      }
      await deleteFile(oldFullPath);
    }

    // Write to new location
    await writeFile(newFullPath, content);

    // Update notes map
    const updatedNote: Note = {
      ...existingNote,
      filepath: newFilepath,
    };
    this.notes.set(noteId, updatedNote);

    console.log('[SyncEngine] Applied NOTE_RENAMED:', noteId, oldFilepath, '->', newFilepath);
    return true;
  }

  /**
   * Apply LINK_CREATED event
   * Note: Links are stored in note frontmatter, so we update the source note
   */
  private async applyLinkCreated(event: LinkCreatedEvent): Promise<boolean> {
    const { sourceId, targetId, name, description } = event.payload;

    const sourceNote = this.notes.get(sourceId);
    if (!sourceNote) {
      console.warn('[SyncEngine] LINK_CREATED for unknown source note:', sourceId);
      return false;
    }

    // Check if link already exists
    const existingLinks = sourceNote.frontmatter.links || [];
    const linkExists = existingLinks.some(
      (link) => link.target === targetId && link.name === name
    );

    if (linkExists) {
      return false; // Already exists
    }

    // Add link to frontmatter
    const newLink = {
      target: targetId,
      name,
      description,
      created: event.timestamp,
    };

    const updatedNote: Note = {
      ...sourceNote,
      frontmatter: {
        ...sourceNote.frontmatter,
        links: [...existingLinks, newLink],
        modified: new Date().toISOString(),
      },
    };

    // Serialize and save
    const content = serializeNote(updatedNote);
    const fullPath = `${this.vaultPath}/${sourceNote.filepath}`;
    await writeFile(fullPath, content);

    // Update notes map
    updatedNote.rawContent = content;
    this.notes.set(sourceId, updatedNote);

    console.log('[SyncEngine] Applied LINK_CREATED:', sourceId, '->', targetId);
    return true;
  }

  /**
   * Apply LINK_UPDATED event
   */
  private async applyLinkUpdated(event: LinkUpdatedEvent): Promise<boolean> {
    const { sourceId, targetId, name, description } = event.payload;

    const sourceNote = this.notes.get(sourceId);
    if (!sourceNote) {
      console.warn('[SyncEngine] LINK_UPDATED for unknown source note:', sourceId);
      return false;
    }

    const existingLinks = sourceNote.frontmatter.links || [];
    const linkIndex = existingLinks.findIndex(
      (link) => link.target === targetId
    );

    if (linkIndex === -1) {
      // Link doesn't exist, create it
      return this.applyLinkCreated({
        ...event,
        type: 'LINK_CREATED',
      } as LinkCreatedEvent);
    }

    // Update the link
    const updatedLinks = [...existingLinks];
    updatedLinks[linkIndex] = {
      ...updatedLinks[linkIndex],
      name,
      description,
    };

    const updatedNote: Note = {
      ...sourceNote,
      frontmatter: {
        ...sourceNote.frontmatter,
        links: updatedLinks,
        modified: new Date().toISOString(),
      },
    };

    // Serialize and save
    const content = serializeNote(updatedNote);
    const fullPath = `${this.vaultPath}/${sourceNote.filepath}`;
    await writeFile(fullPath, content);

    // Update notes map
    updatedNote.rawContent = content;
    this.notes.set(sourceId, updatedNote);

    console.log('[SyncEngine] Applied LINK_UPDATED:', sourceId, '->', targetId);
    return true;
  }

  /**
   * Apply LINK_DELETED event
   */
  private async applyLinkDeleted(event: LinkDeletedEvent): Promise<boolean> {
    const { sourceId, targetId } = event.payload;

    const sourceNote = this.notes.get(sourceId);
    if (!sourceNote) {
      console.warn('[SyncEngine] LINK_DELETED for unknown source note:', sourceId);
      return false;
    }

    const existingLinks = sourceNote.frontmatter.links || [];
    const updatedLinks = existingLinks.filter(
      (link) => link.target !== targetId
    );

    if (updatedLinks.length === existingLinks.length) {
      return false; // Link didn't exist
    }

    const updatedNote: Note = {
      ...sourceNote,
      frontmatter: {
        ...sourceNote.frontmatter,
        links: updatedLinks,
        modified: new Date().toISOString(),
      },
    };

    // Serialize and save
    const content = serializeNote(updatedNote);
    const fullPath = `${this.vaultPath}/${sourceNote.filepath}`;
    await writeFile(fullPath, content);

    // Update notes map
    updatedNote.rawContent = content;
    this.notes.set(sourceId, updatedNote);

    console.log('[SyncEngine] Applied LINK_DELETED:', sourceId, '->', targetId);
    return true;
  }

  /**
   * Create a conflict file for manual resolution
   */
  private async createConflictFile(
    noteId: string,
    localContent: string,
    remoteContent: string,
    event: SyncEvent
  ): Promise<ConflictInfo> {
    const conflictId = uuidv4().slice(0, 8);
    const conflictFilepath = `conflicts/${noteId}-${event.deviceId}-${conflictId}.md`;
    const fullPath = `${this.vaultPath}/${conflictFilepath}`;

    // Ensure conflicts directory exists
    const conflictsDir = `${this.vaultPath}/conflicts`;
    if (!(await pathExists(conflictsDir))) {
      // Create directory by writing a placeholder file
      await writeFile(`${conflictsDir}/.gitkeep`, '');
    }

    // Write remote version as conflict file
    await writeFile(fullPath, remoteContent);

    console.log('[SyncEngine] Created conflict file:', conflictFilepath);

    return {
      noteId,
      localVersion: localContent,
      remoteVersion: remoteContent,
      conflictFilepath,
      timestamp: event.timestamp,
    };
  }

  /**
   * Verify state consistency between notes map and file system
   */
  async verifyConsistency(): Promise<{ consistent: boolean; issues: string[] }> {
    const issues: string[] = [];

    for (const [noteId, note] of this.notes) {
      const fullPath = `${this.vaultPath}/${note.filepath}`;

      if (!(await pathExists(fullPath))) {
        issues.push(`Note ${noteId} exists in state but file missing: ${note.filepath}`);
        continue;
      }

      const fileContent = await readFile(fullPath);
      if (!fileContent.exists) {
        issues.push(`Note ${noteId} file read failed: ${note.filepath}`);
        continue;
      }

      if (fileContent.content !== note.rawContent) {
        issues.push(`Note ${noteId} content mismatch: ${note.filepath}`);
      }
    }

    return {
      consistent: issues.length === 0,
      issues,
    };
  }

  /**
   * Simple hash function for content comparison
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Get the notes map (for external access)
   */
  getNotes(): Map<string, Note> {
    return this.notes;
  }
}

export default SyncEngine;
