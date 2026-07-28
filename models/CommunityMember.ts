import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunityMember extends Document {
  communityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "owner" | "member";
  createdAt: Date;
}

const CommunityMemberSchema = new Schema<ICommunityMember>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member",
      required: true,
    },
  },
  { timestamps: true }
);

CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
CommunityMemberSchema.index({ userId: 1 });

const CommunityMember: Model<ICommunityMember> =
  mongoose.models.CommunityMember ||
  mongoose.model<ICommunityMember>("CommunityMember", CommunityMemberSchema);

export default CommunityMember;
