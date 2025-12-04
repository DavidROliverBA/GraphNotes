// src/lib/templates/noteTemplates.ts

/**
 * Note template definitions
 */

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  filenamePattern: string;          // Supports date tokens like {{date}}, {{datetime}}
  folderPattern?: string;           // Optional folder, supports {{year}}, {{month}}
  content: string;                  // Template content with tokens
  frontmatterDefaults?: Record<string, unknown>;
}

/**
 * Available template tokens
 */
export const templateTokens = {
  '{{date}}': () => formatDate(new Date()),
  '{{datetime}}': () => formatDateTime(new Date()),
  '{{time}}': () => formatTime(new Date()),
  '{{year}}': () => new Date().getFullYear().toString(),
  '{{month}}': () => String(new Date().getMonth() + 1).padStart(2, '0'),
  '{{day}}': () => String(new Date().getDate()).padStart(2, '0'),
  '{{weekday}}': () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
  '{{week}}': () => getWeekNumber(new Date()).toString().padStart(2, '0'),
  '{{timestamp}}': () => Date.now().toString(),
  '{{title}}': (title?: string) => title || 'Untitled',
};

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Format datetime as YYYY-MM-DD_HH-mm
 */
export function formatDateTime(date: Date): string {
  return date.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
}

/**
 * Format time as HH:mm
 */
export function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16);
}

/**
 * Get ISO week number
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Apply template tokens to a string
 */
export function applyTokens(template: string, context?: { title?: string }): string {
  let result = template;

  for (const [token, fn] of Object.entries(templateTokens)) {
    if (token === '{{title}}') {
      result = result.replace(new RegExp(token, 'g'), fn(context?.title));
    } else {
      result = result.replace(new RegExp(token, 'g'), fn());
    }
  }

  return result;
}

/**
 * Default note templates
 */
export const defaultTemplates: NoteTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Note',
    description: 'An empty note to start fresh',
    filenamePattern: '{{title}}.md',
    content: '',
  },
  {
    id: 'daily',
    name: 'Daily Note',
    description: 'A daily journal entry with date-based filename',
    filenamePattern: '{{date}}.md',
    folderPattern: 'daily/{{year}}',
    content: `# {{weekday}}, {{date}}

## Tasks
- [ ]

## Notes


## Journal

`,
    frontmatterDefaults: {
      type: 'daily',
    },
  },
  {
    id: 'weekly',
    name: 'Weekly Review',
    description: 'A weekly summary and planning note',
    filenamePattern: '{{year}}-W{{week}}.md',
    folderPattern: 'weekly',
    content: `# Week {{week}}, {{year}}

## Accomplishments
-

## Challenges
-

## Learnings
-

## Next Week's Goals
-

## Notes

`,
    frontmatterDefaults: {
      type: 'weekly',
    },
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Template for meeting notes with attendees and action items',
    filenamePattern: '{{date}}-{{title}}.md',
    folderPattern: 'meetings',
    content: `# {{title}}

**Date:** {{date}}
**Time:** {{time}}
**Attendees:**

## Agenda
1.

## Discussion


## Action Items
- [ ] @person: Task

## Next Steps

`,
    frontmatterDefaults: {
      type: 'meeting',
    },
  },
  {
    id: 'project',
    name: 'Project Note',
    description: 'Template for project planning and tracking',
    filenamePattern: '{{title}}.md',
    folderPattern: 'projects',
    content: `# {{title}}

## Overview


## Goals
-

## Tasks
- [ ]

## Resources
-

## Timeline


## Notes

`,
    frontmatterDefaults: {
      type: 'project',
      status: 'planning',
    },
  },
  {
    id: 'idea',
    name: 'Idea Note',
    description: 'Capture quick ideas and thoughts',
    filenamePattern: '{{datetime}}-idea.md',
    folderPattern: 'ideas',
    content: `# Idea: {{title}}

**Captured:** {{datetime}}

## The Idea


## Why It Matters


## Next Steps
- [ ]

`,
    frontmatterDefaults: {
      type: 'idea',
    },
  },
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): NoteTemplate | undefined {
  return defaultTemplates.find(t => t.id === id);
}

/**
 * Get the daily note template
 */
export function getDailyTemplate(): NoteTemplate {
  return defaultTemplates.find(t => t.id === 'daily')!;
}

/**
 * Generate filename from template
 */
export function generateFilename(template: NoteTemplate, title?: string): string {
  return applyTokens(template.filenamePattern, { title });
}

/**
 * Generate folder path from template
 */
export function generateFolderPath(template: NoteTemplate): string {
  if (!template.folderPattern) return '';
  return applyTokens(template.folderPattern);
}

/**
 * Generate full filepath from template
 */
export function generateFilepath(template: NoteTemplate, title?: string): string {
  const folder = generateFolderPath(template);
  const filename = generateFilename(template, title);
  return folder ? `${folder}/${filename}` : filename;
}

/**
 * Generate note content from template
 */
export function generateContent(template: NoteTemplate, title?: string): string {
  return applyTokens(template.content, { title });
}

export default defaultTemplates;
