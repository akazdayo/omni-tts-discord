import { eq } from "drizzle-orm";
import { db } from "./index.js";
import { speakerPreferences } from "./schema/index.js";

const DEFAULT_SPEAKER_ID = "874568803256786945";

export const getSpeakerPreference = async (userId: string): Promise<string> => {
  const [record] = await db
    .select()
    .from(speakerPreferences)
    .where(eq(speakerPreferences.userId, userId));
  return record?.speakerId ?? DEFAULT_SPEAKER_ID;
};

export const setSpeakerPreference = async (userId: string, speakerId: string): Promise<void> => {
  await db
    .insert(speakerPreferences)
    .values({ speakerId, userId })
    .onConflictDoUpdate({ set: { speakerId }, target: speakerPreferences.userId });
};
