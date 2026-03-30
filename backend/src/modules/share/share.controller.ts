import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  createShareService,
  getSharedContentService,
} from "./share.service";
import { ApiResponse } from "../../utils/ApiResponse";

export const createShare = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const share = await createShareService(userId);
  res.status(200).json(new ApiResponse(200, share));
});

export const getSharedContent = asyncHandler(
  async (req: Request, res: Response) => {
    const content = await getSharedContentService(req.params.shareId as string);
    res.status(200).json(new ApiResponse(200, content));
  }
);