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

    await connectToDatabase();

    const task = await StreakTask.findOne({
      userId: payload.userId,
      status: "active",
    });

    if (!task) {
      return NextResponse.json(
        { error: "No active streak found." },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    if (task.completedDates.includes(today)) {
      return NextResponse.json(
        { error: "Today is already marked complete." },
        { status: 409 }
      );
    }

    task.completedDates.push(today);

    if (task.completedDates.length >= task.totalDays) {
      task.status = "completed";
    }

    await task.save();

    return NextResponse.json({ task });
  } catch (err) {
    console.error("POST /api/streaks/check-in error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
