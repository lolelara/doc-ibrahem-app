
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}", // Added services if they contain classes, adjust as needed
    "./App.tsx", // Added App.tsx
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'], // Set Cairo as the default sans-serif font
      },
      colors: { 
        sky: { 
          600: '#0284c7', // THEME_COLORS.primary
          700: '#0369a1', // THEME_COLORS.primaryHover
        },
        lime: { 
          500: '#84cc16', // THEME_COLORS.secondary
          600: '#65a30d', // THEME_COLORS.secondaryHover
        },
        rose: { 
          500: '#f43f5e', // THEME_COLORS.accent
          600: '#e11d48', // THEME_COLORS.accentHover
        },
        slate: { 
          50: '#f8fafc',   // THEME_COLORS.textPrimary
          100: '#f1f5f9',
          400: '#94a3b8', // THEME_COLORS.textSecondary
          700: '#334155', // Used in Input fields, etc.
          800: '#1e293b', // Previously surface, now used for input fields for example
          900: '#0f172a', // THEME_COLORS.surface
          950: '#020617', // THEME_COLORS.background
        },
        red: { // For error states
          500: '#ef4444', // THEME_COLORS.error
          600: '#dc2626', // A slightly darker red for hover if needed
        },
        green: { // For success states
          500: '#22c55e', // THEME_COLORS.success
          600: '#16a34a', // A slightly darker green for hover if needed
        }
      }
    },
  },
  plugins: [],
}