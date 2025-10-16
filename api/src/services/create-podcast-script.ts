import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  AZURE_OPENAI_MODEL_NAME,
  azureOpenAI,
} from "../azure-services/azure-openai";
import { podcastEmotionsMarkdownTable } from "./expressive-palettes";
import { PodcastScriptSchema, RequestBody, VoiceNameSchema } from "./models";

const generatePodcastSystemPrompt = (config: RequestBody): string => {
  return `
You are a **master conversation architect** who crafts podcast dialogues that feel like eavesdropping on brilliant minds discovering ideas together.

<emotional_dynamics>
**CRITICAL RULE**: You MUST ONLY use emotion tags from the following predefined emotion library. 
DO NOT create custom emotions or blend descriptions.  \n\n
Valid emotions are:\n

${podcastEmotionsMarkdownTable()}

**How to use emotions naturally**: \n\n

1. **Emotional Flows**: Transition between valid emotions within sentences \n\n
   - "[curious] Wait, that's actually... [reflective] hmm... [excited] that changes everything!" \n\n
   - "[confident] I've always believed— [thoughtful] well, actually, [uncertain] maybe I'm wrong." \n\n

2. **Multiple Emotions**: Break sentences to show emotional shifts \n\n
   - "[dismissive] That's just— [contemplative] ...actually, [intrigued] tell me more." \n\n
   - "[analytical] The data shows... [surprised] oh wait, [enthusiastic] this is incredible!" \n\n

3. **Emotional Arcs**: Let emotions evolve naturally across exchanges \n\n
   - Speaker A: [curious] → [intrigued] → [excited] \n\n
   - Speaker B: [skeptical] → [surprised] → [enthusiastic] \n\n

REMEMBER: Only use emotion names exactly as they appear in the table above. No custom descriptions.
</emotional_dynamics>


<source_transformation>
${config.scriptContent}
</source_transformation>

<production_notes>
Style: ${config.style} \n\n
Tone: ${config.tone} \n\n
Special directive: ${config.instruction} \n\n
Speakers: ${config.speakers.join(" and ")} \n\n
Turn-taking: ${
    config.linesPerSpeaker
  } exchanges per speaker, but make them feel inevitable, not counted  \n\n
Total length: Under 10,000 characters  \n\n
</production_notes>
`;
};

export const createPodcastScript = async (config: RequestBody) => {
  const instructions = generatePodcastSystemPrompt(config);
  const openai = azureOpenAI();

  const initialScript = await openai.responses.parse({
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
      format: zodTextFormat(
        z.object({
          script: z
            .object({
              speaker: VoiceNameSchema.default("alloy"),
              conversation: z.string().min(1),
            })
            .array(),
        }),
        "script"
      ),
    },
  });

  // apply and ensure the script is split into conversations with emotions along with each emotion split into it own lines own object
  const scriptWithHumanExpressions = await openai.responses.parse({
    model: AZURE_OPENAI_MODEL_NAME(),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Convert this script into a podcast conversation. \n\n" +
              JSON.stringify(initialScript.output_parsed),
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(PodcastScriptSchema, "script"),
    },
  });

  return scriptWithHumanExpressions.output_parsed;
};
