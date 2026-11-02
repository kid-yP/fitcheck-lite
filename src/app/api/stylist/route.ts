import { auth } from "@clerk/nextjs/server";
import { buildPrompt, pickProvider, streamModel } from "@/lib/ai";

// Best-effort protection for the free quota: 20 questions per signed-in user per hour.
// (On serverless hosting this counter can reset between requests, so it is a speed bump, not a wall.)
const hits = new Map<string, number[]>();
const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Please sign in." }, { status: 401 });

  const cfg = pickProvider(process.env);
  if (!cfg) {
    return Response.json(
      { error: "AI chat isn't set up yet. Add a free GROQ_API_KEY (see README). The suggestions above work without it." },
      { status: 501 },
    );
  }

  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    return Response.json({ error: "You've asked a lot of questions this hour. Try again a bit later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const built = buildPrompt(body);
  if (!built.ok) return Response.json({ error: built.error }, { status: 400 });

  recent.push(now);
  hits.set(userId, recent);

  const result = await streamModel(cfg, built.prompt);
  if (!result.ok) {
    console.error("AI error", cfg.provider, result.status);
    return Response.json({ error: result.message }, { status: result.status === 429 ? 429 : 502 });
  }

  // Send the words to the browser as they arrive.
  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const text of result.stream) controller.enqueue(encoder.encode(text));
      } catch {
        controller.enqueue(encoder.encode("\n\n(The AI stopped unexpectedly. Try again.)"));
      }
      controller.close();
    },
  });
  return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
