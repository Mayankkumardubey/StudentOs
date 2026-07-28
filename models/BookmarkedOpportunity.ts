import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookmarkedOpportunity extends Document {
  userId: mongoose.Types.ObjectId;
  opportunityId: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  salary: string;
  postedDate: string;
  redirectUrl: string;
  createdAt: Date;
}

const BookmarkedOpportunitySchema = new Schema<IBookmarkedOpportunity>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    opportunityId: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, default: "" },
    mode: { type: String, default: "Onsite" },
    salary: { type: String, default: "" },
    postedDate: { type: String, default: "" },
    redirectUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

BookmarkedOpportunitySchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

const BookmarkedOpportunity: Model<IBookmarkedOpportunity> =
  mongoose.models.BookmarkedOpportunity ||
  mongoose.model<IBookmarkedOpportunity>("BookmarkedOpportunity", BookmarkedOpportunitySchema);

export default BookmarkedOpportunity;
