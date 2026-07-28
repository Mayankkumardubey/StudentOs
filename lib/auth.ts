import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
    throw new Error("Please define the JWT_SECRET environment variable inside .env");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(
    password: string,
    hashed: string
): Promise<boolean> {
    return bcrypt.compare(password, hashed);
}

export async function signToken(payload: { userId: string }): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secretKey);
}

export async function verifyToken(
    token: string
): Promise<{ userId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload as { userId: string };
    } catch {
        return null;
    }
}