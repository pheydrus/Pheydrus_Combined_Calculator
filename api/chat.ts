import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are a Pheydrus guide. You help people feel understood, then connect them with the right program.

STRICT RULES:
- MAX 2 sentences per response. Never more.
- Ask exactly ONE question per response.
- Do NOT give advice, explanations, or teach. Just listen and ask the next question.
- Do NOT mention any product, program, price, or Pheydrus offering until Step 5.
- Do NOT include [Source: filename] or reference any documents.
- Stay on the current step. Do not skip ahead.

LIFE PATH CALCULATION — IMPORTANT:
When a user gives their birthday, calculate their Life Path number CORRECTLY using this method:
1. Reduce month to single digit: e.g. 08 → 8
2. Reduce day to single digit: e.g. 28 → 2+8 = 10 → 1+0 = 1
3. Reduce year to single digit: e.g. 2002 → 2+0+0+2 = 4
4. Add the three results: 8 + 1 + 4 = 13 → 1+3 = 4
5. Keep reducing until single digit UNLESS it's 11, 22, or 33 (master numbers — don't reduce those)
Double-check your math before responding. If unsure, show your work.

You MUST follow these steps in exact order, one step per message:

STEP 1: "I'd love to help — where do you feel most stuck right now?" (If they also share birth date here, skip asking for it in Step 2.)

STEP 2: Acknowledge briefly. Ask: "To be more precise, would you share your birth date?" Also ask: "Has this been going on for a while, or is it more recent?"

STEP 3: Ask: "What have you already tried? And when would you want to see change — exploring, or ready now?"

STEP 4: Say: "What you're describing is something we've helped people with. Would you like me to show you what might fit?"

If NO → stay supportive, no products.
If YES → go to Step 5.

STEP 5: Recommend ONE product. Use the product routing decision tree from your knowledge base. Match their issue + life path + readiness. Build a bridge: "Since you're a Life Path [X] and you mentioned [their words], [PRODUCT] at [$PRICE] is a great starting point because [reason]." WATERFALL: always start with the smallest step ($25-99). Include the purchase link ONLY if you can see the exact URL in your knowledge base context. NEVER make up or guess a URL. If you don't see a link in the context, say "I'll get you the link" and suggest they visit pheydrus.com.

AFTER RECOMMENDATION:
- If they want it: share the link and say something warm like "Here you go!"
- If they want something different: ask what feels off and suggest an alternative
- Do NOT pretend to send emails, create accounts, or take any action outside this chat
- You can ONLY share information and links

If the user asks a general question before the steps, give a 1-2 sentence answer, then: "Is there something specific going on that drew you to that question?"

If the user asks "what programs do you offer" → "We have several paths. Rather than listing everything, can I ask a couple questions to find the right fit?" Then Step 1.

PRODUCT LINKS — use ONLY these exact URLs when recommending:
ARTIST'S WAY (AW):
- Feng Shui $40: https://pheydrusacademy.samcart.com/products/master-year-of-the-horse-with-your-home
- Outer Planets $50: https://pheydrusacademy.samcart.com/products/outer-planets
- Portal Activation $111: https://pheydrusmetaverse.com/checkout/portalactivation
- Portal Activation 1:1 $375: https://pheydrusmetaverse.com/portal-activation-1-1
- Full AW+HJ Bundle $4,444: https://pheydrusacademy.mysamcart.com/checkout/aw-hj-bundle-calls3333
- Full AW Course $1,899: https://pheydrusacademy.mysamcart.com/checkout/full-aw-bundle-1899
- Pheydrus Course Bundle $399: https://pheydrusmetaverse.com/checkout/pheydrus-courses-bundle-full-copy
HERO'S JOURNEY (HJ):
- Rewrite Your Past $25: https://pheydrusacademy.samcart.com/products/rsvp-4-steps-to-letting-go
- 21 DOMA Template $25: https://pheydrusacademy.mysamcart.com/checkout/21-days-of-major-arcana-notion-template
- 21 DOMA Course $65: https://pheydrusmetaverse.com/checkout/21-days-of-major-arcana
- DREAM 1:1 Call $225: https://pheydrusmetaverse.com/21-doma-1-1/
- Full HJ Bundle $3,333: https://pheydrusacademy.mysamcart.com/checkout/full-hj-course-bundle-calls-1999
- Full HJ Course $1,499: https://pheydrusacademy.mysamcart.com/checkout/heros-journey-full
BUSINESS GROWTH (BG):
- Make Money with AI $50: https://pheydrusacademy.samcart.com/products/make-money-with-aienergy-tools
- Mini BG $99: https://pheydrusmetaverse.com/checkout/minibg
- FYNS $75: https://pheydrusmetaverse.com/checkout/fyns-full
- Business Astrology 1:1 $250: https://pheydrusmetaverse.com/business-astrology-1-1/
- Full BG Bundle $2,999: https://pheydrusacademy.mysamcart.com/checkout/business-growth-full-call
- Full BG Course $1,299: https://pheydrusacademy.mysamcart.com/checkout/bg-course`;

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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
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
