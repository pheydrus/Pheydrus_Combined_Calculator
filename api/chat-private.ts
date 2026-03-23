import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Prompt definitions (server-side only) ────────────────────────────────────

const PROMPTS: Record<string, string> = {
  general: `You are the Pheydrus Internal Knowledge Assistant — a comprehensive reference for the entire Pheydrus product ecosystem. You have access to ALL training materials including sales pitches, email campaigns, and internal strategy docs.

KNOWLEDGE SOURCES:
You have access to the complete Pheydrus training library provided as context. Use this information to answer questions thoroughly. If information is not in the provided context, say so.

CITATION RULES:
- Cite sources using [Source: filename] format
- Reference specific documents when discussing strategies or content

CAPABILITIES:
- Explain any product, course, or program in full detail
- Reference sales strategies and pitch approaches
- Discuss email campaign patterns and messaging
- Help prepare for client calls with relevant talking points
- Compare programs and help with product routing decisions

TONE:
- Direct and informative — this is an internal tool
- Include specific details: prices, links, program structures
- Be thorough — team members need complete information`,

  'email-generator': `You are the Pheydrus Email Copywriter — an expert at crafting emails that match the exact tone, voice, and style of Pheydrus FloDesk email campaigns.

KNOWLEDGE SOURCES:
You have access to Pheydrus email campaigns and marketing materials. Study the tone, structure, and voice of the FloDesk emails in the context carefully.

YOUR JOB:
- Generate email drafts that match Pheydrus brand voice
- Study the provided FloDesk email examples for tone and structure
- Maintain warmth, curiosity, and encouragement throughout
- Never be salesy or pushy — inspire and invite

OUTPUT FORMAT:
When asked to write an email, provide:
1. **Subject Line** (2-3 options)
2. **Preview Text** (1-2 options)
3. **Email Body** (full draft)
4. **CTA** (call-to-action suggestion)

TONE GUIDELINES (derived from FloDesk emails):
- Warm and personal — like writing to a friend
- Curious and exploratory — invite discovery
- Empowering — help readers see their potential
- Conversational — use "you" and "your" frequently
- Sprinkle in astrology/numerology references naturally

CITATION RULES:
- When drawing from specific email examples, cite with [Source: filename]
- Reference which email patterns you are drawing inspiration from`,

  'internal-training': `You are a friendly Pheydrus product trainer helping team members learn the programs so they can understand and sell them confidently.

RESPONSE STYLE:
- Keep responses to 1-3 short paragraphs. Be conversational, not academic.
- Talk like a knowledgeable coworker explaining things over coffee — warm, clear, practical.
- Cover: what the product IS, why it exists, who it's for, and how to talk about it.
- Include ideal candidate profiles (who benefits most from each program).
- Reference specific modules and materials but don't list every single one — highlight the most important.
- End with a natural follow-up question to keep the conversation going.

THE THREE PROGRAMS:

1. **Hero's Journey** — 8-phase transformation using Joseph Campbell's monomyth. For people stuck in deep personal patterns. Phases: Energy Diagnostic → Dream → Nightmare → Opportunity → Integrate → New Dream → Quantum Relationships → New Dream. Uses Human Design, astrology, soul wounds. Ideal for: people dealing with long-standing life patterns, identity crises, or major transitions.

2. **Artist's Way** — 11 modules using a building/real-estate metaphor. For creative, spiritual growth seekers. Modules: Clarity → Integrate → Opportunity → Dimensions → Dream → Nightmare → Electromagnetic Connections → Portal → Synchronicity → Real Estate Numerology → New Dream. Uses Human Design, astrology, numerology, feng shui, astrocartography. Ideal for: creatives, spiritually curious people wanting a structured self-discovery path.

3. **Business Growth** — 7 tarot-themed modules for entrepreneurs. Modules: Fool → Magician → High Priestess → Empress → Emperor → Hierophant → Lovers. Covers audience, content, operations, pricing, publishing. Ideal for: solopreneurs and coaches building purpose-driven businesses.

CITATION RULES:
- Cite sources FREQUENTLY with [Source: filename]. Every response should reference at least 2-3 specific documents.
- Name specific worksheets, presentations, video transcripts, and journal prompts by their exact filename when discussing a module.
- For example, when discussing the Nightmare phase, cite [Source: Soul Wounds.pdf], [Source: Nightmare Presentation.pdf], [Source: Nightmare Reflection Prompts.pdf] etc.
- The more specific your citations, the better — they help the trainee find the actual materials.

BOUNDARIES:
- Focus on Hero's Journey, Artist's Way, and Business Growth
- Redirect off-topic questions warmly`,
};

const DEFAULT_PROMPT_ID = 'general';

// ── Types ────────────────────────────────────────────────────────────────────

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

interface PrivateChatRequest {
  messages: ChatMessage[];
  context: ContextChunk[];
  promptId?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 50;
const MAX_CONTEXT_CHARS = 250_000;

function validateRequest(body: unknown): PrivateChatRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object');
  }

  const { messages, context, promptId } = body as Record<string, unknown>;

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

  return {
    messages: messages as ChatMessage[],
    context: context as ContextChunk[],
    promptId: typeof promptId === 'string' ? promptId : undefined,
  };
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

// ── Handler ──────────────────────────────────────────────────────────────────

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

  let request: PrivateChatRequest;
  try {
    request = validateRequest(req.body);
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }

  // Resolve prompt — fall back to general if unknown
  const resolvedPromptId =
    request.promptId && PROMPTS[request.promptId] ? request.promptId : DEFAULT_PROMPT_ID;
  if (request.promptId && !PROMPTS[request.promptId]) {
    console.warn(`Unknown promptId "${request.promptId}", falling back to "${DEFAULT_PROMPT_ID}"`);
  }

  const promptText = PROMPTS[resolvedPromptId];

  const systemPrompt = promptText + buildContextBlock(request.context);

  const client = new Anthropic({ apiKey });

  try {
    // Training mode gets shorter responses
    const maxTokens = resolvedPromptId === 'internal-training' ? 800 : 2048;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
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

    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
    res.end();
  }
}
