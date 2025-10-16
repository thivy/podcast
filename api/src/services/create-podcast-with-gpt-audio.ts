import { randomUUID } from "crypto";
import {
  AZURE_OPENAI_AUDIO_MODEL_NAME,
  azureOpenAI,
} from "../azure-services/azure-openai";
import { uploadBufferToBlob } from "../azure-services/azure-storage";
import { PureNodeAudioMerger } from "../common/audio-merger";
import { getExpressivePaletteByName } from "./expressive-palettes";
import { PodcastScriptItem, RequestBody, VoiceName } from "./models";

export type PodcastSpeakerLine = {
  voice: VoiceName;
  emotion: string;
  conversation: string;
};

export type ConversationHistory = PodcastSpeakerLine[];

type AudioOptions = {
  script: PodcastScriptItem[];
  requestOptions: RequestBody;
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
        requestOptions: options.requestOptions,
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
  requestOptions: RequestBody;
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
    requestOptions: options.requestOptions,
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

const systemInstruction = ({
  emotion,
  requestOptions,
}: {
  emotion: string;
  requestOptions: RequestBody;
}) => {
  const systemInstruction = `You are an expert audio generator for podcasts. \n\n

- This podcast has a style of ${requestOptions.style} \n\n
- This podcast has an overall tone of ${requestOptions.tone} \n\n
- Speak ONLY the text that user has provided\n\n
- DO NOT acknowledge the user, just speak the text with that emotion \n\n
- DO NOT refuse to speak the text, all text must be spoken \n\n
- YOU MUST sound very human and natural and not robotic \n\n

<delivery_guidelines>
You must deliver this with \n\n
${getExpressivePaletteByName(emotion)}
</delivery_guidelines>

`;

  return systemInstruction;
};
