import axios from "axios";
import * as cheerio from "cheerio";

const MAX_CONTENT_LENGTH = 1_000_000;
const TIMEOUT = 5000;

export const extractMetadata = async (url: string) => {
  try {
    new URL(url);
  } catch {
    return fallback(url);
  }
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      maxContentLength: MAX_CONTENT_LENGTH,
      maxBodyLength: MAX_CONTENT_LENGTH,
      validateStatus: () => true,
    });

    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
    if (response.status >= 400) {
      return fallback(url);
    }

    const html = response.data;
    if (!html || typeof html !== "string") {
      return fallback(url);
    }
    const $ = cheerio.load(html);
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      url;
    const description =
      $('meta[property="og:description"]').attr("content") || "";
    const image =
      $('meta[property="og:image"]').attr("content") || "";
    return {
      title: clean(title),
      description: clean(description),
      image: clean(image),
    };
  } catch (error: any) {
    if (
      error.code === "ECONNABORTED" || 
      error.code === "ENOTFOUND" || 
      error.code === "ECONNRESET"
    ) {
      throw error; 
    }
    return fallback(url);
  }
};
const fallback = (url: string) => ({
  title: url,
  description: "",
  image: "",
});

const clean = (str: string) => str?.trim().slice(0, 300);