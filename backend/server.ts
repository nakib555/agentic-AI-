import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiHandler } from './handler.js';
import * as crudHandler from './crudHandler.js';
import { getSettings, updateSettings } from './settingsHandler.js';
import { getMemory, updateMemory, clearMemory } from './memoryHandler.js';
import { getAvailableModelsHandler } from './modelsHandler.js';
import { initDataStore, HISTORY_PATH } from './data-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // --- Initialize Data Store ---
  await initDataStore();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middlewares
  const corsOptions = {
    origin: '*', // In production, replace '*' with your Cloudflare domain (e.g., 'https://myapp.pages.dev')
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
      // Optional: Strict version checking can be problematic if deployments aren't perfectly synced.
      // You might want to loosen this for separate deployments.
      if (clientVersion && clientVersion !== appVersion) {
         // console.warn(`[VERSION_MISMATCH] Client: ${clientVersion}, Server: ${appVersion}.`);
      }
      next();
    }) as any);
    console.log(`[SERVER] Running version: ${appVersion}`);
  }

  // API routes
  app.get('/api/health', ((req: any, res: any) => res.json({ status: 'ok', mode: 'api-only' })) as any);
  
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
  // Note: On Render (free tier), the filesystem is ephemeral. Files uploaded here will be lost on redeploy
  // unless you attach a Render Disk to '/usr/src/app/data'.
  app.use('/uploads', express.static(HISTORY_PATH) as any);

  // Serve static files from the current directory (dist)
  // This allows the backend to serve the frontend bundle
  app.use(express.static(__dirname));

  // Handle SPA routing: Serve index.html for any unknown non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
  });

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