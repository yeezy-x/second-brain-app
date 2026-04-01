import mongoose, { Schema, Document } from "mongoose";
import { Tag } from "../tag/tag.model";
export interface IContent{
  userId:mongoose.Types.ObjectId;
  type:"tweet" | "video" | "document" | "link";
  title?:string;
  description?:string;
  url?: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
  };
  tags: mongoose.Types.ObjectId[];
  createdAt: Date;
  metadataStatus: "pending" | "done" | "failed";
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
      required: true
    },
    title: String,
    description: String,
    url: String,
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag"
      }
    ],
    metadata: {
      title: String,
      description: String,
      image: String,
    },
    metadataStatus:{
      type: String,
      enum: ["pending", "done", "failed"],
      default: "pending"
    }

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
contentSchema.index({
  title:"text",
  description:"text"
})

export const Content = mongoose.model<IContent>("Content", contentSchema);