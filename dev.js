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
    The backend server requires the Gemini API key to be set as an environment variable.
    Please create a '.env' file in the project root and add: API_KEY="YOUR_GEMINI_API_KEY_HERE"
  `);
  process.exit(1);
}

// --- Cleanup ---
await rm('dist', { recursive: true, force: true }).catch(() => {});
console.log('Cleaned dist directory.');

let nodeProcess = null;

// --- Backend Server Management ---
const startNodeServer = () => {
  if (nodeProcess) {
    console.log('Restarting backend server...');
    nodeProcess.kill('SIGTERM');
  }
  nodeProcess = spawn('node', ['--enable-source-maps', 'dist/server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: BACKEND_PORT.toString() },
  });
};

// --- Build & Watch Backend ---
try {
  const backendBuilder = await esbuild.context({
    entryPoints: ['backend/server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist/server.js',
    sourcemap: true,
  });
  await backendBuilder.watch({
      onRebuild(error) {
        if (error) console.error('Backend rebuild failed:', error);
        else startNodeServer();
      },
  });
  console.log('Backend watcher active.');
  startNodeServer(); // Initial start
} catch (e) {
  console.error('Initial backend build failed:', e);
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
  console.log('Watching for file changes...');
} catch (e) {
  console.error('Frontend dev server failed to start:', e);
  process.exit(1);
}
