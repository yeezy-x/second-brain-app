import { ApiError } from "../../utils/ApiError";
import { Content } from "../content/content.model";
import { Share } from "./share.model"
import {nanoid} from "nanoid"

export const createShareService=async(userId: string)=>{
    const existing=await Share.findOne({userId});
    if(existing){ return existing; }
    const shareId=nanoid(10);
    return Share.create({
        userId,
        shareId
    })
}

export const getSharedContentService = async (shareId: string) => {
  const share = await Share.findOne({ shareId, isActive: true });
  if (!share) {
    throw new ApiError(404, "Share not found");
  }
  return Content.find({ userId: share.userId }).sort({ createdAt: -1 });
};