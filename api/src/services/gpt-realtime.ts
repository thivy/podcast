import { OpenAIRealtimeWS } from "openai/beta/realtime/ws";
import { azureOpenAIRealtime } from "../azure-services/azure-openai";
import { debug } from "../common/debug";

const AZURE_OPENAI_AUDIO_SAMPLE_RATE = 24800;
const TIMEOUT_AFTER_MS = 20000; // 20s

/**
 * Aggregated realtime audio response
 */
export interface RealtimeAudioResult {
  audioBase64: string; // concatenated base64 payload (not yet converted to binary)
  bytes: number; // total decoded bytes length
}

export type VoiceName =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "sage"
  | "shimmer"
  | "verse";

export const generateRealtimeAudio = async (
  prompt: string,
  options?: {
    voice?: VoiceName; // voice name required for audio output
  }
): Promise<RealtimeAudioResult> => {
  if (!prompt || !prompt.trim()) throw new Error("Prompt is required");

  const voice = options?.voice || "alloy";

  const azureOpenAIClient = azureOpenAIRealtime();
  const realtimeClient = await OpenAIRealtimeWS.azure(azureOpenAIClient);

  const audioChunks: string[] = [];
  let totalBytes = 0;

  return new Promise<RealtimeAudioResult>((resolve, reject) => {
    let finished = false;
    const finish = async () => {
      if (finished) return;
      finished = true;
      try {
        realtimeClient.close();
      } catch {}
      const { base64, bytes } = finalizeAudioBase64(audioChunks);
      resolve({
        audioBase64: base64,
        bytes,
      });
    };

    const timer = setTimeout(() => {
      if (!finished) {
        reject(new Error("Realtime session timed out"));
        try {
          realtimeClient.close();
        } catch {}
      }
    }, TIMEOUT_AFTER_MS);

    realtimeClient.on("error", (err) => {
      clearTimeout(timer);
      if (!finished) {
        finished = true;
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });

    realtimeClient.on("session.created", () => {
      debug("Realtime session created");
    });

    realtimeClient.on("event", (event: any) => {
      switch (event?.type) {
        case "response.audio.delta":
          if (event?.delta) {
            audioChunks.push(event.delta);
            try {
              totalBytes += Buffer.from(event.delta, "base64").length;
            } catch {}
          }
          break;
        default:
          break;
      }
    });

    realtimeClient.on("response.done", () => {
      clearTimeout(timer);
      finish();
    });

    realtimeClient.socket.on("close", () => {
      clearTimeout(timer);
      finish();
    });

    realtimeClient.socket.on("open", () => {
      // Cast to any until SDK type definitions include audio_format
      realtimeClient.send({
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          // model: deployment as any, TODO DO WE NEED THIS?
          voice,
        },
      });

      realtimeClient.send({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      });
      realtimeClient.send({ type: "response.create" });
    });
  });
};

export const finalizeAudioBase64 = (
  audioChunks: string[]
): { base64: string; bytes: number } => {
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
