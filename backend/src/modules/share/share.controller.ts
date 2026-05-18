import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  createShareService,
  getSharedContentService,
  disableShareService,
} from "./share.service";
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

const shareIdSchema = z.object({
  shareId: z.string().min(1),
});

export const createShare = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const share = await createShareService(userId);
  res.status(200).json(new ApiResponse(share, "Share link created", req.id));
});

export const getSharedContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { shareId } = validate(shareIdSchema, req.params);
    const content = await getSharedContentService(shareId);
    res.status(200).json(new ApiResponse(content, "Shared content retrieved", req.id));
  }
);

export const disableShare = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUser(req);
    const { shareId } = validate(shareIdSchema, req.params);
    const share = await disableShareService(shareId, userId);
    res.status(200).json(new ApiResponse(share, "Share link disabled", req.id));
  }
);