import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  description: string;
  category: string;
  image: string;
  joinCode: string;
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    image: { type: String, default: "" },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      default: generateJoinCode,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

CommunitySchema.index({ name: "text" });

const Community: Model<ICommunity> =
  mongoose.models.Community ||
  mongoose.model<ICommunity>("Community", CommunitySchema);

export default Community;
