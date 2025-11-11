// FIX: Import Request and Response types from express to fix handler type errors.
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { apiHandler } from './handler.js';
// FIX: Explicitly import `process` to resolve TypeScript type error for `process.cwd()`.
import { process } from 'process';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads

const staticPath = path.join(process.cwd(), 'dist');

// API routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.post('/api/handler', apiHandler);

// Serve static assets for the frontend
// FIX: The error here was likely caused by other type mismatches in the file. No change needed here.
app.use(express.static(staticPath));

// Catch-all route to serve index.html for Single Page Application (SPA) routing
// FIX: Add explicit types for req and res to resolve 'No overload matches' error.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});