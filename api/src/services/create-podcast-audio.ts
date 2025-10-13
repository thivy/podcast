import { randomUUID } from "crypto";

import { promises as fs } from "fs";
import * as path from "path";
import {
  AZURE_OPENAI_AUDIO_MODEL_NAME,
  azureOpenAI,
} from "../azure-services/azure-openai";
import { synthesizeSpeechFromSsml } from "../azure-services/azure-speech";
import { uploadBufferToBlob } from "../azure-services/azure-storage";
import { PodcastScriptItem, VoiceName } from "./models";

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

export type GptAudioOptions = {
  voice: VoiceName;
  conversation: string;
};

export const createPodcastWithGptAudio = async (options: {
  script: PodcastScriptItem[];
}) => {
  const bufferArray: string[] = [];
  const script = options.script;
  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    console.log(`Generating audio for line ${i + 1}/${script.length}`);
    for (let j = 0; j < line.conversation.length; j++) {
      const conversation = line.conversation[j];
      const audioData = await createPodcastLineWithGptAudio({
        voice: line.speaker,
        conversation: conversation.content,
        writeToDisk: true,
      });
      bufferArray.push(audioData.base64);
    }
  }

  const joined = bufferArray.join("");
  const outputFileName = `podcast-${randomUUID()}.wav`;
  const blobUrl = await uploadBufferToBlob(
    Buffer.from(joined, "base64"),
    outputFileName
  );
  return blobUrl;
};

export type CreatePodcastLineWithGptAudioResult = {
  base64: string; // raw base64 wav (no data URI prefix)
  filePath?: string; // absolute path to written wav file (if write succeeded)
  bytes?: number; // size in bytes (if write succeeded)
};

export type CreatePodcastLineWithGptAudioOptions = GptAudioOptions & {
  /** If true (default), write a .wav file locally */
  writeToDisk?: boolean;
  /** Optional explicit output directory (default: output) */
  outputDir?: string;
  /** Optional file name (will be suffixed .wav if missing) */
  fileName?: string;
};

export const createPodcastLineWithGptAudio = async (
  options: CreatePodcastLineWithGptAudioOptions
): Promise<CreatePodcastLineWithGptAudioResult> => {
  const openai = azureOpenAI({
    deployment: AZURE_OPENAI_AUDIO_MODEL_NAME(),
  });

  console.log("Creating GPT audio with voice:", options.conversation);
  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: options.voice, format: "wav" },
    messages: [
      {
        role: "system",
        content: `
You are an expert audio generator. 
Your sole function is to speak exactly the user’s text.

Core behavior:
- Repeat the user’s EXACT text verbatim.
- Do not add, remove, rephrase, translate, or correct anything.
- Do not repeat the emotion tag. `,
      },
      {
        role: "user",
        content: `${options.conversation}`,
      },
    ],
  });

  const base64 = response.choices[0].message.audio.data;

  if (options.writeToDisk !== false) {
    const writeResult = await writeToDisk(base64, {
      fileName: options.fileName,
      outputDir: options.outputDir,
    });
  }

  return { base64 };
};

export const writeToDisk = async (
  base64: string,
  options: { fileName?: string; outputDir?: string }
) => {
  let filePath: string | undefined;
  let bytes: number | undefined;
  try {
    const outputDir = "output";
    const sanitizedFileName =
      (options.fileName && options.fileName.replace(/\s+/g, "-")) ||
      // Replace characters invalid on Windows ( : * ? " < > | ) and also periods in the time portion for consistency
      `gpt-audio-${new Date()
        .toISOString()
        .replace(/[:*?"<>|]/g, "-")
        .replace(/\./g, "-")}`;
    const fileName = sanitizedFileName;
    const target = path.join(
      outputDir,
      fileName.endsWith(".wav") ? fileName : fileName + ".wav"
    );
    const result = await writeWavFileToLocal(
      Buffer.from(base64, "base64"),
      target
    );
    filePath = result.filePath;
    bytes = result.bytes;
  } catch (err: any) {
    console.error(
      "Error writing GPT audio to local file:",
      err?.message || err
    );
  }

  return { filePath, bytes };
};
