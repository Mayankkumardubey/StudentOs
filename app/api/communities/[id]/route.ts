import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Community from "@/models/Community";
import CommunityMember from "@/models/CommunityMember";
import CommunityPost from "@/models/CommunityPost";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// GET /api/communities/[id] — community detail with member list
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const community = await Community.findById(id).lean();
    if (!community) {
      return NextResponse.json({ error: "Community not found." }, { status: 404 });
    }

    // Check membership
    const membership = await CommunityMember.findOne({
      communityId: id,
      userId: payload.userId,
    }).lean();

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this community." },
        { status: 403 }
      );
    }

    // Get members with user info
    const memberDocs = await CommunityMember.find({ communityId: id })
      .populate("userId", "username email avatarBase64")
      .lean();

    const members = memberDocs.map((m) => {
      const user = m.userId as unknown as { username?: string; avatarBase64?: string };
      return {
        _id: m._id,
        role: m.role,
        username: user?.username ?? "Unknown",
        avatarBase64: user?.avatarBase64 ?? "",
      };
    });

    const postCount = await CommunityPost.countDocuments({ communityId: id });

    return NextResponse.json({
      community: {
        _id: community._id,
        name: community.name,
        description: community.description,
        category: community.category,
        image: community.image,
        joinCode: community.joinCode,
        role: membership.role,
        createdAt: community.createdAt,
      },
      members,
      memberCount: members.length,
      postCount,
    });
  } catch (err) {
    console.error("GET /api/communities/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/communities/[id] — leave community (or delete if owner)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const membership = await CommunityMember.findOne({
      communityId: id,
      userId: payload.userId,
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member." }, { status: 404 });
    }

    if (membership.role === "owner") {
      // Delete community, all members, and all posts
      await Community.findByIdAndDelete(id);
      await CommunityMember.deleteMany({ communityId: id });
      await CommunityPost.deleteMany({ communityId: id });
      return NextResponse.json({ message: "Community deleted." });
    }

    // Regular member — just remove membership
    await CommunityMember.findByIdAndDelete(membership._id);
    return NextResponse.json({ message: "Left community." });
  } catch (err) {
    console.error("DELETE /api/communities/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
