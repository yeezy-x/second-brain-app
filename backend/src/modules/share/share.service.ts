import { ApiError } from "../../utils/ApiError";
import { getContentByUserId } from "../content/content.service";
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
  if (!share.isActive) {
    throw new ApiError(403, "Share link disabled");
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw new ApiError(403, "Share link expired");
  }
  const content=await getContentByUserId(share.userId.toString());
  return content;
};

export const disableShareService = async (id: string, userId: string) => {
  const share=await Share.findOne({ _id: id, userId });
  if(!share) {
    throw new ApiError(404, "Share not found");
  }
  share.isActive=false;
  await share.save();
  return share
}