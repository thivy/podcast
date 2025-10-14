import { randomUUID } from "crypto";

import { promises as fs } from "fs";
import * as path from "path";
import {
  AZURE_OPENAI_AUDIO_MODEL_NAME,
  azureOpenAI,
} from "../azure-services/azure-openai";
import { synthesizeSpeechFromSsml } from "../azure-services/azure-speech";
import { uploadBufferToBlob } from "../azure-services/azure-storage";
import { PureNodeAudioMerger } from "../common/audio-merger";
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
  emotion: string; // emotion tag to prepend in brackets, e.g. "[cheerful]"
  conversation: string;
};

export const createPodcastWithGptAudio = async (options: {
  script: PodcastScriptItem[];
}) => {
  const bufferArray: string[] = [];

  const script = options.script;

  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    for (let j = 0; j < line.conversation.length; j++) {
      const conversation = line.conversation[j];
      const audioData = await createPodcastLineWithGptAudio({
        voice: line.speaker,
        conversation: conversation.content,
        emotion: conversation.emotion || "neutral",
      });
      const merger = new PureNodeAudioMerger();
      bufferArray.push(audioData.base64);
      const mergedBase64 = merger.merge(bufferArray);
      const merged = Buffer.from(mergedBase64, "base64");
      const outputFileName = `podcast-${randomUUID()}.wav`;
      await writeWavFileToLocal(
        merged,
        path.join("output", outputFileName)
      ).catch(console.error);
    }
  }
  const merger = new PureNodeAudioMerger();
  const mergedBase64 = merger.merge(bufferArray);
  const merged = Buffer.from(mergedBase64, "base64");

  const outputFileName = `podcast-${randomUUID()}.wav`;
  const blobUrl = await uploadBufferToBlob(merged, outputFileName);

  writeWavFileToLocal(merged, path.join("output", outputFileName)).catch(
    console.error
  );

  return blobUrl;
};

export type CreatePodcastLineWithGptAudioResult = {
  base64: string; // raw base64 wav (no data URI prefix)
  filePath?: string; // absolute path to written wav file (if write succeeded)
  bytes?: number; // size in bytes (if write succeeded)
};

export type CreatePodcastLineWithGptAudioOptions = GptAudioOptions & {
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

  const systemPrompt = `You are an expert audio generator that processes emotion-tagged text.

Instructions:
1. Parse the input to identify emotion tags in square brackets [like this]
2. Apply the emotion inside the brackets to your speech delivery
3. Speak ONLY the text that comes AFTER the closing bracket ]
4. Never vocalize the brackets or emotion word itself

Example:
Input: "[curiosity] Have you ever noticed..."
Output: Speak "Have you ever noticed..." with curious tone

Core rules:
- Strip all content from opening [ to closing ] before speaking
- Maintain exact wording of remaining text
- Do not add, rephrase, or correct anything`;

  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: options.voice, format: "wav" },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `${options.conversation}`,
      },
    ],
  });

  const base64 = response.choices[0].message.audio.data;

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
