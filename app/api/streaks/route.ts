import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import StreakTask from "@/models/StreakTask";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, totalDays } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!totalDays || typeof totalDays !== "number" || totalDays < 1) {
      return NextResponse.json(
        { error: "Total days must be a positive number." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const active = await StreakTask.findOne({
      userId: payload.userId,
      status: "active",
    });
    if (active) {
      return NextResponse.json(
        { error: "You already have an active streak. Finish or abandon it first." },
        { status: 409 }
      );
    }

    const task = await StreakTask.create({
      userId: payload.userId,
      title: title.trim(),
      totalDays,
      startDate: new Date(),
      completedDates: [],
      status: "active",
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("POST /api/streaks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    await connectToDatabase();
    await StreakTask.deleteMany({ userId: payload.userId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/streaks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
