import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { writePodcastScript } from "../services/create-podcast-script";
import { PodcastScript, RequestBody } from "../services/models";

export const scriptWriterAgent: ActivityHandler = async (
  input: RequestBody
): Promise<PodcastScript> => {
  const script = await writePodcastScript(input);
  return script;
};

df.app.activity(scriptWriterAgent.name, { handler: scriptWriterAgent });
