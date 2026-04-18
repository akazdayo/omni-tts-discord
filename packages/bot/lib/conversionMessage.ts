import { getDlsiteTitle } from "./getDlsiteTitle.js";

export async function conversionMessage(msg: string){
    const replaced = await replaceRJCodes(msg);
    return replaceTilde(replaced);
}

async function replaceRJCodes(text: string) {
  const regex = /rj\d+/gi;
  const matches = [...text.matchAll(regex)];

  let result = text;

  for (const match of matches) {
    const rjCode = match[0].toUpperCase();
    const title = await getDlsiteTitle(rjCode);
    result = result.replace(match[0], title);
  }

  return result;
}

function replaceTilde(text: string){
  return text.replace(/[~〜]/g, "ー");
}
