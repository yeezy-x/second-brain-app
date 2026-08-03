import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { prefillFromUrlService, streamChatService } from "./ai.service";
import type { ChatDTO, PrefillDTO } from "./ai.validation";

export const prefill = asyncHandler(async (req: Request, res: Response) => {
  const data = req.validatedBody as PrefillDTO;
  const result = await prefillFromUrlService(data);
  return res.status(200).json(
    new ApiResponse(result, "Prefill generated", req.id)
  );
});

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const data = req.validatedBody as ChatDTO;
    await streamChatService(userId, data, res);
  } catch (err) {
    if (res.headersSent) {
      res.end();
      return;
    }
    next(err);
  }
};
