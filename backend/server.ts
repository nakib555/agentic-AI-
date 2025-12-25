import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiHandler } from './handler.js';
import * as crudHandler from './crudHandler.js';
import { getSettings, updateSettings } from './settingsHandler.js';
import { getMemory, updateMemory, clearMemory } from './memoryHandler.js';
import { getAvailableModelsHandler } from './modelsHandler.js';
import { initDataStore, HISTORY_PATH } from './data-store.js';

// Determine directory for static files safely across ESM (Dev) and CJS (Prod)
let serverDir: string;
try {
  // In ESM environment (Dev)
  if (import.meta && import.meta.url) {
    const currentFile = fileURLToPath(import.meta.url);
    serverDir = path.dirname(currentFile);
  } else {
    throw new Error('CJS environment detected');
  }
} catch (e) {
  // In CJS bundle environment (Prod), or if import.meta.url is undefined
  // We assume the server is running from project root (via npm start) and static files are in dist/
  serverDir = path.join((process as any).cwd(), 'dist');
}

async function startServer() {
  // --- Initialize Data Store ---
  await initDataStore();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middlewares
  const corsOptions = {
    origin: '*', // Allow all origins to support split frontend/backend hosting (e.g. Cloudflare + Render)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Version'],
  };

  app.options('*', cors(corsOptions) as any);
  app.use(cors(corsOptions) as any);
  app.use(express.json({ limit: '50mb' }) as any);

  // Version Check Middleware
  const appVersion = process.env.APP_VERSION;
  if (appVersion) {
    app.use('/api', ((req: any, res: any, next: any) => {
      const clientVersion = req.header('X-Client-Version');
      if (clientVersion && clientVersion !== appVersion) {
         // console.warn(`[VERSION_MISMATCH] Client: ${clientVersion}, Server: ${appVersion}.`);
      }
      next();
    }) as any);
    console.log(`[SERVER] Running version: ${appVersion}`);
  }

  // API routes
  app.get('/api/health', ((req: any, res: any) => res.json({ status: 'ok', mode: 'api-only', version: appVersion })) as any);
  
  app.get('/api/models', getAvailableModelsHandler as any);

  app.post('/api/handler', apiHandler as any);
  app.get('/api/handler', apiHandler as any);

  app.get('/api/history', crudHandler.getHistory as any);
  app.delete('/api/history', crudHandler.deleteAllHistory as any);
  app.get('/api/chats/:chatId', crudHandler.getChat as any);
  app.post('/api/chats/new', crudHandler.createNewChat as any);
  app.put('/api/chats/:chatId', crudHandler.updateChat as any);
  app.delete('/api/chats/:chatId', crudHandler.deleteChat as any);
  app.post('/api/import', crudHandler.importChat as any);

  app.get('/api/settings', getSettings as any);
  app.put('/api/settings', updateSettings as any);

  app.get('/api/memory', getMemory as any);
  app.put('/api/memory', updateMemory as any);
  app.delete('/api/memory', clearMemory as any);

  // Mount the HISTORY_PATH to /uploads so that files in data/history/{folder}/file/ are accessible.
  app.use('/uploads', express.static(HISTORY_PATH) as any);

  // Serve static files from the current directory (dist) if they exist
  const indexHtmlPath = path.join(serverDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
      app.use(express.static(serverDir, {
        setHeaders: (res, filePath) => {
           if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
               res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
           }
        }
      }));
      
      // Handle SPA routing: Serve index.html for any unknown non-API routes
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ error: 'API route not found' });
        }
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(indexHtmlPath);
      });
  } else {
      console.log('[SERVER] Static files not found. Running in API-only mode.');
      app.get('/', (req, res) => {
          res.json({ 
              status: 'online', 
              message: 'Agentic AI Backend is running.',
              note: 'Frontend should be deployed separately (e.g., Cloudflare Pages).' 
          });
      });
  }

  // Global Error Handler
  app.use(((err: any, req: any, res: any, next: any) => {
    console.error('[SERVER] Unhandled Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }) as any);

  app.listen(PORT, () => {
    console.log(`[SERVER] Backend API is running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  (process as any).exit(1);
});