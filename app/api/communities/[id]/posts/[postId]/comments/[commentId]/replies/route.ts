import mongoose from "mongoose";
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

// POST — add a reply to a comment (1 nesting level)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; postId: string; commentId: string }> }
) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { id, postId, commentId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Reply text is required." }, { status: 400 });
    }

    await connectToDatabase();

    const membership = await CommunityMember.findOne({
      communityId: id,
      userId: payload.userId,
    }).lean();
    if (!membership) return NextResponse.json({ error: "Not a member." }, { status: 403 });

    const post = await CommunityPost.findById(postId);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    const comment = post.comments.id(commentId);
    if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

    comment.replies.push({
      authorId: new mongoose.Types.ObjectId(payload.userId),
      text: text.trim(),
      createdAt: new Date(),
    });

    await post.save();

    const newReply = comment.replies[comment.replies.length - 1];

    return NextResponse.json({ reply: newReply }, { status: 201 });
  } catch (err) {
    console.error("POST reply error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
