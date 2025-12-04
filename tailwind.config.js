/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for GraphNotes
        sidebar: {
          bg: '#1e1e2e',
          hover: '#313244',
          active: '#45475a',
        },
        editor: {
          bg: '#181825',
          text: '#cdd6f4',
        },
        graph: {
          bg: '#11111b',
          node: '#89b4fa',
          edge: '#6c7086',
        },
        accent: {
          primary: '#89b4fa',
          secondary: '#f5c2e7',
          success: '#a6e3a1',
          warning: '#fab387',
          error: '#f38ba8',
        },
      },
    },
  },
  plugins: [],
}

