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

    const task = await StreakTask.findOneAndUpdate(
      { userId: payload.userId, status: "active" },
      { $set: { status: "abandoned" } },
      { new: true }
    );

    if (!task) {
      return NextResponse.json(
        { error: "No active streak found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Streak abandoned." });
  } catch (err) {
    console.error("POST /api/streaks/abandon error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
