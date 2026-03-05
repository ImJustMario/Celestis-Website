/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F7F7F5',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          secondary: '#6B6B6B',
          muted: '#9A9A9A',
        },
        accent: {
          DEFAULT: '#E8573D',
          hover: '#D14A32',
          light: '#FDEAE6',
        },
        line: '#E8E8E6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif', 'system-ui'],
      },
      boxShadow: {
        soft: '0 2px 16px 0 rgba(0,0,0,0.04)',
        card: '0 4px 24px 0 rgba(0,0,0,0.06)',
        lift: '0 8px 32px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
