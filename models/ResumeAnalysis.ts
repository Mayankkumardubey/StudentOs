import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResumeAnalysis extends Document {
    userId: mongoose.Types.ObjectId;
    fileName: string;
    matchScore: number | null;
    analysis: {
        matchScore: number | null;
        strengths: string[];
        weaknesses: string[];
        missingSkills: string[];
        suggestions: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        fileName: { type: String, required: true },
        matchScore: { type: Number, default: null },
        analysis: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

// Fast lookups for the user's history
ResumeAnalysisSchema.index({ userId: 1, createdAt: -1 });

const ResumeAnalysis: Model<IResumeAnalysis> =
    mongoose.models.ResumeAnalysis || mongoose.model<IResumeAnalysis>("ResumeAnalysis", ResumeAnalysisSchema);

export default ResumeAnalysis;
