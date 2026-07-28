import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import SavedExam from "@/models/SavedExam";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function GET(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  await connectToDatabase();
  const exams = await SavedExam.find({ userId: payload.userId }).sort({ createdAt: -1 }).limit(20);
  return NextResponse.json({ exams });
}

export async function POST(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { name, reason, timeline, category, examDate, reminderEnabled } = body;
  if (!name || !reason || !timeline || !category) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectToDatabase();
  const exam = await SavedExam.findOneAndUpdate(
    { userId: payload.userId, name },
    {
      userId: payload.userId, name, reason, timeline, category,
      examDate: examDate ?? "",
      reminderEnabled: reminderEnabled ?? false,
    },
    { upsert: true, new: true }
  );
  return NextResponse.json({ exam });
}

export async function DELETE(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  await connectToDatabase();
  await SavedExam.findOneAndDelete({ userId: payload.userId, name });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { name, reminderEnabled, examDate } = body;
  if (!name || typeof reminderEnabled !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectToDatabase();

  const update: Record<string, unknown> = { reminderEnabled };
  if (examDate !== undefined) update.examDate = examDate;

  const exam = await SavedExam.findOneAndUpdate(
    { userId: payload.userId, name },
    { $set: update },
    { new: true }
  );

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  return NextResponse.json({ exam });
}
