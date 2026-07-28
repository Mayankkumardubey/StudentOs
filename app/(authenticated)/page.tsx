import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import DashboardShell from "@/components/DashboardShell";

async function getUserProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect("/login");
  }

  await connectToDatabase();

  const user = await User.findById(payload.userId).select(
    "username degree branch cgpa preferredCareerPath email avatarBase64"
  );

  if (!user) {
    redirect("/login");
  }

  return {
    username: user.username,
    degree: user.degree,
    branch: user.branch,
    cgpa: user.cgpa,
    careerPath: user.preferredCareerPath,
    email: user.email,
    avatarBase64: user.avatarBase64,
  };
}

export default async function DashboardPage() {
  const profile = await getUserProfile();

  return <DashboardShell profile={profile} />;
}
