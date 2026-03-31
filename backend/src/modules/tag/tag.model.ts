import mongoose ,{Schema, Document} from "mongoose";

interface ITag extends Document {
    name: string;
    userId: mongoose.Types.ObjectId;
}

const tagSchema=new Schema<ITag>({
    name:{
        type:String,
        required: true,
        trim: true,
        lowercase: true,
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
},{timestamps: true});

tagSchema.index({ name: 1, userId: 1 }, { unique: true });

export const Tag = mongoose.model<ITag>("Tag", tagSchema);