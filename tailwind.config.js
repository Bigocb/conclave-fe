/**
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aviation-bg': '#06090f',
        'aviation-accent': '#00d98b',
        'aviation-warning': '#ffd966',
        'aviation-border': '#1a1f2e',
        'aviation-panel': '#0a0f1a',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
