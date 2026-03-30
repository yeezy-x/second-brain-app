import mongoose, { Schema, Document } from "mongoose";

export interface IShare extends Document{
    userId: mongoose.Types.ObjectId;
    shareId: string;
    isActive: boolean;
}

const shareSchema=new Schema<IShare>({
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    shareId: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
})

export const Share=mongoose.model<IShare>("Share", shareSchema)