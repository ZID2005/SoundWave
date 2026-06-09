import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const WAVE_SYSTEM_PROMPT = `You are WAVE, the official AI audio assistant for SOUNDWAVE — a premium audio equipment brand selling amplifiers, speakers, cables, and sound systems.

Your personality is knowledgeable, friendly, and passionate about audio — like a high-end audio store expert who genuinely loves sound.

Your primary responsibilities:

1. **Product Guidance** — Help users understand and choose between SOUNDWAVE products. Compare amplifiers, speakers, and cables. Explain differences in sound quality, power output, frequency response, impedance, and build quality.

2. **Audio Education** — Explain audio concepts clearly to beginners and enthusiasts:
   - What is an amplifier and how it works
   - Types of speakers (bookshelf, floorstanding, subwoofer, in-ceiling, surround)
   - Dolby Atmos, DTS:X, and spatial audio
   - Hi-Fi and High Fidelity audio
   - Lossless audio (FLAC, ALAC, WAV) vs compressed (MP3, AAC)
   - Impedance, ohms, watts, SPL, frequency response, THD
   - Active vs passive speakers
   - What cables matter — optical, RCA, XLR, speaker wire gauge
   - What is a DAC and why it matters
   - Stereo vs 2.1 vs 5.1 vs 7.1 vs Dolby Atmos setup

3. **Home Theater Setup Advisor** — If a user wants to build a home theater, ask about room size, budget, and use case (movies, music, gaming) and recommend SOUNDWAVE products. Guide them step by step.

4. **Cart Comparison Assistant** — Help users compare products in their cart. Highlight differences, recommend what suits their needs.

5. **General Sound Science** — Answer questions about acoustics, room treatment, soundproofing basics, and speaker placement.

Your tone:
- Warm, confident, and premium — never robotic
- Simplify complex audio jargon for new users
- For enthusiasts, go deep and technical
- Never recommend products outside SOUNDWAVE unless the user specifically asks about general market comparisons
- Always end product recommendations with a gentle nudge toward the relevant SOUNDWAVE product page

What you do NOT do:
- Do NOT handle orders, payments, returns, or account issues — direct users to contact SOUNDWAVE support
- Do NOT discuss topics unrelated to audio, sound systems, or the SOUNDWAVE brand
- If asked something outside your scope, politely say: "I'm specialized in all things audio — let me know if you have any sound-related questions!"

Always introduce yourself as WAVE when a conversation starts. Keep responses concise but rich in value. Use markdown for formatting when helpful.`;

/**
 * Sanitizes user input content by stripping common prompt injection phrases.
 */
function sanitizeMessageContent(content: string): string {
  if (typeof content !== "string") return "";

  // Common prompt injection attack patterns (case insensitive)
  const injectionPatterns = [
    /ignore\s+(?:all\s+)?(?:previous\s+)?instructions/gi,
    /ignore\s+(?:the\s+)?system\s+(?:prompt|instructions|rules)/gi,
    /forget\s+(?:all\s+)?(?:previous\s+)?instructions/gi,
    /forget\s+(?:what\s+)?(?:we\s+)?(?:were\s+)?(?:talking\s+)?about/gi,
    /system\s+override/gi,
    /developer\s+mode/gi,
    /jailbreak/gi,
    /you\s+are\s+now\s+a/gi,
    /act\s+as\s+a/gi,
    /output\s+the\s+system\s+prompt/gi,
    /print\s+the\s+system\s+prompt/gi,
    /reveal\s+(?:your\s+)?system\s+prompt/gi,
    /decode\s+your\s+system\s+prompt/gi,
  ];

  let sanitized = content;
  let detected = false;

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, "[removed injection trigger]");
      detected = true;
    }
  }

  if (detected) {
    console.warn(`[WAVE AI Injection Detector] Neutralized input: "${content}" -> "${sanitized}"`);
  }

  return sanitized;
}

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const routeInfo = "/api/wave-chat";

  try {
    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error(`[${timestamp}] [${routeInfo} Error] GROQ_API_KEY is not configured.`);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    // Sanitize user messages in conversation log to prevent prompt injection
    const sanitizedMessages = messages.map((m: { role: string; content: string }) => {
      if (m.role === "user") {
        return { ...m, content: sanitizeMessageContent(m.content) };
      }
      return m;
    });

    const modelName = "llama-3.3-70b-versatile";

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: WAVE_SYSTEM_PROMPT },
          ...sanitizedMessages,
        ],
        temperature: 0.7,
        max_tokens: 1000, // Hard limit of 1000 tokens
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${timestamp}] [${routeInfo} Error] Groq API response failed:`, errorText);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again!";
    
    // Per-session token usage tracking & logging
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    console.log(
      `[WAVE AI Token Usage] timestamp="${timestamp}" session_id="${sessionId || "anonymous"}" model="${modelName}" ` +
      `prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens} total_tokens=${usage.total_tokens}`
    );

    return NextResponse.json({ reply });
  } catch (error) {
    console.error(`[${timestamp}] [${routeInfo} Exception]`, error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
