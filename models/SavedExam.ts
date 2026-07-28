import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedExam extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  reason: string;
  timeline: string;
  category: "government" | "private";
  examDate: string;
  reminderEnabled: boolean;
  createdAt: Date;
}

const SavedExamSchema = new Schema<ISavedExam>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    reason: { type: String, required: true },
    timeline: { type: String, required: true },
    category: { type: String, enum: ["government", "private"], required: true },
    examDate: { type: String, default: "" },
    reminderEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SavedExamSchema.index({ userId: 1, name: 1 }, { unique: true });

const SavedExam: Model<ISavedExam> =
  mongoose.models.SavedExam ||
  mongoose.model<ISavedExam>("SavedExam", SavedExamSchema);

export default SavedExam;
