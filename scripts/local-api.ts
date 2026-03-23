/**
 * Minimal local API server for running Vercel serverless functions during development.
 * Vite proxies /api/* requests here.
 *
 * Usage: npx tsx scripts/local-api.ts
 */

import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PORT = 3002;

const server = http.createServer(async (req, res) => {
  // Parse URL
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const route = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Collect body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  // Build fake Vercel request/response
  const vercelReq = {
    method: req.method,
    headers: req.headers,
    body: body ? JSON.parse(body) : undefined,
  };

  try {
    let handler;
    if (route === '/api/chat') {
      handler = (await import('../api/chat.js')).default;
    } else if (route === '/api/chat-private') {
      handler = (await import('../api/chat-private.js')).default;
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // Wrap res to be Vercel-compatible
    const vercelRes = {
      _headers: {} as Record<string, string>,
      _statusCode: 200,
      setHeader(key: string, value: string) {
        vercelRes._headers[key] = value;
        res.setHeader(key, value);
      },
      status(code: number) {
        vercelRes._statusCode = code;
        return vercelRes;
      },
      json(data: unknown) {
        res.writeHead(vercelRes._statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      },
      write(chunk: string) {
        if (!res.headersSent) {
          res.writeHead(vercelRes._statusCode, vercelRes._headers);
        }
        res.write(chunk);
      },
      end() {
        res.end();
      },
      get headersSent() {
        return res.headersSent;
      },
    };

    await handler(vercelReq, vercelRes);
  } catch (err) {
    console.error('Handler error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
  console.log(`Routes: /api/chat, /api/chat-private`);
});
