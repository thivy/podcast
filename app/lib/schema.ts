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
  "marin",
  "cedar",
]);

export const StyleSchema = z.enum([
  "conversational",
  "interview",
  "debate",
  "educational",
  "stand-up-comedy",
  "storytelling",
  "documentary",
]);

export const ToneSchema = z.enum([
  "formal",
  "informal",
  "humorous",
  "energetic",
]);

export const RequestBodySchema = z
  .object({
    url: z.string().url().optional(),
    data: z.instanceof(Buffer).optional(),
    style: StyleSchema.optional().default("stand-up-comedy"),
    tone: ToneSchema.optional().default("humorous"),
    instruction: z.string().optional(),
    linesPerSpeaker: z.number().optional(),
    speakers: z.array(VoiceNameSchema).min(1).max(2).default(["alloy", "ash"]),
    scriptContent: z.string().default(""),
  })
  .refine((data) => data.url || data.data || data.instruction, {
    message: "Either 'url', 'data' or 'instruction' must be provided",
    path: ["url"],
  });

export type RequestBody = z.infer<typeof RequestBodySchema>;
