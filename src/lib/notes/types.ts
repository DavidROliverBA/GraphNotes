export interface LinkAppearance {
  direction: 'forward' | 'backward' | 'bidirectional' | 'none';
  colour: string;
  style: 'solid' | 'dashed' | 'dotted';
  thickness: 'thin' | 'normal' | 'thick';
  animated?: boolean;
}

export interface LinkDefinition {
  id: string;
  target: string;
  name: string;
  description?: string;
  created: string;
  appearance: LinkAppearance;
}

export type AttributeValue =
  | string
  | number
  | boolean
  | string[]
  | { date: string }
  | { noteId: string }
  | null;

export interface NoteFrontmatter {
  id: string;
  title: string;
  created: string;
  modified: string;
  superTags?: string[];
  tagAttributes?: {
    [superTagId: string]: {
      [attributeKey: string]: AttributeValue;
    };
  };
  links?: LinkDefinition[];
}

export interface Note {
  id: string;
  filepath: string;
  frontmatter: NoteFrontmatter;
  content: string;
  rawContent: string;
}

export interface NoteListItem {
  id: string;
  filepath: string;
  title: string;
  created: string;
  modified: string;
  superTags?: string[];
}

export const DEFAULT_LINK_APPEARANCE: LinkAppearance = {
  direction: 'forward',
  colour: '#3b82f6',
  style: 'solid',
  thickness: 'normal',
  animated: false,
};

export function createDefaultFrontmatter(title: string): NoteFrontmatter {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    created: now,
    modified: now,
  };
}

export function createLinkDefinition(
  target: string,
  name: string = 'links to'
): LinkDefinition {
  return {
    id: crypto.randomUUID(),
    target,
    name,
    created: new Date().toISOString(),
    appearance: { ...DEFAULT_LINK_APPEARANCE },
  };
}
