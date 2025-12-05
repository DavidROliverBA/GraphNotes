import {
  SyncEvent,
  NoteCreatedEvent,
  NoteUpdatedEvent,
  NoteDeletedEvent,
  NoteRenamedEvent,
  LinkCreatedEvent,
  LinkUpdatedEvent,
  LinkDeletedEvent,
  SuperTagCreatedEvent,
  SuperTagUpdatedEvent,
  SuperTagDeletedEvent,
  SuperTagAssignedEvent,
  SuperTagUnassignedEvent,
  AttributeUpdatedEvent,
  sortEventsCausally,
} from './events';
import { Note, LinkDefinition } from '../notes/types';
import { SuperTag } from '../superTags/types';

// Conflict resolution result
export interface ConflictResult {
  eventId: string;
  conflictType: 'note_update' | 'note_delete' | 'attribute_update';
  resolution: 'local_wins' | 'remote_wins' | 'conflict_copy';
  details: string;
}

// Sync status
export interface SyncStatus {
  issyncing: boolean;
  lastSyncTime: string | null;
  pendingEvents: number;
  conflicts: ConflictResult[];
}

export class SyncEngine {
  private conflicts: ConflictResult[] = [];

  constructor(_eventLog: unknown) {
    // EventLog reference kept for future peer sync features
  }

  /**
   * Apply a list of events to reconstruct state
   */
  applyEvents(
    events: SyncEvent[],
    currentNotes: Map<string, Note>,
    currentSuperTags: Map<string, SuperTag>
  ): {
    notes: Map<string, Note>;
    superTags: Map<string, SuperTag>;
    conflicts: ConflictResult[];
  } {
    const notes = new Map(currentNotes);
    const superTags = new Map(currentSuperTags);
    const conflicts: ConflictResult[] = [];

    // Sort events causally before applying
    const sortedEvents = sortEventsCausally(events);

    for (const event of sortedEvents) {
      try {
        this.applyEvent(event, notes, superTags, conflicts);
      } catch (err) {
        console.error(`Failed to apply event ${event.id}:`, err);
      }
    }

    return { notes, superTags, conflicts };
  }

  /**
   * Apply a single event
   */
  private applyEvent(
    event: SyncEvent,
    notes: Map<string, Note>,
    superTags: Map<string, SuperTag>,
    conflicts: ConflictResult[]
  ): void {
    switch (event.type) {
      case 'NOTE_CREATED':
        this.applyNoteCreated(event as NoteCreatedEvent, notes);
        break;
      case 'NOTE_UPDATED':
        this.applyNoteUpdated(event as NoteUpdatedEvent, notes, conflicts);
        break;
      case 'NOTE_DELETED':
        this.applyNoteDeleted(event as NoteDeletedEvent, notes);
        break;
      case 'NOTE_RENAMED':
        this.applyNoteRenamed(event as NoteRenamedEvent, notes);
        break;
      case 'LINK_CREATED':
        this.applyLinkCreated(event as LinkCreatedEvent, notes);
        break;
      case 'LINK_UPDATED':
        this.applyLinkUpdated(event as LinkUpdatedEvent, notes);
        break;
      case 'LINK_DELETED':
        this.applyLinkDeleted(event as LinkDeletedEvent, notes);
        break;
      case 'SUPERTAG_CREATED':
        this.applySuperTagCreated(event as SuperTagCreatedEvent, superTags);
        break;
      case 'SUPERTAG_UPDATED':
        this.applySuperTagUpdated(event as SuperTagUpdatedEvent, superTags);
        break;
      case 'SUPERTAG_DELETED':
        this.applySuperTagDeleted(event as SuperTagDeletedEvent, superTags);
        break;
      case 'SUPERTAG_ASSIGNED':
        this.applySuperTagAssigned(event as SuperTagAssignedEvent, notes);
        break;
      case 'SUPERTAG_UNASSIGNED':
        this.applySuperTagUnassigned(event as SuperTagUnassignedEvent, notes);
        break;
      case 'ATTRIBUTE_UPDATED':
        this.applyAttributeUpdated(event as AttributeUpdatedEvent, notes);
        break;
    }
  }

  // Note event handlers
  private applyNoteCreated(event: NoteCreatedEvent, notes: Map<string, Note>): void {
    const { noteId, filepath, content } = event.payload;

    // Parse frontmatter from content (simplified)
    const note: Note = {
      id: noteId,
      filepath,
      frontmatter: {
        id: noteId,
        title: filepath.split('/').pop()?.replace('.md', '') || 'Untitled',
        created: event.timestamp,
        modified: event.timestamp,
      },
      content,
      rawContent: content,
    };

    notes.set(noteId, note);
  }

  private applyNoteUpdated(
    event: NoteUpdatedEvent,
    notes: Map<string, Note>,
    conflicts: ConflictResult[]
  ): void {
    const { noteId, newContent, previousHash } = event.payload;
    const existingNote = notes.get(noteId);

    if (!existingNote) {
      console.warn(`Note ${noteId} not found for update`);
      return;
    }

    // Check for conflicts (simplified hash check)
    const currentHash = this.hashContent(existingNote.content);
    if (previousHash && previousHash !== currentHash) {
      // Concurrent edit detected
      conflicts.push({
        eventId: event.id,
        conflictType: 'note_update',
        resolution: 'remote_wins', // Default: remote wins, but could create conflict copy
        details: `Concurrent edit on note ${noteId}`,
      });
    }

    // Apply update
    notes.set(noteId, {
      ...existingNote,
      content: newContent,
      rawContent: newContent,
      frontmatter: {
        ...existingNote.frontmatter,
        modified: event.timestamp,
      },
    });
  }

