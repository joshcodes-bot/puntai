import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#080808',
        white: '#f5f5f0',
        lime: '#d4ff00',
        red: '#ff2d2d',
        grey: '#1c1c1c',
        grey2: '#2a2a2a',
        mid: '#555555',
        border: '#2a2a2a',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        mono: ['var(--font-ibm-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
