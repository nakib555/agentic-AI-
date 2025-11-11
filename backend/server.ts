// Fix: Add Node.js type reference to resolve errors with 'Buffer' and 'process'.
/// <reference types="node" />

import http from 'http';
import path from 'path';
import fs from 'fs';
import { parse } from 'url';
import handler from './handler';

const PORT = process.env.PORT || 3001;

const getContentType = (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'application/javascript';
        case '.json': return 'application/json';
        case '.png': return 'image/png';
        case '.jpg': return 'image/jpeg';
        case '.jpeg': return 'image/jpeg';
        case '.svg': return 'image/svg+xml';
        case '.ico': return 'image/x-icon';
        case '.webmanifest': return 'application/manifest+json';
        default: return 'application/octet-stream';
    }
};

const server = http.createServer(async (req, res) => {
    // Set CORS headers to allow cross-origin requests from any domain.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    const parsedUrl = parse(req.url || '/', true);

    if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/api/handler')) {
        const fullUrl = `http://${req.headers.host}${req.url}`;
        
        const getBody = () => new Promise<Buffer>((resolve, reject) => {
            const bodyParts: Uint8Array[] = [];
            req.on('data', (chunk) => bodyParts.push(chunk));
            req.on('error', (err) => reject(err));
            req.on('end', () => resolve(Buffer.concat(bodyParts)));
        });

        const hasBody = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH';
        const body = hasBody ? await getBody() : null;

        const mockRequest = new Request(fullUrl, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: body,
        });

        try {
            const response = await handler.fetch(mockRequest);
            res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
            if (response.body) {
                for await (const chunk of response.body as any) {
                    res.write(chunk);
                }
            }
            res.end();
        } catch (e) {
            console.error('Handler error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    } else {
        // --- Static File Serving (for production 'start' script) ---
        let pathname = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname || '/index.html';
        
        // Sanitize pathname to prevent directory traversal
        pathname = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');

        const filePath = path.join(process.cwd(), 'dist', pathname);

        fs.readFile(filePath, (err, content) => {
            if (err) {
                 // For SPA routing, serve index.html on 404
                fs.readFile(path.join(process.cwd(), 'dist', 'index.html'), (err2, content2) => {
                    if (err2) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content2);
                    }
                });
            } else {
                res.writeHead(200, { 'Content-Type': getContentType(filePath) });
                res.end(content);
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
});