import esbuild from 'esbuild';
import cpx from 'cpx';
import { rm, readFile, writeFile, mkdir } from 'fs/promises';
import 'dotenv/config';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

console.log('Starting build process...');

// Look for API_KEY or GEMINI_API_KEY
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

// Robustly check for the API key and provide a clear error message if it's missing.
if (!apiKey) {
  console.error(`
    \x1b[31m[BUILD ERROR]\x1b[0m API key is missing.
    
    To fix this, you need to provide your Gemini API key as an environment variable.
    
    \x1b[33mFor Local Development:\x1b[0m
    1. Create a file named '.env' in the root of your project.
    2. Add one of the following lines to it:
       API_KEY="YOUR_GEMINI_API_KEY_HERE"
       or
       GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    
    \x1b[33mFor Deployment (e.g., Cloudflare Pages):\x1b[0m
    1. Go to your project's settings in your deployment provider.
    2. Find the 'Environment Variables' section.
    3. Add a new variable named either 'API_KEY' or 'GEMINI_API_KEY' with your key as the value.
    
    The build will not proceed without the API key.
  `);
  process.exit(1);
}


try {
  // Clean the dist directory
  await rm('dist', { recursive: true, force: true });
  await mkdir('dist', { recursive: true });
  console.log('Cleaned dist directory.');

  // Build CSS with Tailwind
  console.log('Building Tailwind CSS...');
  const css = await readFile('index.css', 'utf8');
  const result = await postcss([tailwindcss, autoprefixer]).process(css, {
    from: 'index.css',
    to: 'dist/index.css',
  });
  await writeFile('dist/index.css', result.css);
  console.log('Tailwind CSS build complete.');

  // Run esbuild
  await esbuild.build({
    entryPoints: ['index.tsx'],
    bundle: true,
    outfile: 'dist/index.js',
    loader: { '.tsx': 'tsx' },
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    logLevel: 'info',
  });
  console.log('esbuild bundling complete.');

  // Copy static files
  const copyFiles = (source, dest) => {
    return new Promise((resolve, reject) => {
      cpx.copy(source, dest, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Copied ${source} to ${dest}`);
          resolve();
        }
      });
    });
  };

  await copyFiles('index.html', 'dist');
  await copyFiles('src/styles/**', 'dist/src/styles');
  await copyFiles('{manifest.json,sw.js,favicon.svg,_headers,_redirects}', 'dist');
  
  console.log('Build process completed successfully!');

} catch (e) {
  console.error('Build process failed:', e);
  process.exit(1);
}