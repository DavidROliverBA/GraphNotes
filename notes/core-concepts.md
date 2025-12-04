---
id: concepts-note
title: Core Concepts
tags:
  - concepts
  - documentation
created: 2024-12-04T09:00:00.000Z
modified: 2024-12-04T09:00:00.000Z
links:
  - target: markdown-note
    name: relates to
    description: Markdown is used for content
---

# Core Concepts

Understanding how GraphNotes organizes your knowledge.

## Notes

Notes are the building blocks of your knowledge graph. Each note is a markdown file with:
- **Frontmatter**: YAML metadata at the top (title, tags, links)
- **Content**: Markdown text with support for formatting and links

## Links

Links connect your notes together. There are several types:
- **Wikilinks**: Use `[[Note Title]]` to link to other notes
- **Named Links**: Define relationships in frontmatter with semantic meaning

## The Graph

The graph visualizes all your notes and their connections. Use it to:
- Discover related content
- Understand the structure of your knowledge
- Find orphan notes that need connections

See also: [[Markdown Guide]]
