import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken } from "@/lib/auth";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

interface HistoryTurn {
  role: "user" | "model";
  parts: { text: string }[];
}

const SYSTEM_PROMPT = `You are an AI Mentor inside StudentOS — a platform for Indian college students.
You act as a Mentor, Senior, Career Guide, and Study Coach.

Behaviour:
- Be warm, encouraging, and practical.
- Give concise, actionable advice — prefer bullet points.
- Cover: study plans, career guidance, interview prep, resume tips, motivation, time management, skill development.
- Assume the Indian education context (IITs, NITs, tier-2/tier-3 colleges, campus placements, GATE, CAT, GRE, UPSC).
- Never fabricate specific company names, salary figures, or exam dates — say "verify this" when uncertain.
- Keep responses focused on mentorship. If asked about unrelated topics, politely redirect.
- Do not access any StudentOS user data. You are a general-purpose mentor.
- Keep responses under 300 words unless the user asks for detail.`.trim();

export async function POST(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  let message: string;
  let clientHistory: HistoryTurn[];
  try {
    const body = await request.json();
    message = body.message;
    clientHistory = body.history ?? [];
    if (!message || typeof message !== "string") throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service is not configured." },
      { status: 503 }
    );
  }

  let aiText: string;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: SYSTEM_PROMPT,
    });
    const chat = model.startChat({ history: clientHistory });
    const result = await chat.sendMessage(message);
    aiText = result.response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("API_KEY") || msg.includes("apiKey")) {
      return NextResponse.json({ error: "Invalid API key." }, { status: 503 });
    }
    if (msg.includes("quota") || msg.includes("rate") || msg.includes("429")) {
      return NextResponse.json(
        { error: "AI service is at capacity. Try again shortly." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "AI service encountered an error." },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply: aiText });
}
