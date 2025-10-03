import { z } from "zod";

export const VoiceNameSchema = z.enum([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
]);

export const StyleSchema = z.enum([
  "conversational",
  "interview",
  "debate",
  "educational",
]);

export const ToneSchema = z.enum([
  "formal",
  "informal",
  "humorous",
  "energetic",
]);

const PodcastScriptInputSchema = z.object({
  content: z.string().min(1),
  voice: VoiceNameSchema,
  style: StyleSchema,
  tone: ToneSchema,
});

const podcastScriptItemSchema = z.array(
  z.object({
    speaker: VoiceNameSchema.default("alloy"),
    conversation: z.string().min(1).max(250),
  })
);

export const PodcastScriptSchema = z.object({
  script: podcastScriptItemSchema.min(4).max(12),
});

export const RequestBodySchema = z
  .object({
    url: z.string().url().optional(),
    data: z.instanceof(Buffer).optional(),
    voice: VoiceNameSchema.optional().default("alloy"),
    style: StyleSchema.optional().default("conversational"),
    tone: ToneSchema.optional().default("formal"),
    instruction: z.string().optional(),
  })
  .refine((data) => data.url || data.data || data.instruction, {
    message: "Either 'url', 'data' or 'instruction' must be provided",
  });

export const PodcastConfigSchema = z.object({
  voice: VoiceNameSchema,
  style: StyleSchema,
  tone: ToneSchema,
  speakers: z.number().min(1).max(2).default(1),
  instruction: z.string().optional(),
  transcript: z.string().min(1),
});

export type RequestBody = z.infer<typeof RequestBodySchema>;
export type PodcastConfig = z.infer<typeof PodcastConfigSchema>;

export type Tone = z.infer<typeof ToneSchema>;
export type Style = z.infer<typeof StyleSchema>;
export type VoiceName = z.infer<typeof VoiceNameSchema>;
export type PodcastScriptInput = z.infer<typeof PodcastScriptInputSchema>;
