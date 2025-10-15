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

<mission>
Design a ${config.style} conversation between ${
    config.speakers.length
  } distinct speakers who are 
${config.speakers.map((s) => `- ${s}`).join("\n")}. 
</mission>

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


<conversational_physics>
- **Momentum**: Start with curiosity, accelerate through debate, coast through reflection
- **Tension & Release**: Create intellectual friction that resolves into "aha!" moments  
- **Turn-taking**: ${
    config.linesPerSpeaker
  } exchanges per speaker, but make them feel inevitable, not counted
- **Rhythm**: Mix rapid-fire exchanges with thoughtful pauses (1-2 sentences per turn)
- **Emotional Arc**: Use only emotions from the provided table to create natural progressions
</conversational_physics>


<source_transformation>
${config.scriptContent}
</source_transformation>

<production_notes>
Style: ${config.style}
Tone: ${config.tone}
Special directive: ${config.instruction}

Total length: Under 10,000 characters
Format: Clear speaker labels with [emotion] tags using ONLY emotions from the provided table
Quality check: Every emotion tag must match exactly with the emotion library
</production_notes>

Remember: Great podcasts don't just inform—they create the experience of thinking alongside brilliant, curious humans. Make your listeners feel smarter for having overheard this conversation.`;
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
