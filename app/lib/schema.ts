import { z } from "zod";

export const VoiceNameSchema = z.enum(["Drift", "Lumen", "Thorn", "Quill"], {
  description: "Allowed speaker voice names",
});

export const ToneSchema = z.enum([
  "formal",
  "informal",
  "humorous",
  "energetic",
]);

export const StyleSchema = z.enum([
  "conversational",
  "interview",
  "debate",
  "educational",
]);

// IMPORTANT: Keeping schema exactly as provided by user request.
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
    path: ["url"],
  });

export type RequestBody = z.infer<typeof RequestBodySchema>;
