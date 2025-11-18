import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import process from 'process';
import { apiHandler } from './handler.js';
import * as crudHandler from './crudHandler.js';
import { getSettings, updateSettings } from './settingsHandler.js';
import { getMemory, updateMemory, clearMemory } from './memoryHandler.js';
import { getAvailableModelsHandler } from './modelsHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares

// Define CORS options
const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Version'],
};

// Explicitly handle pre-flight requests for all routes.
// This ensures the browser receives a valid CORS response before sending the actual API request.
app.options('*', cors(corsOptions)); 
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

// Version Check Middleware
const appVersion = process.env.APP_VERSION;
if (appVersion) {
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const clientVersion = req.header('X-Client-Version');
    if (clientVersion && clientVersion !== appVersion) {
      console.warn(`[VERSION_MISMATCH] Client: ${clientVersion}, Server: ${appVersion}.`);
      return res.status(409).json({
        error: 'version_mismatch',
        message: 'Your application version is out of date. Please refresh the page to get the latest version.',
      });
    }
    next();
  });
  console.log(`[SERVER] Running version: ${appVersion}`);
}

const staticPath = path.join(process.cwd(), 'dist');
const uploadsPath = process.env.VERCEL_ENV ? path.join('/tmp', 'data', 'uploads') : path.join(process.cwd(), 'data', 'uploads');

// API routes
app.get('/api/health', (req: Request, res: Response) => res.json({ status: 'ok' }));
app.get('/api/models', getAvailableModelsHandler);

// Streaming and complex tasks handler
app.post('/api/handler', apiHandler);
app.get('/api/handler', apiHandler);

// CRUD routes for chat history
app.get('/api/history', crudHandler.getHistory);
app.delete('/api/history', crudHandler.deleteAllHistory);
app.get('/api/chats/:chatId', crudHandler.getChat);
app.post('/api/chats/new', crudHandler.createNewChat);
app.put('/api/chats/:chatId', crudHandler.updateChat);
app.delete('/api/chats/:chatId', crudHandler.deleteChat);
app.post('/api/import', crudHandler.importChat);

// Settings routes
app.get('/api/settings', getSettings);
app.put('/api/settings', updateSettings);

// Memory routes
app.get('/api/memory', getMemory);
app.put('/api/memory', updateMemory);
app.delete('/api/memory', clearMemory);

// Serve static assets for the frontend and uploads
app.use(express.static(staticPath));
app.use('/uploads', express.static(uploadsPath));


// Catch-all route to serve index.html for Single Page Application (SPA) routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`[SERVER] Backend server is running on http://localhost:${PORT}`);
});