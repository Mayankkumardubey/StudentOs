import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    videos: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          channel: { type: SchemaType.STRING },
          searchQuery: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ["title", "channel", "searchQuery", "reason"],
      },
    },
    books: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          author: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ["title", "author", "reason"],
      },
    },
  },
  required: ["videos", "books"],
};

export async function POST(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  let topic: string;
  try {
    const body = await request.json();
    topic = (body.topic ?? "").trim();
  } catch {
    topic = "";
  }

  await connectToDatabase();
  const user = await User.findById(payload.userId).select(
    "degree branch preferredCareerPath selfRatedSkillLevel"
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const systemPrompt = `
You are a learning resource curator for Indian college students.

## Student Profile
- Degree: ${user.degree} in ${user.branch}
- Career Path: ${user.preferredCareerPath}
- Skill Level: ${user.selfRatedSkillLevel}
${topic ? `- Specific topic requested: ${topic}` : ""}

Recommend 5 YouTube videos/channels and 4 books relevant to this student's field and skill level.
For videos, give a realistic video title, a real, well-known YouTube channel name in that domain, 
and a good YouTube search query someone could use to find similar content (since you cannot 
provide real URLs). For books, give real, well-known book titles and authors in the field. Give 
a brief reason for each recommendation.
`.trim();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service is not configured." },
      { status: 503 }
    );
  }

  let result: { videos: any[]; books: any[] };
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
      "Generate resource recommendations based on the profile above."
    );
    result = JSON.parse(response.response.text());
  } catch (err: unknown) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "AI service encountered an error. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}