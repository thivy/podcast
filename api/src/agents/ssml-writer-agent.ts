import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { createPodcastSsml } from "../services/create-podcast-ssml";
import { PodcastScript } from "../services/models";

export const ssmlWriterAgent: ActivityHandler = async (
  input: PodcastScript
): Promise<string> => {
  const ssml = await createPodcastSsml(input);
  return ssml;
};

df.app.activity(ssmlWriterAgent.name, { handler: ssmlWriterAgent });
