import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { status: "error", message: "Email and password are required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json(
                { status: "error", message: "Invalid email or password" },
                { status: 401 }
            );
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return NextResponse.json(
                { status: "error", message: "Invalid email or password" },
                { status: 401 }
            );
        }

        const token = await signToken({ userId: user._id.toString() });

        const response = NextResponse.json({
            status: "success",
            message: "Login successful",
            user: { id: user._id, email: user.email },
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
        console.error("Login error:", error);
        return NextResponse.json(
            { status: "error", message: "Login failed" },
            { status: 500 }
        );
    }
}