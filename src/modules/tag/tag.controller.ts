import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  createTagService,
  getSingleTagService,
  getTagsService,
} from "./tag.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { validate } from "../../utils/validate";
import { z } from "zod";

function requireUser(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return req.user.id;
}

const createTagSchema = z.object({
  name: z.string().min(1),
});

const idParamSchema = z.object({
  id: z.string().min(1), 
});

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const { name } = validate(createTagSchema, req.body);
  const tag = await createTagService(userId, name);
  res.status(201).json(new ApiResponse(tag, "Tag created", req.id));
});

export const getTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const { id } = validate(idParamSchema, req.params);
  const tag = await getSingleTagService(userId, id);
  res.status(200).json(new ApiResponse(tag, "Tag retrieved", req.id));
});

export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const tags = await getTagsService(userId);
  res.status(200).json(new ApiResponse(tags, "Tags retrieved", req.id));
});