/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f8f4',
          100: '#d4ede0',
          200: '#a9dbc1',
          300: '#7ec9a2',
          400: '#53b783',
          500: '#2d8659',
          600: '#256b47',
          700: '#1d5035',
          800: '#153624',
          900: '#0d1b12',
        },
      },
    },
  },
  plugins: [],
}

