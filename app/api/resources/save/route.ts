import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import SavedResource from "@/models/SavedResource";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// GET /api/resources/save — fetch all saved resources for the user
export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    await connectToDatabase();

    const resources = await SavedResource.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .select("playlistName title url type createdAt");

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("GET /api/resources/save error:", err);
    return NextResponse.json({ error: "Failed to load saved resources." }, { status: 500 });
  }
}

// POST /api/resources/save — save a new resource
export async function POST(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await request.json();
    const { playlistName, title, url, type } = body;

    if (!title || !url) {
      return NextResponse.json({ error: "Title and URL are required." }, { status: 400 });
    }

    await connectToDatabase();

    const saved = await SavedResource.create({
      userId: payload.userId,
      playlistName: playlistName ?? "General",
      title,
      url,
      type: type ?? "other",
    });

    return NextResponse.json({ saved });
  } catch (err) {
    console.error("POST /api/resources/save error:", err);
    return NextResponse.json({ error: "Failed to save resource." }, { status: 500 });
  }
}

// DELETE /api/resources/save?id=xxx — remove a saved resource
export async function DELETE(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Resource ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    await SavedResource.findOneAndDelete({ _id: id, userId: payload.userId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/resources/save error:", err);
    return NextResponse.json({ error: "Failed to delete resource." }, { status: 500 });
  }
}
