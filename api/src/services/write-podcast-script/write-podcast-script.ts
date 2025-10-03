import { zodTextFormat } from "openai/helpers/zod";
import {
  AZURE_OPENAI_MODEL_NAME,
  azureOpenAI,
} from "../../azure-services/azure-openai";
import { PodcastConfig, PodcastScriptSchema } from "./models";

const buildPodcastPrompt = (config: PodcastConfig) => {
  let prompt = `Create a ${config.style} podcast conversation with ${config.speakers} speakers from this transcript.
    CONVERSATION STYLE: ${config.style}
    TONE: ${config.tone}`;

  if (config.instruction) {
    prompt += `
    \n##INSTRUCTIONS:
    ${config.instruction}`;
  }

  if (config.transcript && config.transcript.length > 0) {
    prompt += `
    \n##SOURCE MATERIAL:
    ${config.transcript}`;
  }

  return prompt;
};

export const writePodcastScript = async (config: PodcastConfig) => {
  const instructions = buildPodcastPrompt(config);
  console.log("Podcast Instructions:", instructions);
  const openai = azureOpenAI();

  const response = await openai.responses.parse({
    model: AZURE_OPENAI_MODEL_NAME(),
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Write a podcast script based on the instructions.",
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(PodcastScriptSchema, "script"),
    },
  });

  return response.output_parsed;
};
