import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const rawApiKeys = Object.keys(env)
    .filter(key => key.startsWith('GEMINI_API_KEY') || key.startsWith('GOOGLE_API_KEY'))
    .map(key => env[key]);

  // Support comma-separated keys in a single variable
  const apiKeys = rawApiKeys
    .flatMap(key => (key || '').split(','))
    .map(key => key.trim())
    .filter(key => key.length > 0);

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      '__API_KEYS__': JSON.stringify(apiKeys),
      '__API_KEY__': JSON.stringify(env.GEMINI_API_KEY || ""),
      'process.env': JSON.stringify({}), // Prevent "process is not defined" if accessed elsewhere
      // Keep these for backward compat if any libraries use them, though we should avoid relying on them
      'process.env.API_KEYS': JSON.stringify(apiKeys),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || "")
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
