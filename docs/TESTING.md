# GraphNotes Testing Documentation

This document describes the testing infrastructure for GraphNotes, including both unit tests (Vitest) and end-to-end tests (Playwright).

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Unit Tests (Vitest)](#unit-tests-vitest)
- [End-to-End Tests (Playwright)](#end-to-end-tests-playwright)
- [Test Architecture](#test-architecture)
- [Writing New Tests](#writing-new-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

GraphNotes uses a two-tier testing strategy:

| Test Type | Framework | Purpose | Location |
|-----------|-----------|---------|----------|
| Unit Tests | Vitest | Test individual functions and modules | `src/**/*.test.ts` |
| E2E Tests | Playwright | Test full user workflows in browser | `e2e/**/*.spec.ts` |

### Test Statistics

- **Unit Tests**: 19 tests across sync/event modules
- **E2E Tests**: 59 tests covering all major features

---

## Quick Start

```bash
# Run all unit tests
npm run test:run

# Run unit tests in watch mode
npm run test

# Run all E2E tests
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui

# Run E2E tests with visible browser
npm run test:e2e:headed

# View E2E test report
npm run test:e2e:report
```

---

## Unit Tests (Vitest)

### Configuration

Unit tests are configured in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/e2e/**', '**/node_modules/**'],
  },
});
```

### Test Files

| File | Tests | Description |
|------|-------|-------------|
| `src/lib/sync/EventLog.test.ts` | 19 | Vector clock operations, event creation, causal sorting |

### Unit Test Coverage

#### Vector Clock Operations
- `incrementClock` - Incrementing device counters
- `mergeClock` - Merging clocks from multiple devices
- `compareClock` - Comparing clock states (before/after/concurrent/equal)
- `happenedBefore` - Causal ordering of events
- `sortEventsCausally` - Sorting events maintaining causal order

#### Event Creation
- `createBaseEvent` - Creating sync events with unique IDs and timestamps

### Running Unit Tests

```bash
# Run once
npm run test:run

# Watch mode (re-runs on file changes)
npm run test

# Run specific test file
npx vitest run src/lib/sync/EventLog.test.ts

# Run with coverage
npx vitest run --coverage
```

---

## End-to-End Tests (Playwright)

### Configuration

E2E tests are configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Test Files

| File | Tests | Description |
|------|-------|-------------|
| `e2e/vault.spec.ts` | 9 | Vault selection, opening, file operations |
| `e2e/editor.spec.ts` | 12 | Editor display, typing, formatting, note creation |
| `e2e/sidebar.spec.ts` | 14 | Sidebar structure, file tree, quick access, settings |
| `e2e/settings.spec.ts` | 10 | Settings panel, theme switching, keyboard shortcuts |
| `e2e/navigation.spec.ts` | 14 | View modes, graph view, keyboard navigation, status bar |

### E2E Test Coverage

#### Vault Operations (`vault.spec.ts`)
- Vault selector display
- Opening existing vaults
- Creating new vaults
- Recent vaults list
- Vault switching

#### Editor (`editor.spec.ts`)
- Editor display when note selected
- Toolbar visibility
- Note content rendering
- Typing in editor
- Save indicators
- Create note from placeholder
- Heading/list formatting
- Note switching preservation

#### Sidebar (`sidebar.spec.ts`)
- Sidebar section visibility (Quick Access, Vault, Super Tags)
- Search bar functionality
- Daily Note, Favourites, Recent buttons
- File tree display
- Note selection highlighting
- New note button
- Super Tags collapse/expand
- Settings access

#### Settings (`settings.spec.ts`)
- Opening/closing settings panel
- Appearance tab navigation
- Light/Dark/System theme options
- Theme switching functionality
- Keyboard shortcuts display
- Settings persistence

#### Navigation (`navigation.spec.ts`)
- View mode buttons (Editor, Graph, Split)
- Switching between views
- Graph view node display
- Graph controls
- Keyboard shortcuts (Cmd+K, Cmd+\, Escape)
- Status bar display
- Title bar elements

### Mock System

Since GraphNotes is a Tauri app, E2E tests run in browser-only mode with mocked Tauri APIs.

#### How It Works

1. **Environment Detection** (`src/lib/tauri/commands.ts`):
```typescript
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
```

2. **Mock File System**: When not in Tauri environment, the app uses an in-memory mock file system:
```typescript
const mockFs = {
  files: new Map<string, string>(),
  directories: new Set<string>(['/test-vault', '/test-vault/.graphnotes']),
};
```

3. **Dialog Wrapper** (`src/lib/tauri/dialog.ts`):
```typescript
export async function openDialog(options?: OpenDialogOptions) {
  if (isTauriEnvironment()) {
    return tauriOpen(options);
  }
  return mockDialogResult; // Returns '/test-vault' by default
}
```

### Custom Test Fixtures

Tests use custom fixtures defined in `e2e/fixtures/test-fixtures.ts`:

```typescript
export interface GraphNotesFixtures {
  vfs: VirtualFileSystem;           // Virtual file system
  graphNotesPage: Page;             // Page with mocks injected
  setDialogResult: (result) => void; // Control dialog responses
  getVfsFiles: () => Promise<...>;  // Read mock files
  setVfsFile: (path, content) => void; // Write mock files
  openTestVault: () => Promise<void>; // Open test vault helper
  createNote: (title) => Promise<string>; // Create note helper
  selectNote: (title) => Promise<void>; // Select note helper
  typeInEditor: (text) => Promise<void>; // Type in editor helper
  waitForAppReady: () => Promise<void>; // Wait for app load
}
```

### Page Objects

The test suite includes Page Object classes for cleaner test code:

- **VaultSelectorPage** - Vault selection interactions
- **SidebarPage** - Sidebar navigation and file tree
- **EditorPage** - Editor typing and content verification
- **SettingsPage** - Settings panel interactions
- **GraphPage** - Graph view node and zoom controls

Example usage:
```typescript
test('should display nodes', async ({ graphNotesPage }) => {
  const graphPage = new GraphPage(graphNotesPage);
  const nodeCount = await graphPage.getNodeCount();
  expect(nodeCount).toBeGreaterThan(0);
});
```

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (interactive debugging)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/editor.spec.ts

# Run tests matching pattern
npx playwright test -g "should display editor"

# View HTML report
npm run test:e2e:report

# Debug a specific test
npx playwright test e2e/editor.spec.ts --debug
```

---

## Test Architecture

```
GraphNotes/
├── src/
│   ├── lib/
│   │   ├── sync/
│   │   │   ├── events.ts           # Sync event types
│   │   │   └── EventLog.test.ts    # Unit tests
│   │   └── tauri/
│   │       ├── commands.ts         # Tauri commands + mocks
│   │       └── dialog.ts           # Dialog wrapper + mocks
│   └── test/
│       └── setup.ts                # Vitest setup
├── e2e/
│   ├── fixtures/
│   │   └── test-fixtures.ts        # Custom Playwright fixtures
│   ├── utils/
│   │   └── tauri-mocks.ts          # Mock utilities
│   ├── vault.spec.ts               # Vault tests
│   ├── editor.spec.ts              # Editor tests
│   ├── sidebar.spec.ts             # Sidebar tests
│   ├── settings.spec.ts            # Settings tests
│   └── navigation.spec.ts          # Navigation tests
├── vitest.config.ts                # Unit test config
├── playwright.config.ts            # E2E test config
└── playwright-report/              # HTML test reports
```

---

## Writing New Tests

### Adding Unit Tests

1. Create a test file next to the source file:
```
src/lib/feature/myFeature.ts
src/lib/feature/myFeature.test.ts
```

2. Write tests using Vitest:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFeature';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Adding E2E Tests

1. Create or add to a spec file in `e2e/`:
```typescript
import { test, expect } from './fixtures/test-fixtures';

test.describe('My Feature', () => {
  test.beforeEach(async ({ graphNotesPage, waitForAppReady, openTestVault }) => {
    await waitForAppReady();
    await openTestVault();
  });

  test('should work correctly', async ({ graphNotesPage }) => {
    // Your test code
    await graphNotesPage.click('button:has-text("My Button")');
    await expect(graphNotesPage.locator('.result')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors:
```typescript
// In component
<button data-testid="create-note">Create</button>

// In test
await page.click('[data-testid="create-note"]');
```

2. **Wait for elements** instead of arbitrary timeouts:
```typescript
// Good
await graphNotesPage.waitForSelector('.editor-container', { timeout: 5000 });

// Avoid
await graphNotesPage.waitForTimeout(5000);
```

3. **Use Page Objects** for reusable interactions:
```typescript
const editor = new EditorPage(graphNotesPage);
await editor.type('Hello world');
expect(await editor.isSaved()).toBe(true);
```

4. **Isolate tests** - each test should set up its own state:
```typescript
test.beforeEach(async ({ openTestVault }) => {
  await openTestVault(); // Fresh vault for each test
});
```

---

## CI/CD Integration

### GitHub Actions Configuration

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### CI-Specific Configuration

The Playwright config includes CI-specific settings:
- Single worker (`workers: 1`)
- Retries enabled (`retries: 2`)
- Fresh server for each run (`reuseExistingServer: false`)

---

## Troubleshooting

### Common Issues

#### E2E Tests: "Timeout waiting for selector"

The element might not exist or has a different selector. Use Playwright UI to debug:
```bash
npm run test:e2e:ui
```

#### E2E Tests: "Strict mode violation"

Multiple elements match the selector. Make it more specific:
```typescript
// Instead of
await page.click('text=Submit');

// Use
await page.click('button:has-text("Submit")');
// Or
await page.click('[data-testid="submit-button"]');
```

#### Unit Tests: "Cannot find module"

Ensure the import path is correct and the module exports the function:
```typescript
// Check exports in source file
export { myFunction };

// Check import in test file
import { myFunction } from './myModule';
```

#### E2E Tests: "Target page, context or browser has been closed"

Avoid storing page references that may become stale:
```typescript
// Good - use fixtures
test('example', async ({ graphNotesPage }) => {
  await graphNotesPage.click('...');
});

// Avoid - page may be closed
const page = await browser.newPage();
// ... later
await page.click('...'); // May fail
```

### Debugging Tips

1. **Playwright UI Mode**: Best for debugging E2E tests
```bash
npm run test:e2e:ui
```

2. **Headed Mode**: Watch tests run in real browser
```bash
npm run test:e2e:headed
```

3. **Pause on Failure**: Add `await page.pause()` to stop execution
```typescript
test('debug me', async ({ graphNotesPage }) => {
  await graphNotesPage.click('button');
  await graphNotesPage.pause(); // Opens inspector
});
```

4. **Screenshots/Videos**: Automatically captured on failure
- Check `playwright-report/` directory
- View with `npm run test:e2e:report`

5. **Console Logs**: Add logging to see what's happening
```typescript
test('debug', async ({ graphNotesPage }) => {
  graphNotesPage.on('console', msg => console.log(msg.text()));
  // ... rest of test
});
```

---

## Dependencies

### Unit Testing
- `vitest` - Test runner
- `@testing-library/react` - React component testing utilities
- `@testing-library/dom` - DOM testing utilities
- `jsdom` - Browser environment simulation

### E2E Testing
- `@playwright/test` - E2E test framework
- `playwright` - Browser automation

---

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
