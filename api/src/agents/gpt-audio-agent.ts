import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { createPodcastGptAudio } from "../services/create-podcast-with-gpt-audio";
import { PodcastScriptItem, RequestBody } from "../services/models";

export type AudioAgentInput = {
  script: PodcastScriptItem[];
  requestOptions: RequestBody;
};

export const gptAudioAgent: ActivityHandler = async (
  input: AudioAgentInput
): Promise<string> => {
  const { blobName } = await createPodcastGptAudio({
    script: input.script,
    requestOptions: input.requestOptions,
  });
  return blobName;
};

df.app.activity(gptAudioAgent.name, { handler: gptAudioAgent });
