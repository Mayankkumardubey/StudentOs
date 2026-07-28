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

// POST /api/communities/join — join via communityId or joinCode
export async function POST(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await request.json();
    const { communityId, joinCode } = body;

    if (!communityId && !joinCode) {
      return NextResponse.json(
        { error: "Provide a community ID or join code." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let community;
    if (joinCode) {
      community = await Community.findOne({ joinCode: joinCode.trim().toUpperCase() });
    } else {
      community = await Community.findById(communityId);
    }

    if (!community) {
      return NextResponse.json(
        { error: "Community not found. Check the join code and try again." },
        { status: 404 }
      );
    }

    const existing = await CommunityMember.findOne({
      communityId: community._id,
      userId: payload.userId,
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already a member of this community." },
        { status: 409 }
      );
    }

    await CommunityMember.create({
      communityId: community._id,
      userId: payload.userId,
      role: "member",
    });

    return NextResponse.json({
      message: "Joined successfully.",
      community: {
        _id: community._id,
        name: community.name,
        description: community.description,
        category: community.category,
        image: community.image,
      },
    });
  } catch (err) {
    console.error("POST /api/communities/join error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
