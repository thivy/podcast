import { zodTextFormat } from "openai/helpers/zod";
import {
  AZURE_OPENAI_MODEL_NAME,
  azureOpenAI,
} from "../../azure-services/azure-openai";
import { PodcastConfig, PodcastScriptSchema } from "./models";

const buildPodcastPrompt = (config: PodcastConfig) => {
  return `
You are an expert podcast script writer. Your task is to create an engaging, natural-sounding podcast conversation.

<objective>
Create a ${config.style} podcast conversation with ${
    config.speakers
  } speakers based on the provided source material.
</objective>

<conversation_requirements>
- Style: ${config.style}
- Tone: ${config.tone}
- Number of speakers: ${config.speakers}
- Each speaker should have a distinct voice and perspective
- Dialogue should flow naturally with appropriate transitions
- Include engaging hooks, questions, and insights that maintain listener interest
</conversation_requirements>

<quality_standards>
- Clarity: Ensure each speaker's contribution is clear and adds value to the conversation
- Authenticity: Write dialogue that sounds natural and conversational, not scripted
- Structure: Include a clear introduction, body with key discussion points, and conclusion
- Engagement: Use storytelling techniques, questions, and insights to maintain listener interest
- Accuracy: Stay faithful to the source material while making it conversational
</quality_standards>

${
  config.instruction
    ? `<specific_instructions>
${config.instruction}
</specific_instructions>

`
    : ""
}${
    config.transcript && config.transcript.length > 0
      ? `<source_material>
${config.transcript}
</source_material>

`
      : ""
  }<output_requirements>
- Generate a complete podcast script with clear speaker labels
- Include natural transitions between topics
- Ensure the conversation feels spontaneous yet well-structured
- Balance information delivery with entertainment value
</output_requirements>`;
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
