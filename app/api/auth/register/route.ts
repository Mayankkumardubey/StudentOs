import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      username,
      degree,
      branch,
      cgpa,
      preferredCareerPath,
      jobPreference,
      higherStudiesInterest,
      selfRatedSkillLevel,
      targetSalaryRange,
      dailyStudyHours,
    } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { status: "error", message: "Email, password, and username are required" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return NextResponse.json(
        { status: "error", message: "Username can only contain letters and numbers" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { status: "error", message: "User already exists with this email" },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { status: "error", message: "Username already taken, please choose another" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    let newUser;
    try {
      newUser = await User.create({
        email,
        password: hashedPassword,
        username,
        degree,
        branch,
        cgpa,
        preferredCareerPath,
        jobPreference,
        higherStudiesInterest,
        selfRatedSkillLevel,
        targetSalaryRange,
        dailyStudyHours,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return NextResponse.json(
          { status: "error", message: "Email or username already taken" },
          { status: 409 }
        );
      }
      throw err;
    }

    const token = await signToken({ userId: newUser._id.toString() });

    const response = NextResponse.json({
      status: "success",
      message: "User registered successfully",
      user: { id: newUser._id, email: newUser.email, username: newUser.username },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { status: "error", message: "Registration failed" },
      { status: 500 }
    );
  }
}