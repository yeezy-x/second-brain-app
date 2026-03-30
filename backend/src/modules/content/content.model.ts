import mongoose, { Schema, Document } from "mongoose";

export interface IContent extends Document {
  userId:mongoose.Types.ObjectId;
  type:"tweet" | "video" | "document" | "link";
  title?:string;
  description?:string;
  url?: string;
  metadata?: Record<string, any>;
  tags: string[];
  createdAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["tweet", "video", "document", "link"],
      required: true,
      index: true,
    },
    title: String,
    description: String,
    url: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  { timestamps: true }
);

contentSchema.index({ userId: 1, createdAt: -1 });
contentSchema.index({ userId: 1, type: 1 });
contentSchema.index({ userId: 1, tags: 1 });
contentSchema.index(
  { userId: 1, url: 1 },
  { unique: true, sparse: true }
);

export const Content = mongoose.model<IContent>("Content", contentSchema);