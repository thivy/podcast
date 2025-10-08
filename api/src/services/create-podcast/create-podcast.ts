import { extractContentInsights } from "../extract-podcast-insights/extract-content-insights";
import { RequestBody } from "../write-podcast-script/models";
import { writePodcastScript } from "../write-podcast-script/write-podcast-script";

export const createPodcast = async (requestBody: RequestBody) => {
  const insights = await extractContentInsights(requestBody);

  requestBody.scriptContent = insights.result?.contents[0].markdown || "";

  const podcastScript = await writePodcastScript(requestBody);

  return podcastScript;
};
