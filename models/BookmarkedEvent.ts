import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookmarkedEvent extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: string;
  name: string;
  venue: string;
  date: string;
  category: string;
  redirectUrl: string;
  createdAt: Date;
}

const BookmarkedEventSchema = new Schema<IBookmarkedEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: String, required: true },
    name: { type: String, required: true },
    venue: { type: String, default: "" },
    date: { type: String, default: "" },
    category: { type: String, default: "" },
    redirectUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

BookmarkedEventSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const BookmarkedEvent: Model<IBookmarkedEvent> =
  mongoose.models.BookmarkedEvent ||
  mongoose.model<IBookmarkedEvent>("BookmarkedEvent", BookmarkedEventSchema);

export default BookmarkedEvent;
