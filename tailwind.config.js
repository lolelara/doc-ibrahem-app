
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    // "./services/**/*.{js,ts,jsx,tsx}", // Removed
    "./App.tsx", 
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'], 
      },
      colors: { 
        sky: { 
          400: '#38bdf8', // For focus rings or brighter accents
          500: '#0ea5e9', // New primary
          600: '#0284c7', // New primary hover
        },
        rose: { 
          500: '#f43f5e', 
          600: '#e11d48', 
        },
        slate: { 
          50: '#f8fafc',   
          100: '#f1f5f9',
          300: '#cbd5e1', 
          400: '#94a3b8', // New textSecondary
          600: '#475569', // For secondary button hover
          700: '#334155', // For secondary button base and borders
          800: '#1e293b', // For input backgrounds
          900: '#0f172a', // New surface
          950: '#020617', // New background
        },
        red: { 
          500: '#ef4444', 
          600: '#dc2626', 
        },
        green: { 
          500: '#22c55e', 
          600: '#16a34a', 
        }
      }
    },
  },
  plugins: [],
}
