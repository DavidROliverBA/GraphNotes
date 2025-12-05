import { AttributeValue } from '../notes/types';

export type AttributeType =
  | 'text'
  | 'richText'
  | 'number'
  | 'checkbox'
  | 'date'
  | 'select'
  | 'multiSelect'
  | 'noteReference'
  | 'url'
  | 'email'
  | 'rating';

export interface SelectOption {
  value: string;
  label: string;
  colour?: string;
}

export interface SelectConfig {
  options: SelectOption[];
}

export interface NumberConfig {
  min?: number;
  max?: number;
  step?: number;
  format?: 'number' | 'currency' | 'percentage';
}

export interface DateConfig {
  includeTime: boolean;
  dateFormat?: string;
}

export interface NoteReferenceConfig {
  allowedSuperTags?: string[];
  allowMultiple: boolean;
}

export type AttributeConfig =
  | SelectConfig
  | NumberConfig
  | DateConfig
  | NoteReferenceConfig;

export interface SuperTagAttribute {
  id: string;
  key: string;
  name: string;
  type: AttributeType;
  required: boolean;
  defaultValue?: AttributeValue;
  config?: AttributeConfig;
}

export interface SuperTag {
  id: string;
  name: string;
  icon?: string;
  colour: string;
  description?: string;
  attributes: SuperTagAttribute[];
  created: string;
  modified: string;
}

// Default super tag colours
export const SUPER_TAG_COLOURS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

// Default icons (emoji)
export const SUPER_TAG_ICONS = [
  '📁', '📝', '👤', '📚', '🎯', '💡', '🔧', '📊',
  '🏷️', '⭐', '🔖', '📌', '🗂️', '📋', '🎨', '🔬',
];

export function createSuperTag(name: string, colour?: string): SuperTag {
  const now = new Date().toISOString();
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    colour: colour || SUPER_TAG_COLOURS[0],
    attributes: [],
    created: now,
    modified: now,
  };
}

export function createAttribute(
  name: string,
  type: AttributeType,
  config?: AttributeConfig
): SuperTagAttribute {
  return {
    id: crypto.randomUUID(),
    key: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    type,
    required: false,
    config,
  };
}

// Type guards for config
export function isSelectConfig(config: AttributeConfig | undefined): config is SelectConfig {
  return config !== undefined && 'options' in config;
}

export function isNumberConfig(config: AttributeConfig | undefined): config is NumberConfig {
  return config !== undefined && ('min' in config || 'max' in config || 'step' in config || 'format' in config);
}

export function isDateConfig(config: AttributeConfig | undefined): config is DateConfig {
  return config !== undefined && 'includeTime' in config;
}

export function isNoteReferenceConfig(config: AttributeConfig | undefined): config is NoteReferenceConfig {
  return config !== undefined && 'allowMultiple' in config;
}
