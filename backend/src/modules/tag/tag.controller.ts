import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { createTagService, getTagsService } from "./tag.service";
import { ApiResponse } from "../../utils/ApiResponse";

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tag = await createTagService(userId, req.body.name);
  res.status(201).json(new ApiResponse(201, tag));
});

export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tags = await getTagsService(userId);
  res.status(200).json(new ApiResponse(200, tags));
});