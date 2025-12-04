/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for GraphNotes using CSS variables
        sidebar: {
          bg: 'var(--sidebar-bg)',
          hover: 'var(--sidebar-hover)',
          active: 'var(--sidebar-active)',
        },
        editor: {
          bg: 'var(--editor-bg)',
          text: 'var(--editor-text)',
        },
        graph: {
          bg: 'var(--graph-bg)',
          node: 'var(--graph-node)',
          edge: 'var(--graph-edge)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          error: 'var(--accent-error)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
        },
      },
      fontSize: {
        ui: 'var(--ui-font-size)',
      },
      fontFamily: {
        editor: 'var(--editor-font-family)',
      },
    },
  },
  plugins: [],
}

