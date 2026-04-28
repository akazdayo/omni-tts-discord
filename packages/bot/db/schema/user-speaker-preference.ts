import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const speakerPreferences = sqliteTable("user_speaker_preferences", {
  speakerId: text("speaker_id").notNull(),
  userId: text("user_id").primaryKey(),
});
