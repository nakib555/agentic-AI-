
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiHandler } from './handler.js';
import * as crudHandler from './crudHandler.js';
import { getSettings, updateSettings } from './settingsHandler.js';
import { getMemory, updateMemory, clearMemory } from './memoryHandler.js';
import { getAvailableModelsHandler } from './modelsHandler.js';
import { initDataStore } from './data-store.js';

// Initialize core Hono app
const app = new Hono();

// Global Middleware
app.use('/*', cors({
  origin: (origin) => origin || '*', 
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Version'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Version Check Middleware
app.use('/api/*', async (c, next) => {
  // @ts-ignore
  const appVersion = typeof process !== 'undefined' ? process.env.APP_VERSION : c.env?.APP_VERSION;
  // @ts-ignore
  const disableCheck = typeof process !== 'undefined' ? process.env.DISABLE_VERSION_CHECK : c.env?.DISABLE_VERSION_CHECK;

  if (appVersion && disableCheck !== 'true') {
    const clientVersion = c.req.header('X-Client-Version');
    if (clientVersion && clientVersion !== appVersion) {
      console.warn(`[VERSION_MISMATCH] Client: ${clientVersion}, Server: ${appVersion}.`);
      return c.json({
        error: 'version_mismatch',
        message: 'Your application version is out of date. Please refresh the page to get the latest version.',
      }, 409);
    }
  }
  await next();
});

// Initialization route (optional, but good for cold starts)
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Model Routes
app.get('/api/models', getAvailableModelsHandler);

// Handler Route (Chat, Tools, TTS, etc.)
app.post('/api/handler', apiHandler);
app.get('/api/handler', apiHandler); // Support GET for SSE if needed later

// History CRUD
app.get('/api/history', crudHandler.getHistory);
app.delete('/api/history', crudHandler.deleteAllHistory);
app.get('/api/chats/:chatId', crudHandler.getChat);
app.post('/api/chats/new', crudHandler.createNewChat);
app.put('/api/chats/:chatId', crudHandler.updateChat);
app.delete('/api/chats/:chatId', crudHandler.deleteChat);
app.post('/api/import', crudHandler.importChat);

// Settings
app.get('/api/settings', getSettings);
app.put('/api/settings', updateSettings);

// Memory
app.get('/api/memory', getMemory);
app.put('/api/memory', updateMemory);
app.delete('/api/memory', clearMemory);

// Initializer function for Node environment
export const initApp = async () => {
  await initDataStore();
  return app;
};

export default app;
