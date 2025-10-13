import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import {
  SpeechSynthInput,
  createPodcastAudioFromSsmlToBlob,
} from "../services/create-podcast-audio";

export const azureSpeechAgent: ActivityHandler = async (
  input: SpeechSynthInput
): Promise<string> => {
  const blobUrl = await createPodcastAudioFromSsmlToBlob(input);
  return blobUrl;
};

df.app.activity(azureSpeechAgent.name, { handler: azureSpeechAgent });
