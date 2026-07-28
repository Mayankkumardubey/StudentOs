import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedResource extends Document {
  userId: mongoose.Types.ObjectId;
  playlistName: string;
  title: string;
  url: string;
  type: "video" | "book" | "article" | "other";
  createdAt: Date;
}

const SavedResourceSchema = new Schema<ISavedResource>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    playlistName: { type: String, required: true, default: "General" },
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["video", "book", "article", "other"], default: "other" },
  },
  { timestamps: true }
);

SavedResourceSchema.index({ userId: 1, playlistName: 1 });

const SavedResource: Model<ISavedResource> =
  mongoose.models.SavedResource ||
  mongoose.model<ISavedResource>("SavedResource", SavedResourceSchema);

export default SavedResource;