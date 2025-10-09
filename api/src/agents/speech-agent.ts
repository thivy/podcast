import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import {
  SpeechSynthInput,
  createPodcastAudioFromSsmlToBlob,
} from "../services/create-podcast-audio";

export const speechAgent: ActivityHandler = async (
  input: SpeechSynthInput
): Promise<string> => {
  const blobUrl = await createPodcastAudioFromSsmlToBlob(input);
  return blobUrl;
};

df.app.activity(speechAgent.name, { handler: speechAgent });
