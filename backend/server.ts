// FIX: Import Request and Response types from express to fix handler type errors.
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
// FIX: Import process to resolve 'Property "cwd" does not exist on type "Process"' error.
import process from 'process';
import { apiHandler } from './handler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middlewares ----
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads

// Define static path for serving frontend files
const staticPath = path.join(process.cwd(), 'dist');

// ---- API Routes ----
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.post('/api/handler', apiHandler);

// ---- Frontend (Static Files) ----
app.use(express.static(staticPath));

// Catch-all route for SPA routing (React, Vue, etc.)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// ---- Start Server ----
app.listen(PORT, () => {
  console.log(`✅ Backend server listening on http://localhost:${PORT}`);
});
