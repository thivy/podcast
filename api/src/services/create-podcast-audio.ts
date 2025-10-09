import { randomUUID } from "crypto";

import { promises as fs } from "fs";
import * as path from "path";
import { synthesizeSpeechFromSsml } from "../azure-services/azure-speech";
import { uploadBufferToBlob } from "../azure-services/azure-storage";

// Input type for the activity
export type SpeechSynthInput = {
  ssml: string;
};

// Returns the path to the saved WAV file
export const createPodcastAudioFromSsmlToBlob = async (
  input: SpeechSynthInput
): Promise<string> => {
  const outputFileName = `podcast-${randomUUID()}.wav`;

  // Synthesize SSML into memory (buffer)
  const result = await synthesizeSpeechFromSsml(input.ssml);

  // Upload buffer to blob storage and return blob URL
  const blobUrl = await uploadBufferToBlob(result.buffer, outputFileName);
  return blobUrl;
};

export async function createPodcastAudioFromSsmlToLocalFile(
  ssml: string,
  filePath?: string
): Promise<{ filePath: string; bytes: number }> {
  if (!ssml || !ssml.trim()) {
    throw new Error("SSML content is empty.");
  }
  const { buffer } = await synthesizeSpeechFromSsml(ssml);
  const finalPath =
    filePath ||
    path.join(
      "output",
      `speech-${new Date().toISOString().replace(/[:.]/g, "-")}.wav`
    );
  return writeWavFileToLocal(buffer, finalPath);
}

export async function writeWavFileToLocal(
  buffer: Buffer,
  targetPath: string
): Promise<{ filePath: string; bytes: number }> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Cannot write empty audio buffer.");
  }

  // Ensure .wav extension
  const ext = path.extname(targetPath).toLowerCase();
  if (ext !== ".wav") {
    targetPath = targetPath + ".wav";
  }

  const abs = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(process.cwd(), targetPath);

  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);

  return { filePath: abs, bytes: buffer.length };
}
