import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import SavedResource from "@/models/SavedResource";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function POST(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  try {
    const body = await request.json();
    const { playlistName, title, url, type } = body;

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required." }, { status: 400 });
    }

    await connectToDatabase();

    const saved = await SavedResource.create({
      userId: payload.userId,
      playlistName: playlistName?.trim() || "General",
      title,
      url,
      type: type || "other",
    });

    return NextResponse.json({ message: "Saved successfully.", saved });
  } catch (err) {
    console.error("Save resource error:", err);
    return NextResponse.json({ error: "Failed to save resource." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  await connectToDatabase();
  const resources = await SavedResource.find({ userId: payload.userId }).sort({ createdAt: -1 });

  return NextResponse.json({ resources });
}

export async function DELETE(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Resource ID required." }, { status: 400 });

    await connectToDatabase();
    await SavedResource.findOneAndDelete({ _id: id, userId: payload.userId });

    return NextResponse.json({ message: "Removed successfully." });
  } catch (err) {
    console.error("Delete resource error:", err);
    return NextResponse.json({ error: "Failed to remove resource." }, { status: 500 });
  }
}