import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { askModel, buildPrompt, pickProvider, sseData, streamModel } from "../src/lib/ai";

function fakeFetch(status: number, json: unknown, spy?: (url: string, init: RequestInit) => void): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    spy?.(String(url), init);
    return new Response(JSON.stringify(json), { status });
  }) as unknown as typeof fetch;
}

describe("provider selection", () => {
  it("prefers Groq, falls back to Gemini, and returns null with no key", () => {
    assert.equal(pickProvider({})?.provider, undefined);
    assert.equal(pickProvider({ GROQ_API_KEY: "g" })?.provider, "groq");
    assert.equal(pickProvider({ GROQ_API_KEY: "g" })?.model, "openai/gpt-oss-20b");
    assert.ok((pickProvider({ GROQ_API_KEY: "g" })?.fallbacks?.length ?? 0) >= 2);
    assert.equal(pickProvider({ GEMINI_API_KEY: "k" })?.provider, "gemini");
    assert.equal(pickProvider({ GEMINI_API_KEY: "k", GEMINI_MODEL: "m1" })?.model, "m1");
    assert.equal(pickProvider({ GROQ_API_KEY: "g", GEMINI_API_KEY: "k" })?.provider, "groq");
    assert.equal(pickProvider({ GROQ_API_KEY: "g", GEMINI_API_KEY: "k", AI_PROVIDER: "gemini" })?.provider, "gemini");
    assert.equal(pickProvider({ GROQ_API_KEY: "g", AI_MODEL: "x" })?.model, "x");
    assert.deepEqual(pickProvider({ GROQ_API_KEY: "g", AI_MODEL: "x" })?.fallbacks, []);
    assert.equal(pickProvider({ GROQ_API_KEY: "  " }), null);
  });
});

describe("prompt building", () => {
  it("requires a question and trims untrusted input", () => {
    assert.equal(buildPrompt({ message: "   " }).ok, false);
    const r = buildPrompt({
      message: "What now?\u0000",
      tempC: 18.4,
      occasion: "work",
      wardrobe: [{ name: "x".repeat(500), category: "top", colorName: "navy", formality: "smart", season: "all" }],
      suggestions: [["Navy shirt", "Chinos"]],
    });
    assert.ok(r.ok);
    if (r.ok) {
      assert.ok(r.prompt.includes("Look 1: Navy shirt, Chinos"));
      assert.ok(r.prompt.includes("18°C"));
      assert.ok(!r.prompt.includes("x".repeat(100)), "long names are cut");
      assert.ok(!r.prompt.includes("\u0000"));
    }
  });
});

describe("calling the model", () => {
  const groq = { provider: "groq", key: "gk", model: "m" } as const;
  const gem = { provider: "gemini", key: "ak", model: "gm" } as const;

  it("reads a Groq reply and sends the key as a bearer token", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const r = await askModel(
      groq,
      "hi",
      fakeFetch(200, { choices: [{ message: { content: " Wear the navy shirt. " } }] }, (url, init) => (seen = { url, init })),
    );
    assert.deepEqual(r, { ok: true, reply: "Wear the navy shirt." });
    assert.ok(seen);
    const s = seen as { url: string; init: RequestInit };
    assert.equal(s.url, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal((s.init.headers as Record<string, string>).Authorization, "Bearer gk");
    assert.equal(JSON.parse(String(s.init.body)).model, "m");
  });

  it("reads a Gemini reply and keeps the key out of the URL", async () => {
    let url = "";
    const r = await askModel(gem, "hi", fakeFetch(200, { candidates: [{ content: { parts: [{ text: "Linen shirt." }] } }] }, (u) => (url = u)));
    assert.deepEqual(r, { ok: true, reply: "Linen shirt." });
    assert.ok(url.includes("gm:generateContent") && !url.includes("ak"));
  });

  it("turns failures into friendly messages", async () => {
    const limit = await askModel(groq, "hi", fakeFetch(429, {}));
    assert.ok(!limit.ok && limit.status === 429 && /limit/.test(limit.message));
    const bad = await askModel(groq, "hi", fakeFetch(401, {}));
    assert.ok(!bad.ok && /key/.test(bad.message));
    const empty = await askModel(groq, "hi", fakeFetch(200, { choices: [] }));
    assert.ok(empty.ok && /rephras/.test(empty.reply));
    const down = await askModel(groq, "hi", (async () => { throw new Error("offline"); }) as unknown as typeof fetch);
    assert.ok(!down.ok && down.status === 502);
  });
});

