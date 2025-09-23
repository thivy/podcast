import { z } from "zod";

const apiInput = z.object({
  base64: z.string().min(1),
});

const podcastScriptItemSchema = z.array(
  z.object({
    speaker: z.enum([
      "en-US-AvaMultilingualNeural",
      "en-US-AndrewMultilingualNeural",
    ]),
    text: z.string().min(1).max(500),
  })
);

export const podcastScriptSchema = z.object({
  script: podcastScriptItemSchema.min(4).max(12),
});

export type PodcastScript = z.infer<typeof podcastScriptSchema>;
export type ApiInput = z.infer<typeof apiInput>;
