import * as df from "durable-functions";
import { OrchestrationContext, OrchestrationHandler } from "durable-functions";
import { AnalyzeResult } from "../azure-services/azure-content-understanding";
import { SpeechSynthInput } from "../services/create-podcast-audio";
import { PodcastScript, RequestBody } from "../services/models";
import { contentExtractorAgent } from "./content-extractor-agent";
import { scriptWriterAgent } from "./script-writer-agent";
import { speechAgent } from "./speech-agent";
import { ssmlWriterAgent } from "./ssml-writer-agent";

export const podcastOrchestratorAgent: OrchestrationHandler = function* (
  context: OrchestrationContext
) {
  context.df.setCustomStatus({ status: "EXTRACTING_CONTENT" });
  const input = context.df.getInput<RequestBody>();

  // only send to content extractor if url or data is provided
  if (input.url || input.data) {
    const insights: AnalyzeResult = yield context.df.callActivity(
      contentExtractorAgent.name,
      input
    );

    input.scriptContent = insights.result?.contents[0].markdown || "";
  }

  context.df.setCustomStatus({ status: "WRITING_SCRIPT" });

  const podcastScript: PodcastScript = yield context.df.callActivity(
    scriptWriterAgent.name,
    input
  );

  context.df.setCustomStatus({ status: "WRITING_SSML" });

  const ssml = yield context.df.callActivity(
    ssmlWriterAgent.name,
    podcastScript.script
  );

  context.df.setCustomStatus({ status: "SYNTHESIZING_SPEECH" });

  const speechInput: SpeechSynthInput = {
    ssml: ssml,
  };

  const speech = yield context.df.callActivity(speechAgent.name, speechInput);

  context.df.setCustomStatus({ status: "COMPLETED" });
  return { podcastScript, podcastUrl: speech };
};

df.app.orchestration(podcastOrchestratorAgent.name, podcastOrchestratorAgent);
