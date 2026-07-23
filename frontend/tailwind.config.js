/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#f7f8f5',
        surface: '#ffffff',
        ink: '#20241f',
        muted: '#667065',
        border: '#dfe4dc',
        brand: {
          50: '#f0f7f2',
          100: '#dcece1',
          200: '#bad9c5',
          300: '#91bea3',
          400: '#669e7f',
          500: '#477f61',
          600: '#35664c',
          700: '#2b513e',
          800: '#244133',
          900: '#1e362b',
          950: '#101e18',
        },
        accent: {
          coral: '#c86654',
          gold: '#b8872f',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '0.5rem',
      },
      boxShadow: {
        panel: '0 10px 30px rgba(32, 36, 31, 0.08)',
      },
    },
  },
  plugins: [],
}
