import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { validate } from "../../utils/validate";
import {
  listUsersService,
  getUserContentService,
  adminDeleteContentService,
  adminDeleteTagService,
  adminDisableShareService,
} from "./admin.service";

const userIdSchema = z.object({
  userId: z.string().uuid(),
});

const contentIdSchema = z.object({
  id: z.string().uuid(),
});

const tagIdSchema = z.object({
  id: z.string().uuid(),
});

const shareIdSchema = z.object({
  shareId: z.string().min(1),
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listUsersService();
  res.status(200).json(new ApiResponse(users, "Users fetched"));
});

export const getUserContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = validate(userIdSchema, req.params);
    const content = await getUserContentService(userId);
    res.status(200).json(new ApiResponse(content, "Content fetched"));
  }
);

export const deleteContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = validate(contentIdSchema, req.params);
    const result = await adminDeleteContentService(id);
    res.status(200).json(new ApiResponse(result, "Content deleted"));
  }
);

export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  const { id } = validate(tagIdSchema, req.params);
  const result = await adminDeleteTagService(id);
  res.status(200).json(new ApiResponse(result, "Tag deleted"));
});

export const disableShare = asyncHandler(
  async (req: Request, res: Response) => {
    const { shareId } = validate(shareIdSchema, req.params);
    const share = await adminDisableShareService(shareId);
    res.status(200).json(new ApiResponse(share, "Share disabled"));
  }
);
