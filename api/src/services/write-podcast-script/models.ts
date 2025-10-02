import { z } from "zod";

const VoiceNameSchema = z.enum([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
]);

const StyleSchema = z.enum([
  "conversational",
  "interview",
  "debate",
  "educational",
]);

const ToneSchema = z.enum(["formal", "informal", "humorous", "energetic"]);

const PodcastScriptInputSchema = z.object({
  content: z.string().min(1),
  voice: VoiceNameSchema,
  style: StyleSchema,
  tone: ToneSchema,
});

const podcastScriptItemSchema = z.array(
  z.object({
    speaker: z.enum(["speaker1", "speaker2"]).default("speaker1"),
    conversation: z.string().min(1).max(500),
  })
);

export const PodcastScriptSchema = z.object({
  script: podcastScriptItemSchema.min(4).max(12),
});

export type PodcastScriptInput = z.infer<typeof PodcastScriptInputSchema>;
