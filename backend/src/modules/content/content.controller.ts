import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  createContentService,
  getContentService,
  deleteContentService,
  addContentTagService,
} from "./content.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { CreateContentDTO, GetContentQuery } from "./content.types";

export const createContent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const data = req.validatedBody as CreateContentDTO;
    const content = await createContentService(userId, data);
    return res.status(201).json(
      new ApiResponse(content, "Content created", req.id)
    );
  }
);

export const getContent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const query = req.validatedQuery as GetContentQuery;
    const result = await getContentService(userId, query);
    return res.status(200).json(
      new ApiResponse(
        {
          items: result.data,
          nextCursor: result.nextCursor,
        },
        "Content fetched",
        req.id
      )
    );
  }
);

export const deleteContent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.validatedParams as { id: string };
    await deleteContentService(id, userId);
    return res.status(200).json(
      new ApiResponse(null, "Content deleted", req.id)
    );
  }
);

export const addContentTag = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.validatedParams as { id: string };
    const { tag } = req.validatedBody as { tag: string };
    const content = await addContentTagService(id, userId, tag);
    return res.status(200).json(
      new ApiResponse(content, "Tag added", req.id)
    );
  }
);