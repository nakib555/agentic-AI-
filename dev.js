import esbuild from 'esbuild';
import { spawn } from 'child_process';
import cpx from 'cpx';
import 'dotenv/config';
import { rm } from 'fs/promises';

// --- Configuration ---
const FRONTEND_DEV_PORT = 8000;
const BACKEND_PORT = 3001;

console.log('Starting development environment...');

// --- API Key Check ---
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(`
    \x1b[31m[DEV-SERVER ERROR]\x1b[0m API key is missing.
    The backend worker requires the Gemini API key to be set.
    Please create a '.env' file in the project root and add: API_KEY="YOUR_GEMINI_API_KEY_HERE"
  `);
  process.exit(1);
}

// --- Cleanup ---
await rm('dist', { recursive: true, force: true }).catch(() => {});
console.log('Cleaned dist directory.');

// --- Run Backend Worker with Wrangler ---
try {
  console.log('Starting Cloudflare Worker in development mode...');
  const wranglerProcess = spawn('npx', [
    'wrangler',
    'dev',
    'backend/server.ts',
    '--port',
    BACKEND_PORT.toString(),
    '--local'
  ], {
    stdio: 'inherit',
    shell: true, // Use shell to correctly resolve `npx` on different systems
  });

  wranglerProcess.on('error', (err) => {
    console.error('\x1b[31m[Wrangler Error]\x1b[0m Failed to start wrangler:', err);
    process.exit(1);
  });
} catch (e) {
  console.error('Failed to initialize backend worker:', e);
  process.exit(1);
}

// --- Copy & Watch Static Assets ---
const copyAndWatch = (source, dest) => {
  cpx.copy(source, dest, (err) => {
    if (err) console.error(`Error copying ${source}:`, err);
  });
  const watcher = cpx.watch(source, dest);
  watcher.on('copy', (e) => console.log(`Copied: ${e.srcPath} -> ${e.dstPath}`));
  watcher.on('remove', (e) => console.log(`Removed: ${e.path}`));
};

copyAndWatch('index.html', 'dist');
copyAndWatch('src/styles/**', 'dist/src/styles');
copyAndWatch('{manifest.json,sw.js,favicon.svg}', 'dist');
console.log('Static assets are being watched.');

// --- Serve & Watch Frontend ---
try {
  const frontendBuilder = await esbuild.context({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    loader: { '.tsx': 'tsx' },
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"development"',
    },
  });
  await frontendBuilder.watch();
  const { host, port } = await frontendBuilder.serve({
    servedir: 'dist',
    port: FRONTEND_DEV_PORT,
  });
  console.log(`\n🚀 Frontend server running at http://${host}:${port}`);
  console.log('Watching for frontend file changes...');
} catch (e) {
  console.error('Frontend dev server failed to start:', e);
  process.exit(1);
}