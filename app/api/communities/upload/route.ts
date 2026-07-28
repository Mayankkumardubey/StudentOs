import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

// POST /api/communities/upload — upload image or PDF, return base64
export async function POST(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isPdf = ALLOWED_DOC_TYPES.includes(file.type);

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WEBP, PDF." },
        { status: 400 }
      );
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 5 MB." },
        { status: 400 }
      );
    }

    if (isPdf && file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: "PDF must be under 10 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      attachment: {
        type: isImage ? "image" : "pdf",
        data: dataUrl,
        filename: file.name,
      },
    });
  } catch (err) {
    console.error("POST /api/communities/upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
