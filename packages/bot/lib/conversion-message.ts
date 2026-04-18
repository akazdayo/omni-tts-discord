import { getDlsiteTitle } from "./get-dlsite-title.js";

const replaceRJCodes = async (text: string) => {
  const regex = /rj\d+/gi;
  const matches = [...text.matchAll(regex)];

  let result = text;

  for (const match of matches) {
    const rjCode = match[0].toUpperCase();
    const title = await getDlsiteTitle(rjCode);
    result = result.replace(match[0], title);
  }

  return result;
};

const replaceTilde = (text: string) => text.replaceAll(/[~〜]/g, "ー");

export const conversionMessage = async (message: string) => {
  const replaced = await replaceRJCodes(message);
  return replaceTilde(replaced);
};
