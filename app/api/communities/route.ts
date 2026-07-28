import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Community from "@/models/Community";
import CommunityMember from "@/models/CommunityMember";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// GET /api/communities — list communities the user has joined
export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    await connectToDatabase();

    const memberships = await CommunityMember.find({ userId: payload.userId }).lean();
    const communityIds = memberships.map((m) => m.communityId);

    const communities = await Community.find({ _id: { $in: communityIds } })
      .sort({ createdAt: -1 })
      .lean();

    const result = communities.map((c) => {
      const membership = memberships.find(
        (m) => m.communityId.toString() === c._id.toString()
      );
      return {
        _id: c._id,
        name: c.name,
        description: c.description,
        category: c.category,
        image: c.image,
        joinCode: c.joinCode,
        role: membership?.role ?? "member",
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ communities: result });
  } catch (err) {
    console.error("GET /api/communities error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/communities — create a new community
export async function POST(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await request.json();
    const { name, description, category, image } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Community name is required." }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Community.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json(
        { error: "A community with this name already exists." },
        { status: 409 }
      );
    }

    const community = await Community.create({
      name: name.trim(),
      description: description?.trim() ?? "",
      category: category?.trim() ?? "",
      image: image ?? "",
      ownerId: payload.userId,
    });

    await CommunityMember.create({
      communityId: community._id,
      userId: payload.userId,
      role: "owner",
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (err) {
    console.error("POST /api/communities error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
