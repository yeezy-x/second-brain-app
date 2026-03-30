import { ApiError } from "../../utils/ApiError"
import { Tag } from "./tag.model"
export const createTagService=async(userId:string,name:string)=>{
    if(!name){
        throw new ApiError(400,"Tag name required")
    }
    try{
        return await Tag.create({name, userId})
    } catch (err:any) {
        if(err.code===11000){
            throw new ApiError(400,"Tag already exists")
        }
        throw err;
    }
}
export const getTagsService = async (userId: string) => {
  return Tag.find({ userId }).sort({ createdAt: -1 });
};