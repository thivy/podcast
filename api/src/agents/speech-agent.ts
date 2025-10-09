import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import {
  SpeechSynthInput,
  synthesizeSpeechFromSsmlToBlob,
} from "../services/create-audio";

export const speechAgent: ActivityHandler = async (
  input: SpeechSynthInput
): Promise<string> => {
  const blobUrl = await synthesizeSpeechFromSsmlToBlob(input);
  return blobUrl;
};

df.app.activity(speechAgent.name, { handler: speechAgent });
