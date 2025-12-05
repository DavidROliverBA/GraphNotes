// Note templates for common note types

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'productivity' | 'creative' | 'reference';
  defaultFilename: (date: Date) => string;
  defaultTitle: (date: Date) => string;
  content: (context: TemplateContext) => string;
  superTags?: string[];
}

export interface TemplateContext {
  date: Date;
  title: string;
  author?: string;
}

// Format helpers
export function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()];

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('dddd', weekday)
    .replace('MMMM', monthName);
}

// Default templates
export const DEFAULT_TEMPLATES: NoteTemplate[] = [
  // Basic templates
  {
    id: 'blank',
    name: 'Blank Note',
    description: 'Start with a clean slate',
    icon: '📄',
    category: 'basic',
    defaultFilename: () => `untitled-${Date.now()}`,
    defaultTitle: () => 'Untitled',
    content: () => '',
  },
  {
    id: 'daily',
    name: 'Daily Note',
    description: 'Daily journal entry with date heading',
    icon: '📅',
    category: 'basic',
    defaultFilename: (date) => formatDate(date, 'YYYY-MM-DD'),
    defaultTitle: (date) => formatDate(date, 'dddd, MMMM DD, YYYY'),
    content: ({ date }) => `# ${formatDate(date, 'dddd, MMMM DD, YYYY')}

## Morning Intentions


## Tasks
- [ ]

## Notes


## Evening Reflection

`,
  },
  {
    id: 'weekly',
    name: 'Weekly Review',
    description: 'Weekly review and planning template',
    icon: '📊',
    category: 'productivity',
    defaultFilename: (date) => `weekly-${formatDate(date, 'YYYY-MM-DD')}`,
    defaultTitle: (date) => `Week of ${formatDate(date, 'MMMM DD, YYYY')}`,
    content: ({ date }) => `# Week of ${formatDate(date, 'MMMM DD, YYYY')}

## Last Week Review

### What went well?


### What could be improved?


### Key accomplishments


## This Week Planning

### Goals
1.
2.
3.

### Important Tasks
- [ ]

### Meetings & Events


## Notes

`,
  },

  // Productivity templates
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Structured notes for meetings',
    icon: '🤝',
    category: 'productivity',
    defaultFilename: (date) => `meeting-${formatDate(date, 'YYYY-MM-DD')}`,
    defaultTitle: () => 'Meeting Notes',
    content: ({ date }) => `# Meeting Notes

**Date:** ${formatDate(date, 'MMMM DD, YYYY')}
**Attendees:**
**Location:**

## Agenda
1.

## Discussion


## Action Items
- [ ]

## Decisions Made


## Next Steps

`,
  },
  {
    id: 'project',
    name: 'Project',
    description: 'Project planning and tracking',
    icon: '📁',
    category: 'productivity',
    defaultFilename: () => `project-${Date.now()}`,
    defaultTitle: () => 'New Project',
    content: ({ title }) => `# ${title}

## Overview


## Goals
1.
2.
3.

## Milestones
- [ ]

## Resources


## Notes

`,
    superTags: ['project'],
  },
  {
    id: 'task-list',
    name: 'Task List',
    description: 'Simple task tracking',
    icon: '✅',
    category: 'productivity',
    defaultFilename: () => `tasks-${Date.now()}`,
    defaultTitle: () => 'Tasks',
    content: () => `# Tasks

## High Priority
- [ ]

## Medium Priority
- [ ]

## Low Priority
- [ ]

## Completed

`,
  },

  // Creative templates
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Free-form idea generation',
    icon: '💡',
    category: 'creative',
    defaultFilename: () => `brainstorm-${Date.now()}`,
    defaultTitle: () => 'Brainstorm Session',
    content: () => `# Brainstorm Session

## Topic


## Ideas
-

## Connections


## Next Actions
- [ ]

`,
  },
  {
    id: 'book-notes',
    name: 'Book Notes',
    description: 'Notes and highlights from a book',
    icon: '📚',
    category: 'creative',
    defaultFilename: () => `book-${Date.now()}`,
    defaultTitle: () => 'Book Notes',
    content: () => `# Book Notes

**Title:**
**Author:**
**Started:**
**Finished:**
**Rating:** ⭐⭐⭐⭐⭐

## Summary


## Key Takeaways
1.
2.
3.

## Favorite Quotes
>

## How it applies to my life


## Related Notes

`,
    superTags: ['book'],
  },

  // Reference templates
  {
    id: 'person',
    name: 'Person',
    description: 'Contact or person profile',
    icon: '👤',
    category: 'reference',
    defaultFilename: () => `person-${Date.now()}`,
    defaultTitle: () => 'New Contact',
    content: ({ title }) => `# ${title}

**Role:**
**Company:**
**Email:**
**Phone:**

## Background


## Notes


## Interactions

`,
    superTags: ['person'],
  },
  {
    id: 'reference',
    name: 'Reference Note',
    description: 'Store reference information',
    icon: '📖',
    category: 'reference',
    defaultFilename: () => `reference-${Date.now()}`,
    defaultTitle: () => 'Reference',
    content: () => `# Reference

## Source


## Summary


## Key Points
-

## Related

`,
  },
];

// Get templates by category
export function getTemplatesByCategory(
  templates: NoteTemplate[]
): Record<string, NoteTemplate[]> {
  const grouped: Record<string, NoteTemplate[]> = {};

  for (const template of templates) {
    if (!grouped[template.category]) {
      grouped[template.category] = [];
    }
    grouped[template.category].push(template);
  }

  return grouped;
}

// Category labels
export const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  basic: 'Basic',
  productivity: 'Productivity',
  creative: 'Creative',
  reference: 'Reference',
};

// Get template by ID
export function getTemplateById(id: string): NoteTemplate | undefined {
  return DEFAULT_TEMPLATES.find((t) => t.id === id);
}

// Generate note content from template
export function generateNoteFromTemplate(
  template: NoteTemplate,
  context?: Partial<TemplateContext>
): { filename: string; title: string; content: string } {
  const date = context?.date || new Date();
  const title = context?.title || template.defaultTitle(date);

  const fullContext: TemplateContext = {
    date,
    title,
    author: context?.author,
  };

  return {
    filename: template.defaultFilename(date) + '.md',
    title,
    content: template.content(fullContext),
  };
}
