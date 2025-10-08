import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import {
  PodcastScript,
  RequestBody,
} from "../services/write-podcast-script/models";
import { writePodcastScript } from "../services/write-podcast-script/write-podcast-script";

export const scriptWriterAgent: ActivityHandler = async (
  input: RequestBody
): Promise<PodcastScript> => {
  const script = await writePodcastScript(input);
  return script;
};

df.app.activity(scriptWriterAgent.name, { handler: scriptWriterAgent });