  private applyNoteDeleted(event: NoteDeletedEvent, notes: Map<string, Note>): void {
    notes.delete(event.payload.noteId);
  }

  private applyNoteRenamed(event: NoteRenamedEvent, notes: Map<string, Note>): void {
    const { noteId, newFilepath, newTitle } = event.payload;
    const existingNote = notes.get(noteId);

    if (existingNote) {
      notes.set(noteId, {
        ...existingNote,
        filepath: newFilepath,
        frontmatter: {
          ...existingNote.frontmatter,
          title: newTitle,
          modified: event.timestamp,
        },
      });
    }
  }

  // Link event handlers
  private applyLinkCreated(event: LinkCreatedEvent, notes: Map<string, Note>): void {
    const { linkId, sourceId, targetId, name, description, appearance } = event.payload;
    const sourceNote = notes.get(sourceId);

    if (!sourceNote) {
      console.warn(`Source note ${sourceId} not found for link creation`);
      return;
    }

    const newLink: LinkDefinition = {
      id: linkId,
      target: targetId,
      name,
      description,
      created: event.timestamp,
      appearance,
    };

    const links = sourceNote.frontmatter.links || [];
    notes.set(sourceId, {
      ...sourceNote,
      frontmatter: {
        ...sourceNote.frontmatter,
        links: [...links, newLink],
        modified: event.timestamp,
      },
    });
  }

  private applyLinkUpdated(event: LinkUpdatedEvent, notes: Map<string, Note>): void {
    const { linkId, sourceId, changes } = event.payload;
    const sourceNote = notes.get(sourceId);

    if (!sourceNote || !sourceNote.frontmatter.links) {
      return;
    }

    const links = sourceNote.frontmatter.links.map((link) =>
      link.id === linkId ? { ...link, ...changes } : link
    );

    notes.set(sourceId, {
      ...sourceNote,
      frontmatter: {
        ...sourceNote.frontmatter,
        links,
        modified: event.timestamp,
      },
    });
  }

  private applyLinkDeleted(event: LinkDeletedEvent, notes: Map<string, Note>): void {
    const { linkId, sourceId } = event.payload;
    const sourceNote = notes.get(sourceId);

    if (!sourceNote || !sourceNote.frontmatter.links) {
      return;
    }

    const links = sourceNote.frontmatter.links.filter((link) => link.id !== linkId);

    notes.set(sourceId, {
      ...sourceNote,
      frontmatter: {
        ...sourceNote.frontmatter,
        links,
        modified: event.timestamp,
      },
    });
  }

  // Super tag event handlers
  private applySuperTagCreated(
    event: SuperTagCreatedEvent,
    superTags: Map<string, SuperTag>
  ): void {
    superTags.set(event.payload.superTag.id, event.payload.superTag);
  }

  private applySuperTagUpdated(
    event: SuperTagUpdatedEvent,
    superTags: Map<string, SuperTag>
  ): void {
    const { superTagId, changes } = event.payload;
    const existing = superTags.get(superTagId);

    if (existing) {
      superTags.set(superTagId, {
        ...existing,
        ...changes,
        modified: event.timestamp,
      });
    }
  }

  private applySuperTagDeleted(
    event: SuperTagDeletedEvent,
    superTags: Map<string, SuperTag>
  ): void {
    superTags.delete(event.payload.superTagId);
  }

  private applySuperTagAssigned(event: SuperTagAssignedEvent, notes: Map<string, Note>): void {
    const { noteId, superTagId } = event.payload;
    const note = notes.get(noteId);

    if (!note) {
      return;
    }

    const superTags = note.frontmatter.superTags || [];
    if (!superTags.includes(superTagId)) {
      notes.set(noteId, {
        ...note,
        frontmatter: {
          ...note.frontmatter,
          superTags: [...superTags, superTagId],
          modified: event.timestamp,
        },
      });
    }
  }

  private applySuperTagUnassigned(event: SuperTagUnassignedEvent, notes: Map<string, Note>): void {
    const { noteId, superTagId } = event.payload;
    const note = notes.get(noteId);

    if (!note) {
      return;
    }

    notes.set(noteId, {
      ...note,
      frontmatter: {
        ...note.frontmatter,
        superTags: (note.frontmatter.superTags || []).filter((id) => id !== superTagId),
        modified: event.timestamp,
      },
    });
  }

  private applyAttributeUpdated(event: AttributeUpdatedEvent, notes: Map<string, Note>): void {
    const { noteId, superTagId, attributeKey, value } = event.payload;
    const note = notes.get(noteId);

    if (!note) {
      return;
    }

    const tagAttributes = note.frontmatter.tagAttributes || {};
    const currentAttrs = tagAttributes[superTagId] || {};

    notes.set(noteId, {
      ...note,
      frontmatter: {
        ...note.frontmatter,
        tagAttributes: {
          ...tagAttributes,
          [superTagId]: {
            ...currentAttrs,
            [attributeKey]: value,
          },
        },
        modified: event.timestamp,
      },
    });
  }

  // Utility functions
  private hashContent(content: string): string {
    // Simple hash for conflict detection
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      issyncing: false,
      lastSyncTime: null,
      pendingEvents: 0,
      conflicts: this.conflicts,
    };
  }

  /**
   * Clear conflicts
   */
  clearConflicts(): void {
    this.conflicts = [];
  }
}
