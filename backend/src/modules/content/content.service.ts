import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { extractMetadata } from "../../utils/metadata";
import { Content } from "./content.model";
import { ContentType, CreateContentDTO } from "./content.types";
import { GetContentQuery } from "./content.types";
import { Tag } from "../tag/tag.model";

export const createContentService = async (
  userId: string,
  data: CreateContentDTO
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!data.type) {
      throw new ApiError(400, "Content type is required");
    }
    if (
      ["video", "link", "tweet"].includes(data.type) &&
      !data.url
    ) {
      throw new ApiError(400, "URL is required");
    }
    if (data.type === "document" && !data.title) {
      throw new ApiError(400, "Title is required");
    }
    const normalizedTags = data.tags?.length
      ? [...new Set(data.tags.map(t => t.trim().toLowerCase()))]
      : [];
    const existingTags = await Tag.find({
      name: { $in: normalizedTags },
      userId,
    }).session(session);
    const existingMap = new Map(
      existingTags.map(tag => [tag.name, tag])
    );
    const newTagsData = normalizedTags
      .filter(name => !existingMap.has(name))
      .map(name => ({ name, userId }));
    const newTags = newTagsData.length
      ? await Tag.insertMany(newTagsData, { session })
      : [];
    const tagIds = [
      ...existingTags.map(t => t._id),
      ...newTags.map(t => t._id),
    ];
    const [content] = await Content.create(
      [
        {
          userId,
          type: data.type,
          title: data.title,
          description: data.description,
          url: data.url,
          tags: tagIds,
        },
      ],
      { session }
    );
    await session.commitTransaction();
    if (data.url) {
      extractMetadata(data.url)
        .then(async (metadata) => {
          await Content.findByIdAndUpdate(content._id, { metadata });
        })
        .catch((err) => {
          console.error("Metadata failed:", err);
        });
    }
    return content;
  } catch (error: any) {
    await session.abortTransaction();
    if (error.code === 11000) {
      throw new ApiError(409, "Content already exists");
    }
    throw error;
  } finally {
    session.endSession();
  }
};
export const getContentService = async (
  userId: string,
  query: GetContentQuery
) => {
  const { type, tag, cursor, limit = 10 } = query;
  const parsedLimit = Math.min(Number(limit) || 10, 50);
  const filter: any = {
    userId: new mongoose.Types.ObjectId(userId),
  };
  if (type) filter.type = type;
  if (tag) {
    filter.tags = { $in: [tag.toLowerCase()] };
  }
  let cursorData: { createdAt: string; _id: string } | null = null;
  if (cursor) {
    try {
      cursorData = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8")
      );
    } catch {
      throw new Error("Invalid cursor");
    }
  }
  if (cursorData) {
    const cursorDate = new Date(cursorData.createdAt);
    const cursorId = new mongoose.Types.ObjectId(cursorData._id);
    filter.$or = [
      { createdAt: { $lt: cursorDate } },
      {
        createdAt: cursorDate,
        _id: { $lt: cursorId },
      },
    ];
  }
  const data = await Content.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(parsedLimit)
    .lean()
    .select("_id title type url metadata tags createdAt");
  let nextCursor: string | null = null;
  if (data.length > 0) {
    const last = data[data.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({
        createdAt: last.createdAt,
        _id: last._id,
      })
    ).toString("base64");
  }
  return {
    data,
    nextCursor,
  };
};
export const deleteContentService = async (
  id: string,
  userId: string
) => {
  const content = await Content.findOneAndDelete({
    _id: id,
    userId,
  });
  if (!content) {
    throw new ApiError(404, "Content not found");
  }
  return { success: true };
};
export const getContentByUserId = async (userId: string) => {
  return Content.find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .select("title type url metadata tags createdAt");
};