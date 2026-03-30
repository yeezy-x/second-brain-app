import { Content } from "./content.model";

export const createContentRepo = (data: any) => {
  return Content.create(data);
};

export const getContentRepo = (filter: any, options: any) => {
  return Content.find(filter)
    .sort({ createdAt: -1 })
    .skip(options.skip)
    .limit(options.limit);
};

export const deleteContentRepo = (id: string, userId: string) => {
  return Content.findOneAndDelete({ _id: id, userId });
};