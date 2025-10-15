import { randomUUID } from "crypto";
import {
  AZURE_OPENAI_AUDIO_MODEL_NAME,
  azureOpenAI,
} from "../azure-services/azure-openai";
import { uploadBufferToBlob } from "../azure-services/azure-storage";
import { PureNodeAudioMerger } from "../common/audio-merger";
import { getExpressivePaletteByName } from "./expressive-palettes";
import { PodcastScriptItem, VoiceName } from "./models";

export type PodcastSpeakerLine = {
  voice: VoiceName;
  emotion: string;
  conversation: string;
};

export type ConversationHistory = PodcastSpeakerLine[];

type AudioOptions = {
  script: PodcastScriptItem[];
};

export const createPodcastGptAudio = async (options: AudioOptions) => {
  const bufferArray: string[] = [];
  const history: ConversationHistory = [];
  const merger = new PureNodeAudioMerger();

  const script = options.script;

  for (let i = 0; i < script.length; i++) {
    const speakerLineConversations = script[i];

    for (let j = 0; j < speakerLineConversations.conversation.length; j++) {
      const conversation = speakerLineConversations.conversation[j];

      const speaker = {
        conversation: conversation.content,
        emotion: conversation.emotion || "neutral",
        voice: speakerLineConversations.speaker,
      };

      const audioData = await createPodcastScriptLineAudio({
        history,
        speakerLine: speaker,
      });

      bufferArray.push(audioData.base64);
      history.push(speaker);
    }
  }

  const mergedBase64 = merger.merge(bufferArray);
  const merged = Buffer.from(mergedBase64, "base64");
  const outputFileName = `podcast-${randomUUID()}.wav`;
  const blobName = await uploadBufferToBlob(merged, outputFileName);

  return {
    blobName,
  };
};

type ScriptLineOptions = {
  speakerLine: PodcastSpeakerLine;
  history: ConversationHistory;
};

export const createPodcastScriptLineAudio = async (
  options: ScriptLineOptions
) => {
  const openai = azureOpenAI({
    deployment: AZURE_OPENAI_AUDIO_MODEL_NAME(),
  });

  const { voice, emotion, conversation } = options.speakerLine;

  const history = options.history ?? [];

  const systemPrompt = systemInstruction({
    emotion,
  });

  let historyMessages = [];

  for (const entry of history) {
    historyMessages.push({
      role: "user",
      name: entry.voice,
      content: entry.conversation,
    });

    historyMessages.push({
      role: "assistant",
      name: entry.voice,
      content: entry.conversation,
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: voice, format: "wav" },
    messages: [
      {
        role: "system",
        name: "audio_generator",
        content: systemPrompt,
      },
      ...historyMessages,
      {
        role: "user",
        name: voice,
        content: conversation,
      },
    ],
  });

  const base64 = response.choices[0].message.audio.data;

  return { base64 };
};

const systemInstruction = ({ emotion }: { emotion: string }) => {
  const systemInstruction = `You are an expert audio generator that processes emotion-tagged text. \n\n

<instructions>
1. Parse the input to identify emotion tags in square brackets [like this] \n\n
2. Apply the emotion inside the brackets to your speech delivery \n\n
3. Speak ONLY the text that comes AFTER the closing bracket ]\n\n
4. Never vocalize the brackets or emotion word itself \n\n
6. DO NOT acknowledge the emotion tag, just speak the text with that emotion \n\n
</instructions>

<example>
Example:
Input: "[curiosity] Have you ever noticed..." \n\n
Output: Speak "Have you ever noticed..." with curious tone \n\n
</example>

<delivery_guidelines>
You should not mention the emotion [${emotion}] at all instead here is how you must speak the emotion out [${emotion}] \n\n
${getExpressivePaletteByName(emotion)}
</delivery_guidelines>

<core_rules>
1. Strip all content from opening [ to closing ] before speaking \n\n
2. Maintain exact wording of remaining text
3. Do not add, rephrase, or correct anything
</core_rules>`;

  return systemInstruction;
};