function sseResponse(lines: string[], chunkSize = 7, status = 200): Response {
  const bytes = new TextEncoder().encode(lines.join("\n") + "\n");
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < bytes.length; i += chunkSize) c.enqueue(bytes.slice(i, i + chunkSize));
      c.close();
    },
  });
  return new Response(stream, { status });
}
async function collect(g: AsyncGenerator<string>) {
  let out = "";
  for await (const t of g) out += t;
  return out;
}

describe("streaming", () => {
  it("reassembles server-sent events even when bytes are split mid-line", async () => {
    const res = sseResponse(['data: {"a":1}', "", "event: x", 'data: {"a":2}', "data: [DONE]", 'data: {"a":3}']);
    const seen: string[] = [];
    for await (const d of sseData(res.body!)) seen.push(d);
    assert.deepEqual(seen, ['{"a":1}', '{"a":2}']);
  });

  it("streams Groq text pieces in order", async () => {
    const f = (async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"role":"assistant"}}]}',
        'data: {"choices":[{"delta":{"content":"Wear "}}]}',
        'data: {"choices":[{"delta":{"content":"the navy shirt."}}]}',
        "data: [DONE]",
      ])) as unknown as typeof fetch;
    const r = await streamModel({ provider: "groq", key: "k", model: "m" }, "hi", f);
    assert.ok(r.ok);
    if (r.ok) assert.equal(await collect(r.stream), "Wear the navy shirt.");
  });

  it("streams Gemini text pieces and ignores junk lines", async () => {
    const f = (async () =>
      sseResponse([
        'data: {"candidates":[{"content":{"parts":[{"text":"Linen "}]}}]}',
        "data: not-json",
        'data: {"candidates":[{"content":{"parts":[{"text":"shirt."}]}}]}',
      ])) as unknown as typeof fetch;
    const r = await streamModel({ provider: "gemini", key: "k", model: "m" }, "hi", f);
    assert.ok(r.ok);
    if (r.ok) assert.equal(await collect(r.stream), "Linen shirt.");
  });

  it("reports errors before streaming starts", async () => {
    const f = (async () => new Response("{}", { status: 429 })) as unknown as typeof fetch;
    const r = await streamModel({ provider: "groq", key: "k", model: "m" }, "hi", f);
    assert.ok(!r.ok && r.status === 429 && /limit/.test(r.message));
    const down = await streamModel({ provider: "groq", key: "k", model: "m" }, "hi", (async () => { throw new Error("x"); }) as unknown as typeof fetch);
    assert.ok(!down.ok && down.status === 502);
  });

  it("skips a retired model and uses the next one automatically", async () => {
    const tried: string[] = [];
    const f = (async (_url: string, init: RequestInit) => {
      const model = JSON.parse(String(init.body)).model as string;
      tried.push(model);
      if (model === "old-model") return new Response('{"error":{"code":"model_decommissioned"}}', { status: 404 });
      return sseResponse(['data: {"choices":[{"delta":{"content":"Works."}}]}', "data: [DONE]"]);
    }) as unknown as typeof fetch;
    const r = await streamModel({ provider: "groq", key: "k", model: "old-model", fallbacks: ["new-model"] }, "hi", f);
    assert.ok(r.ok);
    if (r.ok) assert.equal(await collect(r.stream), "Works.");
    assert.deepEqual(tried, ["old-model", "new-model"]);
  });

  it("retries a reasoning model without the extra setting if it is refused", async () => {
    const bodies: Record<string, unknown>[] = [];
    const f = (async (_url: string, init: RequestInit) => {
      const b = JSON.parse(String(init.body));
      bodies.push(b);
      if (b.reasoning_effort) return new Response("{}", { status: 400 });
      return sseResponse(['data: {"choices":[{"delta":{"content":"ok"}}]}']);
    }) as unknown as typeof fetch;
    const r = await streamModel({ provider: "groq", key: "k", model: "openai/gpt-oss-20b" }, "hi", f);
    assert.ok(r.ok);
    assert.equal(bodies.length, 2);
    assert.equal(bodies[0].reasoning_effort, "low");
    assert.equal(bodies[1].reasoning_effort, undefined);
  });

  it("gives up with a clear message when every model is unavailable", async () => {
    const f = (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch;
    const r = await streamModel({ provider: "groq", key: "k", model: "a", fallbacks: ["b"] }, "hi", f);
    assert.ok(!r.ok && r.status === 404 && /AI_MODEL/.test(r.message));
  });
});
