import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// POST /api/resources/suggest — generate video & book suggestions for a topic
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic: string = body.topic ?? "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction: `You are a helpful learning assistant. Given a topic, suggest high-quality YouTube videos and books to learn about it.
Return exactly the JSON structure requested. Suggest 4-6 videos and 3-5 books.
For videos, use real popular YouTube channels (like Fireship, Traversy Media, CS Dojo, etc. for CS topics).
For books, use well-known published books with real authors.
Make searchQuery short and effective for YouTube search.`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            videos: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING, description: "Video title" },
                  channel: { type: SchemaType.STRING, description: "YouTube channel name" },
                  searchQuery: { type: SchemaType.STRING, description: "Short YouTube search query" },
                  reason: { type: SchemaType.STRING, description: "Why this video is good for learning this topic" },
                },
                required: ["title", "channel", "searchQuery", "reason"],
              },
            },
            books: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING, description: "Book title" },
                  author: { type: SchemaType.STRING, description: "Author name" },
                  reason: { type: SchemaType.STRING, description: "Why this book is recommended" },
                },
                required: ["title", "author", "reason"],
              },
            },
          },
          required: ["videos", "books"],
        } as any,
      },
    });

    const prompt = topic.trim()
      ? `Suggest learning resources (YouTube videos and books) for the topic: "${topic}"`
      : `Suggest popular learning resources (YouTube videos and books) for a computer science student to level up their skills. Pick a trending or fundamental topic.`;

    const result = await model.generateContent(prompt);
    const textResult = result.response.text();
    const data = JSON.parse(textResult);

    return NextResponse.json({ videos: data.videos ?? [], books: data.books ?? [] });
  } catch (err: unknown) {
    console.error("POST /api/resources/suggest error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota") || msg.includes("rate") || msg.includes("429")) {
      return NextResponse.json({ error: "AI service is at capacity. Please try again." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to generate suggestions." }, { status: 500 });
  }
}
