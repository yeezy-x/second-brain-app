import mongoose, { Schema, Document } from "mongoose";
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

export const contentSchema = new Schema<IContent>(
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
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    url: { type: String, trim: true , lowercase: true},
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "Tag"
      }
    ],
    metadata: {
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
    metadataStatus:{
      type: String,
      enum: ["pending", "done", "failed"],
      default: "pending"
    }

  },
  { timestamps: true }
);

/*contentSchema.index({ userId: 1 }); */
contentSchema.index({ userId: 1, createdAt: -1, _id: 1 });
contentSchema.index({ userId: 1, type: 1, createdAt: -1, _id: 1 });
contentSchema.index({ userId: 1, tags: 1, createdAt: -1, _id: 1 });
contentSchema.index({ userId: 1, url: 1 },{
    unique: true,
    partialFilterExpression: { url: { $exists: true, $ne: null } },
  });
contentSchema.index(
  { userId: 1, title: "text", description: "text" },
  { weights: { title: 5, description: 2 } }
);
contentSchema.index({ metadataStatus: 1 });

export const Content = mongoose.model<IContent>("Content", contentSchema);
