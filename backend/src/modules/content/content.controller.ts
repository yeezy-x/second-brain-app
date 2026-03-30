import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  createContentService,
  getContentService,
  deleteContentService,
} from "./content.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";

export const createContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const content = await createContentService(userId, req.body);
  res.status(201).json(new ApiResponse(201, content));
});

export const getContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const content = await getContentService(userId, req.validatedQuery);
  res.status(200).json(new ApiResponse(200, content));
});

export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const content = await deleteContentService(req.params.id as string, userId);
  res.status(200).json(new ApiResponse(200, null, "Deleted"));
});