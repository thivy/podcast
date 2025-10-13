import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { createPodcastWithGptAudio } from "../services/create-podcast-audio";
import { PodcastScriptItem } from "../services/models";

export type AudioAgentInput = {
  script: PodcastScriptItem[];
};

export const audioAgent: ActivityHandler = async (
  input: AudioAgentInput
): Promise<string> => {
  const audio = await createPodcastWithGptAudio({
    script: input.script,
  });
  return audio;
};

df.app.activity(audioAgent.name, { handler: audioAgent });
