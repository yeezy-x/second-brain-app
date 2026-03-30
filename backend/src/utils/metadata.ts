import axios from "axios";
import * as cheerio from "cheerio";

export const extractMetadata = async (url: string) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text();
    const description =
      $('meta[property="og:description"]').attr("content") || "";
    const image =
      $('meta[property="og:image"]').attr("content") || "";

    return {
      title,
      description,
      image,
    };
  } catch (error) {
    return {};
  }
};