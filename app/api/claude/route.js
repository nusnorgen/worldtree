import Anthropic from "@anthropic-ai/sdk";

// 简单的内存限流：同一 IP 每分钟最多 10 次请求，防止被刷爆额度
const rateLimitMap = new Map();
const WINDOW_MS = 60_000;
const MAX_REQ = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - rec.start > WINDOW_MS) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count += 1;
  rateLimitMap.set(ip, rec);
  return rec.count <= MAX_REQ;
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return Response.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 4000) {
      return Response.json({ error: "无效请求" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (msg.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return Response.json({ text });
  } catch (e) {
    console.error("Claude API error:", e);
    return Response.json({ error: "AI 请求失败" }, { status: 500 });
  }
}
