import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { writeSsml } from "../services/create-podcast/create-azure-speech-ssml";
import { PodcastScript } from "../services/write-podcast-script/models";

export const ssmlWriterAgent: ActivityHandler = async (
  input: PodcastScript
): Promise<string> => {
  const ssml = await writeSsml(input);
  return ssml;
};

df.app.activity(ssmlWriterAgent.name, { handler: ssmlWriterAgent });
