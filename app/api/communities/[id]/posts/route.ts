import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import CommunityMember from "@/models/CommunityMember";
import CommunityPost from "@/models/CommunityPost";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// GET /api/communities/[id]/posts — list posts (newest first)
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

    const membership = await CommunityMember.findOne({
      communityId: id,
      userId: payload.userId,
    }).lean();

    if (!membership) {
      return NextResponse.json({ error: "Not a member." }, { status: 403 });
    }

    const posts = await CommunityPost.find({ communityId: id })
      .sort({ createdAt: -1 })
      .populate("authorId", "username avatarBase64")
      .lean();

    const result = posts.map((p) => {
      const author = p.authorId as unknown as { username?: string; avatarBase64?: string };
      return {
        _id: p._id,
        author: {
          username: author?.username ?? "Unknown",
          avatarBase64: author?.avatarBase64 ?? "",
        },
        text: p.text,
        attachments: p.attachments,
        comments: p.comments.map((c) => ({
          _id: c._id,
          author: c.authorId,
          text: c.text,
          replies: c.replies,
          createdAt: c.createdAt,
        })),
        commentCount: p.comments.length,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({ posts: result });
  } catch (err) {
    console.error("GET /api/communities/[id]/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/communities/[id]/posts — create a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { text, attachments } = body;

    // Validate: must have text or at least one attachment
    const hasText = text && typeof text === "string" && text.trim();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasText && !hasAttachments) {
      return NextResponse.json(
        { error: "Post must contain text or an attachment." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const membership = await CommunityMember.findOne({
      communityId: id,
      userId: payload.userId,
    }).lean();

    if (!membership) {
      return NextResponse.json({ error: "Not a member." }, { status: 403 });
    }

    const post = await CommunityPost.create({
      communityId: id,
      authorId: payload.userId,
      text: hasText ? text.trim() : "",
      attachments: hasAttachments ? attachments : [],
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("POST /api/communities/[id]/posts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
