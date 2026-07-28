import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttachment {
  type: "image" | "pdf";
  data: string;
  filename: string;
}

export interface IComment {
  authorId: mongoose.Types.ObjectId;
  text: string;
  replies: {
    authorId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  communityId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  text: string;
  attachments: IAttachment[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CommentSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    replies: [ReplySchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AttachmentSchema = new Schema(
  {
    type: { type: String, enum: ["image", "pdf"], required: true },
    data: { type: String, required: true },
    filename: { type: String, required: true },
  },
  { _id: false }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
  },
  { timestamps: true }
);

CommunityPostSchema.index({ communityId: 1, createdAt: -1 });

const CommunityPost: Model<ICommunityPost> =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>("CommunityPost", CommunityPostSchema);

export default CommunityPost;
