
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production).
  // envDir defaults to process.cwd(), but explicitly passing it can resolve issues in some CI environments.
  // By passing `undefined` as the second argument, we let loadEnv use its default for envDir (which is process.cwd()).
  // The third argument `''` ensures all environment variables are loaded, regardless of prefix.
  const env = loadEnv(mode, undefined, '');

  return {
    plugins: [react()],
    define: {
      // This makes VITE_GEMINI_API_KEY (set in Netlify/environment)
      // available as process.env.API_KEY in your application code.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      // If you have other process.env variables, define them similarly
      // 'process.env.OTHER_KEY': JSON.stringify(env.VITE_OTHER_KEY),
    },
    // If your index.html is not in the root, specify the root directory
    // root: 'src', 
    build: {
      outDir: 'dist', // Output directory for the build
    },
    server: {
      port: 3000, // Development server port
    }
  };
});