import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoadmap extends Document {
  userId: mongoose.Types.ObjectId;
  goal: string;
  timeframe: string;
  content: string;
  completedPhases: number[];
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    goal:   { type: String, required: true },
    timeframe: { type: String, required: true },
    content:   { type: String, required: true },
    completedPhases: [{ type: Number }],
  },
  { timestamps: true }
);

// Fast lookups by user, newest first
RoadmapSchema.index({ userId: 1, createdAt: -1 });

const Roadmap: Model<IRoadmap> =
  mongoose.models.Roadmap || mongoose.model<IRoadmap>("Roadmap", RoadmapSchema);

export default Roadmap;
