import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import ResumeAnalysis from "@/models/ResumeAnalysis";

// ── Auth helper ───────────────────────────────────────────────────────────────
function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ── POST /api/resume/analyze ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // 2. Parse Multipart FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (err) {
      return NextResponse.json({ error: "Failed to parse form data." }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const jobDescription = (formData.get("jobDescription") as string | null) ?? "";

    // 3. File Validation
    if (!file) {
      return NextResponse.json({ error: "No resume file uploaded." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds the 5MB limit." }, { status: 400 });
    }

    // 4. Extract text from PDF (dynamic import to avoid serverless bundling issues)
    let resumeText = "";
    try {
      const { PDFParse } = await import("pdf-parse");
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      resumeText = textResult.text;

      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("No readable text found.");
      }
    } catch (err: unknown) {
      console.error("PDF Parsing error:", err);
      return NextResponse.json(
        { error: "Failed to read the PDF. Please ensure it is a text-based PDF, not an image scan." },
        { status: 422 }
      );
    }

    // 5. Build Gemini Prompts
    const hasJd = jobDescription.trim().length > 0;
    
    const systemPrompt = `
You are an expert ATS (Applicant Tracking System) and Career Coach.
Analyze the provided resume text.
${hasJd 
  ? "Compare it against the provided Job Description to calculate a match score and identify gaps." 
  : "Provide general feedback on strengths, formatting issues, ATS-friendliness, and overall impact."
}
Keep your feedback constructive, specific, and highly actionable.
`.trim();

    const userPrompt = `
RESUME TEXT:
${resumeText}

${hasJd ? `JOB DESCRIPTION:\n${jobDescription}` : ""}
`.trim();

    // Define structured JSON output schema for Gemini
    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        matchScore: { 
          type: SchemaType.NUMBER, 
          description: "0 to 100 representing how well the resume matches the JD. Return null if no JD was provided.",
          nullable: true,
        },
        strengths: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "List of strong points, achievements, or well-formatted sections in the resume."
        },
        weaknesses: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "Areas where the resume falls short (e.g. formatting, missing metrics, weak verbs)."
        },
        missingSkills: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "Specific skills or keywords missing from the resume based on the JD or general industry standards."
        },
        suggestions: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "Specific, actionable steps the candidate should take to improve this resume."
        },
      },
      required: ["matchScore", "strengths", "weaknesses", "missingSkills", "suggestions"],
    };

    // 6. Call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
    }

    let analysisData;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        systemInstruction: systemPrompt,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
        }
      });

      const result = await model.generateContent(userPrompt);
      const textResult = result.response.text();
      analysisData = JSON.parse(textResult);

      // Enforce null matchScore if no JD was provided
      if (!hasJd) {
        analysisData.matchScore = null;
      }
    } catch (err: unknown) {
      console.error("Gemini API error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("quota") || msg.includes("rate") || msg.includes("429")) {
        return NextResponse.json({ error: "AI service is at capacity. Please try again." }, { status: 429 });
      }
      if (msg.includes("API_KEY") || msg.includes("apiKey")) {
        return NextResponse.json({ error: "Invalid Gemini API key." }, { status: 503 });
      }
      return NextResponse.json({ error: "AI service encountered an error during analysis." }, { status: 502 });
    }

    // 7. Save History to MongoDB
    let saved = null;
    try {
      await connectToDatabase();
      saved = await ResumeAnalysis.create({
        userId: payload.userId,
        fileName: file.name,
        matchScore: analysisData.matchScore,
        analysis: analysisData,
      });
    } catch (dbErr) {
      console.error("Failed to save resume analysis to database:", dbErr);
      // Non-fatal, we still return the analysis to the user
    }

    return NextResponse.json({ analysis: analysisData, saved });
  } catch (err: unknown) {
    console.error("Unhandled error in POST /api/resume/analyze:", err);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// ── GET /api/resume/analyze ───────────────────────────────────────────────────
// Load the user's past resume analyses
export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await connectToDatabase();
    
    const history = await ResumeAnalysis.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("fileName matchScore analysis createdAt");

    return NextResponse.json({ history });
  } catch (err: unknown) {
    console.error("Unhandled error in GET /api/resume/analyze:", err);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}

// ── DELETE /api/resume/analyze — delete one or all saved analyses ──────────────
export async function DELETE(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await connectToDatabase();

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const deleted = await ResumeAnalysis.findOneAndDelete({ _id: id, userId: payload.userId });
      if (!deleted) {
        return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    await ResumeAnalysis.deleteMany({ userId: payload.userId });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Unhandled error in DELETE /api/resume/analyze:", err);
    return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
  }
}
