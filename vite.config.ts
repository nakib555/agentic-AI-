import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'framer-motion'],
              'syntax-highlighter': ['react-syntax-highlighter'],
              'markdown': ['react-markdown', 'rehype-katex', 'rehype-raw', 'remark-gfm', 'remark-math'],
              'gemini': ['@google/genai'],
              'icons': ['@heroicons/react'], // if used, or generic icon splitting
            }
          }
        }
      }
    };
});