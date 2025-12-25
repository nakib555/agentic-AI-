import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom plugin to handle static asset copying and SW processing
const staticAssetsPlugin = (appVersion: string) => ({
  name: 'static-assets-plugin',
  closeBundle: async () => {
    const distDir = path.resolve(__dirname, 'dist');
    const stylesDir = path.join(distDir, 'styles');

    // Ensure styles directory exists for Tailwind CLI
    if (!fs.existsSync(stylesDir)) {
      fs.mkdirSync(stylesDir, { recursive: true });
    }
    
    // 1. Copy Manifest, Favicon, Cloudflare Redirects AND Headers
    const filesToCopy = ['manifest.json', 'favicon.svg', '_redirects', '_headers'];
    for (const file of filesToCopy) {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`[Vite] Copied ${file} to dist`);
      }
    }

    // 2. Process and Copy Service Worker
    if (fs.existsSync('sw.js')) {
      let swContent = fs.readFileSync('sw.js', 'utf-8');
      swContent = swContent.replace('{{VERSION}}', appVersion);
      fs.writeFileSync(path.join(distDir, 'sw.js'), swContent);
      console.log(`[Vite] Injected version ${appVersion} into sw.js and copied to dist`);
    }
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Fallback version if not provided by build system
    const appVersion = process.env.APP_VERSION || 'v1.0.0';
    
    // Prioritize VITE_API_BASE_URL, fallback to API_BASE_URL, default to empty string
    const apiBaseUrl = env.VITE_API_BASE_URL || env.API_BASE_URL || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        staticAssetsPlugin(appVersion)
      ],
      define: {
        // Expose env vars to the client
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
        // Explicitly define API base URL for build-time replacement
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      },
      build: {
        outDir: 'dist',
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'framer-motion'],
              'syntax-highlighter': ['react-syntax-highlighter'],
              'markdown': ['react-markdown', 'rehype-katex', 'rehype-raw', 'remark-gfm', 'remark-math'],
              'gemini': ['@google/genai'],
            }
          }
        }
      }
    };
});