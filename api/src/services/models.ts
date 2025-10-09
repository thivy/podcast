import { z } from "zod";

export const PodcastStatusSchema = z.enum([
  "INITIALIZING",
  "EXTRACTING_INSIGHTS",
  "WRITING_SCRIPT",
  "CONVERTING_SSML",
  "CREATING_AUDIO",
  "COMPLETED",
  "FAILED",
]);

export type PodcastStatus = z.infer<typeof PodcastStatusSchema>;

export const VoiceNameSchema = z.enum(["Drift", "Lumen", "Thorn", "Quill"]);
// Drift – evokes motion, mystery, and natural flow.
// Lumen – a measure of light, but also feels futuristic and ethereal.
// Thorn – sharp, evocative, and layered with metaphor.
// Myrrh – ancient, aromatic, and rich with spiritual undertones.
// Quill – elegant, creative, and timeless.

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

export const podcastScriptItemSchema = z.object({
  speaker: VoiceNameSchema.default("Drift"),
  conversation: z.string().min(1),
});

export const PodcastScriptSchema = z.object({
  script: z.array(podcastScriptItemSchema),
});

export const RequestBodySchema = z
  .object({
    url: z.string().url().optional(),
    data: z.instanceof(Buffer).optional(),
    style: StyleSchema.optional().default("conversational"),
    tone: ToneSchema.optional().default("formal"),
    instruction: z.string().optional(),
    linesPerSpeaker: z.number().min(1).max(10).default(3),
    speakers: z
      .array(VoiceNameSchema)
      .min(1)
      .max(2)
      .default(["Drift", "Lumen"]),
    scriptContent: z.string().default(""),
  })
  .refine((data) => data.url || data.data || data.instruction, {
    message: "Either 'url', 'data' or 'instruction' must be provided",
  });

export type RequestBody = z.infer<typeof RequestBodySchema>;

export type Tone = z.infer<typeof ToneSchema>;
export type Style = z.infer<typeof StyleSchema>;
export type VoiceName = z.infer<typeof VoiceNameSchema>;
export type PodcastScript = z.infer<typeof PodcastScriptSchema>;
export type PodcastScriptItem = z.infer<typeof podcastScriptItemSchema>;

export type PodcastScriptInput = z.infer<typeof PodcastScriptInputSchema>;
