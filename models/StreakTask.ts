import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStreakTask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  totalDays: number;
  startDate: Date;
  completedDates: string[];
  status: "active" | "completed" | "abandoned";
}

const StreakTaskSchema = new Schema<IStreakTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    totalDays: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true, default: Date.now },
    completedDates: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true }
);

StreakTaskSchema.index({ userId: 1, status: 1 });

const StreakTask: Model<IStreakTask> =
  mongoose.models.StreakTask ||
  mongoose.model<IStreakTask>("StreakTask", StreakTaskSchema);

export default StreakTask;
