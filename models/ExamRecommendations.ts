import mongoose, { Schema, Document, Model } from "mongoose";

interface ExamEntry {
  name: string;
  reason: string;
  timeline: string;
}

export interface IExamRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  interests: string;
  governmentExams: ExamEntry[];
  privateExams: ExamEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ExamEntrySchema = new Schema<ExamEntry>(
  {
    name: { type: String, required: true },
    reason: { type: String, required: true },
    timeline: { type: String, required: true },
  },
  { _id: false }
);

const ExamRecommendationSchema = new Schema<IExamRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    interests: { type: String, default: "" },
    governmentExams: { type: [ExamEntrySchema], default: [] },
    privateExams: { type: [ExamEntrySchema], default: [] },
  },
  { timestamps: true }
);

ExamRecommendationSchema.index({ userId: 1, createdAt: -1 });

const ExamRecommendation: Model<IExamRecommendation> =
  mongoose.models.ExamRecommendation ||
  mongoose.model<IExamRecommendation>("ExamRecommendation", ExamRecommendationSchema);

export default ExamRecommendation;