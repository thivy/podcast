import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { writeSsml } from "../services/create-azure-speech-ssml";
import { PodcastScript } from "../services/models";

export const ssmlWriterAgent: ActivityHandler = async (
  input: PodcastScript
): Promise<string> => {
  const ssml = await writeSsml(input);
  return ssml;
};

df.app.activity(ssmlWriterAgent.name, { handler: ssmlWriterAgent });
