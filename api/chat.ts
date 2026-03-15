import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are the Pheydrus Knowledge Assistant — a warm, knowledgeable guide who helps people understand Pheydrus courses, programs, and offerings in astrology, numerology, human design, and personal development.

KNOWLEDGE SOURCES:
You have access to Pheydrus training materials provided as context below. Use ONLY this information to answer questions. If you don't have enough information in the provided context, say so honestly — do not make up information.

CITATION RULES:
- When referencing specific information, cite the source using [Source: filename] format
- Always ground your answers in the provided documents
- If multiple sources are relevant, cite all of them
- Place citations naturally at the end of the relevant sentence or paragraph

TONE & STYLE:
- Conversational but informative — like a knowledgeable friend
- Warm and curious, never salesy or pushy
- When teaching program details, use structured lists for clarity
- Keep responses concise (2-4 paragraphs unless the user asks for more detail)
- React to what the user shares before moving to new topics

PRODUCT RECOMMENDATIONS:
- When recommending products, always include the exact name, price, and what it covers
- Follow the waterfall rule: recommend the smallest helpful next step first (Training → Course → 1:1 Call → Full Program)
- Never pressure — present options and let the user decide

BOUNDARIES:
- Only answer questions related to Pheydrus content, astrology, numerology, human design, feng shui, personal development, and the courses/products in your knowledge base
- For off-topic questions, warmly redirect: "That's outside my area of expertise, but I'd love to help you with anything about Pheydrus programs, astrology, or numerology!"
- Never fabricate course content, prices, or program details not in your sources`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ContextChunk {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context: ContextChunk[];
}

const MAX_MESSAGES = 50;
const MAX_CONTEXT_CHARS = 250_000; // ~62K tokens

function validateRequest(body: unknown): ChatRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object');
  }

  const { messages, context } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }

  if (messages.length > MAX_MESSAGES) {
    throw new Error(`Too many messages (max ${MAX_MESSAGES})`);
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object' || !('role' in msg) || !('content' in msg)) {
      throw new Error('Each message must have role and content');
    }
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      throw new Error('Message role must be "user" or "assistant"');
    }
    if (typeof msg.content !== 'string' || msg.content.length > 10_000) {
      throw new Error('Message content must be a string under 10,000 chars');
    }
  }

  if (!Array.isArray(context)) {
    throw new Error('context must be an array');
  }

  const totalContextChars = context.reduce(
    (sum: number, c: ContextChunk) => sum + (c.content?.length || 0),
    0
  );
  if (totalContextChars > MAX_CONTEXT_CHARS) {
    throw new Error('Context too large');
  }

  return { messages: messages as ChatMessage[], context: context as ContextChunk[] };
}

function buildContextBlock(context: ContextChunk[]): string {
  if (context.length === 0) return '';

  const grouped = new Map<string, ContextChunk[]>();
  for (const chunk of context) {
    const cat = chunk.category || 'General';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(chunk);
  }

  let block = '\n\n--- KNOWLEDGE BASE CONTEXT ---\n\n';
  for (const [category, chunks] of grouped) {
    block += `## ${category}\n\n`;
    for (const chunk of chunks) {
      block += `### ${chunk.title}\n${chunk.content}\n\n`;
    }
  }
  block += '--- END CONTEXT ---';
  return block;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  let request: ChatRequest;
  try {
    request = validateRequest(req.body);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  const systemPrompt = SYSTEM_PROMPT + buildContextBlock(request.context);

  const client = new Anthropic({ apiKey });

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Claude API error:', err);

    if (!res.headersSent) {
      const message =
        err instanceof Anthropic.APIError
          ? `Claude API error: ${err.message}`
          : 'An unexpected error occurred';
      return res.status(502).json({ error: message });
    }

    // If headers already sent (mid-stream error), send error event
    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    res.end();
  }
}
