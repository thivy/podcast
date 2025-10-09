import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { createPodcastScript } from "../services/create-podcast-script";
import { PodcastScript, RequestBody } from "../services/models";

export const scriptWriterAgent: ActivityHandler = async (
  input: RequestBody
): Promise<PodcastScript> => {
  const script = await createPodcastScript(input);
  return script;
};

df.app.activity(scriptWriterAgent.name, { handler: scriptWriterAgent });
