
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import fs from 'fs';
import { initApp } from './app.js';
import { HISTORY_PATH } from './data-store.js';

const startServer = async () => {
  const app = await initApp();
  const PORT = Number(process.env.PORT) || 3001;

  // Serve static files (Frontend)
  const staticPath = path.join((process as any).cwd(), 'dist');
  
  // 1. Serve 'dist' folder content for root requests
  app.use('/*', serveStatic({ root: './dist' }));

  // 2. Serve uploads/history
  app.use('/uploads/*', async (c, next) => {
    // Manually map /uploads/... to data/history/...
    const urlPath = c.req.path.replace('/uploads', '');
    const filePath = path.join(HISTORY_PATH, urlPath);
    
    if (fs.existsSync(filePath)) {
        // Simple manual file serving for dynamic content outside 'dist'
        // In a real prod setup, use a proper static middleware or nginx
        const content = fs.readFileSync(filePath);
        // Determine mime type roughly
        let mime = 'application/octet-stream';
        if (filePath.endsWith('.png')) mime = 'image/png';
        if (filePath.endsWith('.mp4')) mime = 'video/mp4';
        if (filePath.endsWith('.json')) mime = 'application/json';
        
        c.header('Content-Type', mime);
        return c.body(content);
    }
    await next();
  });

  // 3. SPA Fallback (if no static file matched, serve index.html)
  app.get('*', serveStatic({ path: './dist/index.html' }));

  console.log(`[SERVER] Backend server is running on http://localhost:${PORT}`);

  serve({
    fetch: app.fetch,
    port: PORT
  });
};

startServer().catch(console.error);