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

// GET /api/communities/search?q=... — search communities by name
export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) {
      return NextResponse.json({ communities: [] });
    }

    await connectToDatabase();

    const communities = await Community.find({
      name: { $regex: q, $options: "i" },
    })
      .limit(20)
      .lean();

    // Attach member count and whether user is already a member
    const communityIds = communities.map((c) => c._id);
    const memberships = await CommunityMember.find({
      communityId: { $in: communityIds },
    }).lean();

    const result = communities.map((c) => {
      const memberCount = memberships.filter(
        (m) => m.communityId.toString() === c._id.toString()
      ).length;
      const isMember = memberships.some(
        (m) =>
          m.communityId.toString() === c._id.toString() &&
          m.userId.toString() === payload.userId
      );
      return {
        _id: c._id,
        name: c.name,
        description: c.description,
        category: c.category,
        image: c.image,
        memberCount,
        isMember,
      };
    });

    return NextResponse.json({ communities: result });
  } catch (err) {
    console.error("GET /api/communities/search error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
