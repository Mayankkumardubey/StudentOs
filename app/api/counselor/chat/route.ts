import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";

// ── Types ─────────────────────────────────────────────────────────────────────
interface HistoryTurn {
  role: "user" | "model";
  parts: { text: string }[];
}

// ── Helper: extract JWT from cookie header ────────────────────────────────────
function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ── POST /api/counselor/chat ──────────────────────────────────────────────────
export async function POST(request: Request) {
  // 1. Auth
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing authentication token" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
  }

  // 2. Parse body
  let message: string;
  let clientHistory: HistoryTurn[];
  try {
    const body = await request.json();
    message = body.message;
    clientHistory = body.history ?? [];
    if (!message || typeof message !== "string") throw new Error();
  } catch {
    return NextResponse.json({ error: "Request body must include a non-empty 'message' string." }, { status: 400 });
  }

  // 3. Fetch user profile for context
  await connectToDatabase();

  const user = await User.findById(payload.userId).select(
    "email degree branch cgpa preferredCareerPath jobPreference higherStudiesInterest targetSalaryRange selfRatedSkillLevel dailyStudyHours"
  );
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 4. Build system prompt with real profile data
  const systemPrompt = `
You are an expert AI Career Counselor embedded in StudentOS, a platform built for Indian college students.
Your role is to give personalised, actionable, and empathetic career and academic guidance.

## Student Profile
- Email: ${user.email}
- Degree: ${user.degree}
- Branch / Specialisation: ${user.branch}
- CGPA: ${user.cgpa} / 10
- Preferred Career Path: ${user.preferredCareerPath}
- Job Preference: ${user.jobPreference}
- Higher Studies Interest: ${user.higherStudiesInterest}
- Self-Rated Skill Level: ${user.selfRatedSkillLevel}
- Target Salary Range: ${user.targetSalaryRange}
- Daily Study Hours: ${user.dailyStudyHours} hrs/day

## Behaviour Rules
- Keep responses focused on career guidance, academic planning, skill development, entrance exams (GATE, CAT, GRE, UPSC, etc.), job markets, and higher studies.
- Be concise — prefer bullet points and short paragraphs over walls of text.
- If asked about something unrelated to career/academics, politely redirect the student.
- Assume the Indian education context (IITs, NITs, tier-2/tier-3 colleges, campus placements, etc.).
- Never make up specific company names, salary figures, or exam dates — say "verify this" when uncertain.
`.trim();

  // 5. Call Gemini API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return NextResponse.json(
      { error: "AI service is not configured. Please contact the administrator." },
      { status: 503 }
    );
  }

  let aiText: string;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history: clientHistory });
    const result = await chat.sendMessage(message);
    aiText = result.response.text();
  } catch (err: unknown) {
    console.error("Gemini API error:", err);

    // Surface a friendly message for common error types
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("API_KEY") || msg.includes("apiKey")) {
      return NextResponse.json({ error: "Invalid Gemini API key." }, { status: 503 });
    }
    if (msg.includes("quota") || msg.includes("rate") || msg.includes("429")) {
      return NextResponse.json(
        { error: "The AI service is temporarily at capacity. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "The AI service encountered an error. Please try again." },
      { status: 502 }
    );
  }

  // 6. Persist conversation to MongoDB (upsert — one doc per user)
  try {
    await Conversation.findOneAndUpdate(
      { userId: payload.userId },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", content: message, timestamp: new Date() },
              { role: "model", content: aiText, timestamp: new Date() },
            ],
          },
        },
      },
      { upsert: true, new: true }
    );
  } catch (dbErr) {
    // Non-fatal — still return the AI reply even if persistence fails
    console.error("Failed to persist conversation:", dbErr);
  }

  return NextResponse.json({ reply: aiText });
}

// ── GET /api/counselor/chat — load stored history ─────────────────────────────
export async function GET(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  await connectToDatabase();

  const conversation = await Conversation.findOne({ userId: payload.userId });
  return NextResponse.json({ messages: conversation?.messages ?? [] });
}

// ── DELETE /api/counselor/chat — clear all or delete one message ──────────────
export async function DELETE(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const url = new URL(request.url);
  const indexParam = url.searchParams.get("index");

  await connectToDatabase();

  if (indexParam !== null) {
    // Delete a single message by index
    const idx = parseInt(indexParam, 10);
    if (isNaN(idx) || idx < 0) {
      return NextResponse.json({ error: "Invalid index" }, { status: 400 });
    }

    const conversation = await Conversation.findOne({ userId: payload.userId });
    if (!conversation || idx >= conversation.messages.length) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    conversation.messages.splice(idx, 1);
    await conversation.save();
    return NextResponse.json({ ok: true });
  }

  // No index param → clear all messages
  await Conversation.findOneAndUpdate(
    { userId: payload.userId },
    { $set: { messages: [] } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
