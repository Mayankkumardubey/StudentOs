import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import BookmarkedOpportunity from "@/models/BookmarkedOpportunity";

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
  const bookmarks = await BookmarkedOpportunity.find({ userId: payload.userId })
    .sort({ createdAt: -1 })
    .limit(20);
  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await request.json();
  const { opportunityId, title, company, location, mode, salary, postedDate, redirectUrl } = body;
  if (!opportunityId || !title || !company) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectToDatabase();
  const bookmark = await BookmarkedOpportunity.findOneAndUpdate(
    { userId: payload.userId, opportunityId },
    {
      userId: payload.userId,
      opportunityId,
      title,
      company,
      location: location ?? "",
      mode: mode ?? "Onsite",
      salary: salary ?? "",
      postedDate: postedDate ?? "",
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
  const opportunityId = searchParams.get("opportunityId");
  if (!opportunityId) return NextResponse.json({ error: "Missing opportunityId" }, { status: 400 });

  await connectToDatabase();
  await BookmarkedOpportunity.findOneAndDelete({ userId: payload.userId, opportunityId });
  return NextResponse.json({ ok: true });
}
