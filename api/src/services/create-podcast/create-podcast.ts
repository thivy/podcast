import * as fs from "fs/promises";
import * as path from "path";
import {
  createPodcastAudio,
  finalizeAudioBase64,
} from "../create-podcast-audio/create-podcast-audio";
import { extractContentInsights } from "../extract-podcast-insights/extract-content-insights";
import {
  PodcastConfig,
  PodcastConfigSchema,
  RequestBody,
} from "../write-podcast-script/models";
import { writePodcastScript } from "../write-podcast-script/write-podcast-script";

export const createPodcast = async (requestBody: RequestBody) => {
  const insights = await extractContentInsights(requestBody);

  const podcastConfig: PodcastConfig = {
    ...requestBody,
    transcript: insights.result?.contents[0].markdown || "",
  };

  const value = PodcastConfigSchema.parse(podcastConfig);
  const podcastScript = await writePodcastScript(value);

  const chunks = [];
  for (let i = 0; i < podcastScript.script.length; i++) {
    const item = podcastScript.script[i];
    const podcast = await createPodcastAudio(item);
    chunks.push(...podcast.audioChunks);
  }

  const final = finalizeAudioBase64(chunks);
  const audioBuffer = Buffer.from(final.base64, "base64");
  const fileName = `podcast-${Date.now()}.wav`;
  const filePath = path.join(process.cwd(), fileName); // or specify your desired directory
  await fs.writeFile(filePath, audioBuffer);

  return podcastScript;
};
