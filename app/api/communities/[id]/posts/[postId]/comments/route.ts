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

// GET — list comments for a post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { id, postId } = await params;
    await connectToDatabase();

    const membership = await CommunityMember.findOne({
      communityId: id,
      userId: payload.userId,
    }).lean();
    if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

    const post = await CommunityPost.findById(postId).lean();
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    return NextResponse.json({ comments: post.comments });
  } catch (err) {
    console.error("GET comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — add a comment to a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { id, postId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Comment text is required." }, { status: 400 });
    }

    await connectToDatabase();

    const membership = await CommunityMember.findOne({
      communityId: id,
      userId: payload.userId,
    }).lean();
    if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

    const post = await CommunityPost.findById(postId);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    post.comments.push({
      authorId: payload.userId,
      text: text.trim(),
      replies: [],
      createdAt: new Date(),
    });

    await post.save();

    const newComment = post.comments[post.comments.length - 1];

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (err) {
    console.error("POST comment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
