import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  createShareService,
  getSharedContentService,
  disableShareService
} from "./share.service";
import { ApiResponse } from "../../utils/ApiResponse";

export const createShare = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const share = await createShareService(userId);
  res.status(200).json(new ApiResponse(null, "Share link created"));
});

export const getSharedContent = asyncHandler(
  async (req: Request, res: Response) => {
    const content = await getSharedContentService(req.params.shareId as string);
    res.status(200).json(new ApiResponse(null, "Shared content retrieved", content));
  }
);

export const disableShare=asyncHandler(async(req: Request, res: Response)=>{
  const share=await disableShareService(req.params.shareId as string, req.user!.id)
  res.status(200).json(new ApiResponse(null, "Share link disabled"));
})