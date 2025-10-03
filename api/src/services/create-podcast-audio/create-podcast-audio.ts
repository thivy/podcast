import { OpenAIRealtimeWS } from "openai/beta/realtime/ws";
import { z } from "zod";
import { azureOpenAIRealtime } from "../../azure-services/azure-openai";
import { debug } from "../../common/debug";
import {
  PodcastScriptItem,
  podcastScriptItemSchema,
  VoiceNameSchema,
} from "../write-podcast-script/models";

const AZURE_OPENAI_AUDIO_SAMPLE_RATE = 24800;
const TIMEOUT_AFTER_MS = 200000; // 200s

/**
 * Aggregated realtime audio response
 */
export interface RealtimeAudioResult {
  audioChunks: string[]; // concatenated base64 payload (not yet converted to binary)
}

const PodcastAudioOptionsSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  voice: VoiceNameSchema.optional().default("alloy"),
});

export type PodcastAudioOptions = z.infer<typeof PodcastAudioOptionsSchema>;

export const createPodcastAudio = async (
  options: PodcastScriptItem
): Promise<RealtimeAudioResult> => {
  const validOptions = podcastScriptItemSchema.parse(options);
  const { speaker, conversation } = validOptions;

  const azureOpenAIClient = azureOpenAIRealtime();
  const realtimeClient = await OpenAIRealtimeWS.azure(azureOpenAIClient);

  const audioChunks: string[] = [];

  return new Promise<RealtimeAudioResult>((resolve, reject) => {
    let settled = false;

    const settle = (error?: Error) => {
      if (settled) return;
      settled = true;

      try {
        realtimeClient.close();
      } catch (closeErr) {
        debug("Error closing realtime client", closeErr);
      }

      if (error) {
        reject(error);
        return;
      }

      if (audioChunks.length === 0) {
        reject(new Error("Realtime session produced no audio data"));
        return;
      }

      try {
        resolve({ audioChunks });
      } catch (conversionErr: any) {
        reject(
          conversionErr instanceof Error
            ? conversionErr
            : new Error(String(conversionErr))
        );
      }
    };

    realtimeClient.on("error", (err) => {
      settle(err instanceof Error ? err : new Error(String(err)));
    });

    realtimeClient.on("session.created", () => {
      debug("Realtime session created");
    });

    realtimeClient.on("error", (event: any) => {
      debug("Realtime response error", event);
      settle(
        new Error(
          event?.error?.message || "Realtime session reported an error response"
        )
      );
    });

    realtimeClient.on("event", (event: any) => {
      if (
        event?.type === "response.audio.delta" &&
        typeof event?.delta === "string"
      ) {
        audioChunks.push(event.delta);
      }
    });

    realtimeClient.on("response.done", () => {
      settle();
    });

    realtimeClient.socket.on("close", (code: number, reason: Buffer) => {
      if (!settled) {
        const message =
          reason?.toString() || "Realtime session closed prematurely";
        settle(
          audioChunks.length
            ? undefined
            : new Error(`Realtime socket closed (${code}): ${message}`)
        );
      }
    });

    realtimeClient.socket.on("error", (socketErr: any) => {
      settle(
        socketErr instanceof Error ? socketErr : new Error(String(socketErr))
      );
    });

    const sendToRealtimeClient = (podcastItem: PodcastScriptItem) => {
      realtimeClient.send({
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          voice: podcastItem.speaker,
        },
      });

      realtimeClient.send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",

          content: [
            {
              type: "input_text",
              text: `Repeat after me and DO NOT ADD any other context before or after: ${podcastItem.conversation}`,
            },
          ],
        },
      });

      realtimeClient.send({ type: "response.create" });
    };

    realtimeClient.socket.on("open", () => {
      sendToRealtimeClient({ speaker, conversation });
    });
  });
};

export const finalizeAudioBase64 = (
  audioChunks: string[]
): { base64: string; bytes: number } => {
  if (!audioChunks.length) {
    throw new Error("No audio chunks to finalize");
  }
  const joined = audioChunks.join("");

  if (joined.startsWith("UklGR"))
    return { base64: joined, bytes: Buffer.from(joined, "base64").length };
  try {
    const pcm = Buffer.from(joined, "base64");
    const wav = pcm16ToWav(pcm, AZURE_OPENAI_AUDIO_SAMPLE_RATE, 1);
    return { base64: wav.toString("base64"), bytes: wav.length };
  } catch (e) {
    debug("Failed to wrap PCM as WAV", e);
    return { base64: joined, bytes: Buffer.from(joined, "base64").length };
  }
};

export const pcm16ToWav = (
  pcm: Buffer,
  sr: number,
  channels: number
): Buffer => {
  const bitsPerSample = 16;
  const byteRate = (sr * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sr, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcm.copy(buffer, 44);
  return buffer;
};
