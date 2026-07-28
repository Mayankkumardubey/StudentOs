import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// ── Shared helper ─────────────────────────────────────────────────────────────
function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function authenticate(request: Request) {
  const token = extractToken(request);
  if (!token) return null;
  return await verifyToken(token); // returns payload or null
}

// ── GET /api/user/profile ─────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(payload.userId).select(
      "email username degree branch cgpa preferredCareerPath jobPreference " +
      "higherStudiesInterest selfRatedSkillLevel targetSalaryRange " +
      "dailyStudyHours avatarBase64"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      username: user.username ?? "",
      degree: user.degree,
      branch: user.branch,
      cgpa: user.cgpa,
      preferredCareerPath: user.preferredCareerPath,
      jobPreference: user.jobPreference,
      higherStudiesInterest: user.higherStudiesInterest,
      selfRatedSkillLevel: user.selfRatedSkillLevel,
      targetSalaryRange: user.targetSalaryRange,
      dailyStudyHours: user.dailyStudyHours,
      avatarBase64: user.avatarBase64 ?? "",
    });
  } catch (err) {
    console.error("GET /api/user/profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/user/profile ───────────────────────────────────────────────────
export async function PATCH(request: Request) {
  try {
    const payload = await authenticate(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Whitelist of fields the user is allowed to update (email is excluded)
    const allowedFields = [
      "username",
      "degree",
      "branch",
      "cgpa",
      "preferredCareerPath",
      "jobPreference",
      "higherStudiesInterest",
      "selfRatedSkillLevel",
      "targetSalaryRange",
      "dailyStudyHours",
      "avatarBase64",
    ] as const;

    // Build a safe update object from only the whitelisted fields present in the body
    const updates: Partial<Record<(typeof allowedFields)[number], unknown>> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    // Validate username format if provided
    if (
      "username" in updates &&
      (typeof updates.username !== "string" || !/^[a-zA-Z0-9]+$/.test(updates.username))
    ) {
      return NextResponse.json(
        { error: "Username can only contain letters and numbers." },
        { status: 422 }
      );
    }

    // Validate CGPA range if provided
    if (
      "cgpa" in updates &&
      (typeof updates.cgpa !== "number" || updates.cgpa < 0 || updates.cgpa > 10)
    ) {
      return NextResponse.json({ error: "CGPA must be a number between 0 and 10." }, { status: 422 });
    }

    // Validate dailyStudyHours if provided
    if (
      "dailyStudyHours" in updates &&
      (typeof updates.dailyStudyHours !== "number" || updates.dailyStudyHours < 0)
    ) {
      return NextResponse.json({ error: "Daily study hours must be a non-negative number." }, { status: 422 });
    }

    await connectToDatabase();

    try {
      const updated = await User.findByIdAndUpdate(
        payload.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select(
        "email username degree branch cgpa preferredCareerPath jobPreference " +
        "higherStudiesInterest selfRatedSkillLevel targetSalaryRange " +
        "dailyStudyHours avatarBase64"
      );

      if (!updated) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        message: "Profile updated successfully.",
        profile: {
          email: updated.email,
          username: updated.username ?? "",
          degree: updated.degree,
          branch: updated.branch,
          cgpa: updated.cgpa,
          preferredCareerPath: updated.preferredCareerPath,
          jobPreference: updated.jobPreference,
          higherStudiesInterest: updated.higherStudiesInterest,
          selfRatedSkillLevel: updated.selfRatedSkillLevel,
          targetSalaryRange: updated.targetSalaryRange,
          dailyStudyHours: updated.dailyStudyHours,
          avatarBase64: updated.avatarBase64 ?? "",
        },
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return NextResponse.json({ error: "Username already taken, please choose another" }, { status: 409 });
      }
      console.error("PATCH /api/user/profile error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (err) {
    console.error("PATCH /api/user/profile outer error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}