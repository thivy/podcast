import { extractContentInsights } from "../extract-podcast-insights/extract-content-insights";
import { RequestBody } from "../write-podcast-script/models";

export const createPodcast = async (requestBody: RequestBody) => {
  const insights = await extractContentInsights(requestBody);

  return insights;
};
