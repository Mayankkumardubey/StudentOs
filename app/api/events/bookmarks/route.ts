import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import BookmarkedEvent from "@/models/BookmarkedEvent";

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
  const bookmarks = await BookmarkedEvent.find({ userId: payload.userId })
    .sort({ createdAt: -1 })
    .limit(50);
  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { eventId, name, venue, date, category, redirectUrl } = body;
  if (!eventId || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectToDatabase();
  const bookmark = await BookmarkedEvent.findOneAndUpdate(
    { userId: payload.userId, eventId },
    {
      userId: payload.userId,
      eventId,
      name,
      venue: venue ?? "",
      date: date ?? "",
      category: category ?? "",
      redirectUrl: redirectUrl ?? "",
    },
    { upsert: true, new: true }
  );
  return NextResponse.json({ bookmark });
}

export async function DELETE(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  await connectToDatabase();
  await BookmarkedEvent.findOneAndDelete({ userId: payload.userId, eventId });
  return NextResponse.json({ ok: true });
}
