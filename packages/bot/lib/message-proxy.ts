import { getDlsiteTitle } from "./get-dlsite-title.js";

type MaybePromise<T> = T | Promise<T>;
type MessageProxy = (text: string) => MaybePromise<string>;

const replaceRJCodes: MessageProxy = async (text: string) => {
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

const replaceTilde: MessageProxy = (text: string) => text.replaceAll(/[~〜]/g, "ー");

export const conversionMessage: MessageProxy = async (text: string) => {
  const pipeline: MessageProxy[] = [replaceTilde, replaceRJCodes];
  let replaced = text;
  for (const replace of pipeline) {
    replaced = await replace(text);
  }
  return replaced;
};
