import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
  });
}

// Vite plugin: serves /api/workbook-pdf (Puppeteer) and
//              /api/submit-profile (Notion) during dev
function workbookPdfPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'workbook-pdf',
    configureServer(server: ViteDevServer) {

      // ── Notion profile submission ──────────────────────────────────────
      server.middlewares.use(
        '/api/submit-profile',
        async (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Content-Type', 'application/json');
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const body = await readBody(req);
            const { firstName, lastName, email } = JSON.parse(body) as {
              firstName?: string; lastName?: string; email?: string;
            };

            if (!firstName || !lastName || !email) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'firstName, lastName and email are required' }));
              return;
            }

            const apiKey = env.NOTION_API_KEY;
            const dbId   = env.NOTION_CLIENTS_DB_ID;
            if (!apiKey || !dbId) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Notion env vars not set' }));
              return;
            }

            const notionRes = await fetch('https://api.notion.com/v1/pages', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                parent: { database_id: dbId },
                properties: {
                  'Client Last Name': {
                    title: [{ text: { content: lastName } }],
                  },
                  'Client First Name': {
                    rich_text: [{ text: { content: firstName } }],
                  },
                  'Client Email': {
                    email,
                  },
                  'AW, BG, or HJ Student': {
                    rich_text: [{ text: { content: 'BG' } }],
                  },
                },
              }),
            });

            if (!notionRes.ok) {
              const err = await notionRes.text();
              console.error('[submit-profile] Notion error:', err);
              res.statusCode = 502;
              res.end(JSON.stringify({ error: 'Notion API error', detail: err }));
              return;
            }

            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            console.error('[submit-profile]', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        }
      );

      // ── Puppeteer PDF generation ───────────────────────────────────────
      server.middlewares.use(
        '/api/workbook-pdf',
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          (async () => {
            const rawBody = await readBody(req);
            let textareas: string[] = [];
            let inputs: string[] = [];
            try {
              const parsed = JSON.parse(rawBody) as { textareas?: string[]; inputs?: string[] };
              textareas = parsed.textareas ?? [];
              inputs    = parsed.inputs    ?? [];
            } catch { /* malformed body — use empty arrays */ }

            let browser;
            try {
              const { default: puppeteer } = await import('puppeteer');
              browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
              });

              const page = await browser.newPage();
              const htmlPath = path.resolve(__dirname, 'public', 'pheydrus-workbook-v3_4.html');
              await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30_000 });

              // Inject user-filled form values before rendering
              if (textareas.length > 0 || inputs.length > 0) {
                await page.evaluate(
                  ({ taValues, inValues }: { taValues: string[]; inValues: string[] }) => {
                    document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((el, i) => {
                      if (taValues[i] !== undefined) el.value = taValues[i];
                    });
                    document.querySelectorAll<HTMLInputElement>('input').forEach((el, i) => {
                      if (inValues[i] !== undefined) el.value = inValues[i];
                    });
                  },
                  { taValues: textareas, inValues: inputs }
                );
              }

              const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
              });

              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename="pheydrus-workbook-v3_4.pdf"');
              res.end(pdf);
            } catch (err) {
              console.error('[workbook-pdf]', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            } finally {
              if (browser) await browser.close().catch(() => {});
            }
          })();
        }
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [tailwindcss(), react(), workbookPdfPlugin(env)],
    optimizeDeps: {
      exclude: ['sweph-wasm'],
    },
  };
});
