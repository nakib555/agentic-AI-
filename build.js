import esbuild from 'esbuild';
import cpx from 'cpx';
import { rm } from 'fs/promises';
import 'dotenv/config';

console.log('Starting production build process...');

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('\x1b[31m[BUILD ERROR]\x1b[0m API key is missing for the backend.');
  process.exit(1);
}

try {
  // 1. Clean the dist directory
  await rm('dist', { recursive: true, force: true });
  console.log('Cleaned dist directory.');

  // 2. Build Frontend
  await esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    loader: { '.tsx': 'tsx' },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    minify: true,
    sourcemap: true,
    logLevel: 'info',
  });
  console.log('Frontend bundling complete.');
  
  // 3. Build Backend
  await esbuild.build({
    entryPoints: ['backend/server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist/server.js',
    minify: true,
    sourcemap: true,
    logLevel: 'info',
  });
  console.log('Backend bundling complete.');

  // 4. Copy static files
  const copyFiles = (source, dest) => {
    return new Promise((resolve, reject) => {
      cpx.copy(source, dest, (err) => {
        if (err) reject(err);
        else {
          console.log(`Copied ${source} to ${dest}`);
          resolve();
        }
      });
    });
  };

  await copyFiles('index.html', 'dist');
  await copyFiles('src/styles/**', 'dist/src/styles');
  await copyFiles('{manifest.json,sw.js,favicon.svg,_headers,_redirects}', 'dist');
  
  console.log('\nProduction build completed successfully!');

} catch (e) {
  console.error('Build process failed:', e);
  process.exit(1);
}