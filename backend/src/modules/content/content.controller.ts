import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  createContentService,
  getContentService,
  deleteContentService,
} from "./content.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { CreateContentDTO } from "./content.types";
import { GetContentQuery } from "./content.types";

export const createContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const data = req.body as CreateContentDTO;
  const content = await createContentService(userId, data);
  res.status(201).json(
    new ApiResponse(content, "Content created")
  );
});

export const getContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const query=req.validatedQuery as GetContentQuery
  const content = await getContentService(userId, query);
  res.status(200).json(
    new ApiResponse(content.data, "Content fetched", {
      nextCursor: content.nextCursor,
    })
  );
});

export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const content = await deleteContentService(req.params.id as string, userId);
  res.status(200).json(
    new ApiResponse(null, "Content deleted")
  );
});