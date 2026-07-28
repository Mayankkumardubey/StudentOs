import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Roadmap from "@/models/Roadmap";

// ── Auth helper (same pattern as counselor & profile) ─────────────────────────
function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ── POST /api/roadmap/generate ────────────────────────────────────────────────
export async function POST(request: Request) {
  // 1. Auth
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  // 2. Parse body
  let goal: string;
  let timeframe: string;
  try {
    const body = await request.json();
    goal = (body.goal ?? "").trim();
    timeframe = (body.timeframe ?? "6 months").trim();
    if (!goal) throw new Error("empty goal");
  } catch {
    return NextResponse.json(
      { error: "Request body must include a non-empty 'goal'." },
      { status: 400 }
    );
  }

  // 3. Fetch student profile for context
  await connectToDatabase();

  const user = await User.findById(payload.userId).select(
    "degree branch cgpa preferredCareerPath jobPreference higherStudiesInterest " +
    "targetSalaryRange selfRatedSkillLevel dailyStudyHours"
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 4. Build system prompt
  const systemPrompt = `
You are an expert Career Roadmap Generator for Indian college students.
You create detailed, realistic, and actionable roadmaps tailored to each student's profile and the Indian education/job market.

## Student Profile
- Degree: ${user.degree} in ${user.branch}
- CGPA: ${user.cgpa} / 10
- Preferred Career Path: ${user.preferredCareerPath}
- Job Preference: ${user.jobPreference}
- Higher Studies Interest: ${user.higherStudiesInterest}
- Self-Rated Skill Level: ${user.selfRatedSkillLevel}
- Target Salary Range: ${user.targetSalaryRange}
- Daily Study Time Available: ${user.dailyStudyHours} hrs/day

## Output Format
Structure the roadmap as follows (use markdown headers exactly as shown):

# [Short Roadmap Title]

## Overview
One paragraph summarising the strategy and what success looks like.

## Phase N: [Phase Name] ([Duration])
### Milestones
- List key outcomes to achieve by end of this phase

### Weekly Focus Areas
- Specific, concrete actions (not vague advice)

### Recommended Resources
- Specific courses, books, platforms, YouTube channels

### Progress Checkpoint
How to self-assess at the end of this phase

(Repeat for each phase, usually 3–5 phases for the given timeframe)

## Tips for Success
3–5 bullet points of mindset/strategy advice relevant to the Indian context (placements, GATE, GRE, startup ecosystem, etc.)

Keep everything specific and actionable. Avoid generic filler.
`.trim();

  // 5. Call Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    return NextResponse.json(
      { error: "AI service is not configured. Please contact the administrator." },
      { status: 503 }
    );
  }

  let content: string;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest", // ← Updated model name
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(
      `Generate a ${timeframe} roadmap for the following goal: ${goal}`
    );
    content = result.response.text();
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota") || msg.includes("rate") || msg.includes("429")) {
      return NextResponse.json(
        { error: "AI service is at capacity. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    if (msg.includes("API_KEY") || msg.includes("apiKey")) {
      return NextResponse.json({ error: "Invalid Gemini API key." }, { status: 503 });
    }
    return NextResponse.json(
      { error: "AI service encountered an error. Please try again." },
      { status: 502 }
    );
  }

  // 6. Persist to MongoDB (non-fatal if it fails)
  let saved = null;
  try {
    saved = await Roadmap.create({ userId: payload.userId, goal, timeframe, content });
  } catch (dbErr) {
    console.error("Failed to save roadmap:", dbErr);
  }

  return NextResponse.json({ content, saved });
}

// ── GET /api/roadmap/generate — load saved roadmaps ───────────────────────────
export async function GET(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  await connectToDatabase();

  const roadmaps = await Roadmap.find({ userId: payload.userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("goal timeframe content completedPhases createdAt");

  return NextResponse.json({ roadmaps });
}

// ── DELETE /api/roadmap/generate — delete one or all roadmaps ─────────────────
export async function DELETE(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  await connectToDatabase();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    // Delete a single roadmap (only if it belongs to this user)
    const deleted = await Roadmap.findOneAndDelete({ _id: id, userId: payload.userId });
    if (!deleted) {
      return NextResponse.json({ error: "Roadmap not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  // No id — delete ALL roadmaps for this user
  await Roadmap.deleteMany({ userId: payload.userId });
  return NextResponse.json({ success: true });
}

// ── PATCH /api/roadmap/generate — toggle phase completion ─────────────────────
export async function PATCH(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  let roadmapId: string;
  let completed: boolean;
  try {
    const body = await request.json();
    roadmapId = body.roadmapId;
    completed = body.completed;
    if (!roadmapId || typeof completed !== "boolean") throw new Error("invalid");
  } catch {
    return NextResponse.json(
      { error: "Request body must include 'roadmapId' (string) and 'completed' (boolean)." },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const roadmap = await Roadmap.findOne({ _id: roadmapId, userId: payload.userId });
  if (!roadmap) {
    return NextResponse.json({ error: "Roadmap not found." }, { status: 404 });
  }

  // Parse content to determine phase count
  const lines = roadmap.content.split("\n");
  let phaseCount = 0;
  for (const line of lines) {
    if (line.match(/^##\s+Phase/i)) phaseCount++;
  }
  if (phaseCount === 0) {
    return NextResponse.json({ error: "Roadmap has no phases." }, { status: 400 });
  }

  const current = roadmap.completedPhases ?? [];

  if (completed) {
    // Find the first incomplete phase index (sequential enforcement)
    for (let i = 0; i < phaseCount; i++) {
      if (!current.includes(i)) {
        current.push(i);
        break;
      }
    }
  } else {
    // Remove the last completed phase (undo most recent)
    if (current.length > 0) {
      current.pop();
    }
  }

  roadmap.completedPhases = current;
  await roadmap.save();

  return NextResponse.json({ completedPhases: roadmap.completedPhases });
}
