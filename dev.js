import esbuild from 'esbuild';
import { spawn } from 'child_process';
import cpx from 'cpx';
import 'dotenv/config';
import { rm } from 'fs/promises';
import path from 'path';

// --- Configuration ---
const FRONTEND_DEV_PORT = 8000;
const BACKEND_PORT = 3001;

// --- Set Default Version for Dev Mode ---
// This ensures that local frontend and backend always match, preventing version mismatch errors during development.
process.env.APP_VERSION = process.env.APP_VERSION || 'dev';

console.log('Starting development environment...');

// --- API Key Check ---
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(`
    \x1b[31m[DEV-SERVER ERROR]\x1b[0m API key is missing.
    The backend server requires the Gemini API key to be set.
    Please create a '.env' file in the project root and add: API_KEY="YOUR_GEMINI_API_KEY_HERE"
  `);
  process.exit(1);
}

// --- Cleanup ---
await rm('dist', { recursive: true, force: true }).catch(() => {});
console.log('Cleaned dist directory.');

// --- Run Backend Server with Nodemon + ts-node ---
try {
  console.log('Starting backend server in development mode...');
  const nodemonProcess = spawn('npx', [
    'nodemon',
    '--watch', 'backend',
    '--ext', 'ts',
    '--exec', 'node --loader ts-node/esm backend/server.ts'
  ], {
    stdio: 'inherit',
    shell: true, // Use shell to correctly resolve `npx` on different systems
    env: { ...process.env, PORT: BACKEND_PORT.toString() }
  });

  nodemonProcess.on('error', (err) => {
    console.error('\x1b[31m[Nodemon Error]\x1b[0m Failed to start nodemon:', err);
    process.exit(1);
  });
} catch (e) {
  console.error('Failed to initialize backend server:', e);
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
copyAndWatch('src/styles/**', 'dist/styles');
copyAndWatch('{manifest.json,sw.js,favicon.svg}', 'dist');
console.log('Static assets are being watched.');

// --- Start Tailwind CSS Watcher ---
console.log('Starting Tailwind CSS watcher...');
const tailwindProcess = spawn('npx', ['tailwindcss', '-i', './src/styles/main.css', '-o', './dist/styles/main.css', '--watch'], {
    stdio: 'inherit',
    shell: true
});

tailwindProcess.on('error', (err) => {
    console.error('\x1b[31m[Tailwind Error]\x1b[0m Failed to start Tailwind watcher:', err);
});

// --- Serve & Watch Frontend ---
try {
  const frontendBuilder = await esbuild.context({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    loader: { 
      '.tsx': 'tsx', 
      '.ts': 'ts', 
      '.json': 'json',
      '.woff': 'file',
      '.woff2': 'file',
      '.ttf': 'file',
      '.eot': 'file'
    },
    sourcemap: true,
    define: {
      'process.env.NODE_ENV': '"development"',
      'process.env.APP_VERSION': JSON.stringify(process.env.APP_VERSION),
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