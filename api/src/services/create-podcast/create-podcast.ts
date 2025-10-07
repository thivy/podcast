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

  return podcastScript;
};
