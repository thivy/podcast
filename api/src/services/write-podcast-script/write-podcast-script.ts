import { zodTextFormat } from "openai/helpers/zod";
import {
  AZURE_OPENAI_MODEL_NAME,
  azureOpenAI,
} from "../../azure-services/azure-openai";
import { generateInstruction } from "./instruction";
import { podcastScriptSchema } from "./models";

export const writePodcastScript = async (topic: string) => {
  const instructions = generateInstruction();

  const openai = azureOpenAI();

  // TODO: how can we handle larger inputs?
  // We may need to chunk the input and summarize it first
  const response = await openai.responses.parse({
    model: AZURE_OPENAI_MODEL_NAME(),
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: topic,
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(podcastScriptSchema, "script"),
    },
  });

  return response.output_parsed;
};
