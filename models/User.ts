import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  degree: string;
  branch: string;
  cgpa: number;
  preferredCareerPath: string;
  jobPreference: string;
  higherStudiesInterest: "Yes" | "No" | "Undecided";
  selfRatedSkillLevel: "Beginner" | "Intermediate" | "Advanced";
  targetSalaryRange: string;
  dailyStudyHours: number;
  avatarBase64?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HigherStudiesEnum = ["Yes", "No", "Undecided"] as const;
const SkillLevelEnum = ["Beginner", "Intermediate", "Advanced"] as const;

const UserSchema: Schema<IUser> = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers."],
    },
    degree: { type: String, required: true },
    branch: { type: String, required: true },
    cgpa: { type: Number, required: true, min: 0, max: 10 },
    preferredCareerPath: { type: String, required: true },
    jobPreference: { type: String, required: true },
    higherStudiesInterest: {
      type: String,
      enum: HigherStudiesEnum,
      required: true,
    },
    selfRatedSkillLevel: {
      type: String,
      enum: SkillLevelEnum,
      required: true,
    },
    targetSalaryRange: { type: String, required: true },
    dailyStudyHours: { type: Number, required: true, min: 0 },
    avatarBase64: { type: String, default: "" },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;