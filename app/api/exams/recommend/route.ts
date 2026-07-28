import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import ExamRecommendation from "@/models/ExamRecommendations";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    governmentExams: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          timeline: { type: SchemaType.STRING },
        },
        required: ["name", "reason", "timeline"],
      },
    },
    privateExams: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          timeline: { type: SchemaType.STRING },
        },
        required: ["name", "reason", "timeline"],
      },
    },
  },
  required: ["governmentExams", "privateExams"],
};

export async function POST(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  let interests: string;
  try {
    const body = await request.json();
    interests = (body.interests ?? "").trim();
  } catch {
    interests = "";
  }

  await connectToDatabase();
  const user = await User.findById(payload.userId).select(
    "degree branch cgpa preferredCareerPath jobPreference higherStudiesInterest selfRatedSkillLevel"
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const systemPrompt = `
You are an expert exam counselor for Indian college students, recommending both government and 
private/other exams they should consider.

## Student Profile
- Degree: ${user.degree} in ${user.branch}
- CGPA: ${user.cgpa} / 10
- Preferred Career Path: ${user.preferredCareerPath}
- Job Preference: ${user.jobPreference}
- Higher Studies Interest: ${user.higherStudiesInterest}
- Self-Rated Skill Level: ${user.selfRatedSkillLevel}
${interests ? `- Student's stated interests: ${interests}` : ""}

Recommend 3-5 relevant GOVERNMENT exams (e.g. GATE, UPSC, SSC, state PSC, banking exams like IBPS, 
railway exams) and 3-5 relevant PRIVATE/other exams (e.g. CAT, GRE, GMAT, campus placement 
aptitude tests, relevant certification exams) that genuinely fit this student's profile - not a 
generic list. For each exam, give a brief specific reason why it fits them, and a realistic 
preparation timeline suggestion.
`.trim();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service is not configured. Please contact the administrator." },
      { status: 503 }
    );
  }

  let result: { governmentExams: any[]; privateExams: any[] };
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema as any,
      },
    });
    const response = await model.generateContent(
      "Generate exam recommendations based on the profile above."
    );
    result = JSON.parse(response.response.text());
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota") || msg.includes("429")) {
      return NextResponse.json(
        { error: "AI service is at capacity. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "AI service encountered an error. Please try again." },
      { status: 502 }
    );
  }

  let saved = null;
  try {
    saved = await ExamRecommendation.create({
      userId: payload.userId,
      interests,
      governmentExams: result.governmentExams,
      privateExams: result.privateExams,
    });
  } catch (dbErr) {
    console.error("Failed to save exam recommendation:", dbErr);
  }

  return NextResponse.json({ ...result, saved });
}

export async function GET(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  await connectToDatabase();
  const recommendations = await ExamRecommendation.find({ userId: payload.userId })
    .sort({ createdAt: -1 })
    .limit(10);

  return NextResponse.json({ recommendations });
}