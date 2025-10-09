import * as df from "durable-functions";
import { OrchestrationContext, OrchestrationHandler } from "durable-functions";
import { AnalyzeResult } from "../azure-services/azure-content-understanding";
import { SpeechSynthInput } from "../services/create-podcast-audio";
import { PodcastScript, PodcastStatus, RequestBody } from "../services/models";
import { contentExtractorAgent } from "./content-extractor-agent";
import { scriptWriterAgent } from "./script-writer-agent";
import { speechAgent } from "./speech-agent";
import { ssmlConvertAgent } from "./ssml-convert-agent";

const setupStatus = (context: OrchestrationContext, status: PodcastStatus) => {
  context.df.setCustomStatus({ status });
};

export const podcastOrchestratorAgent: OrchestrationHandler = function* (
  context: OrchestrationContext
) {
  try {
    setupStatus(context, "INITIALIZING");
    const input = context.df.getInput<RequestBody>();

    // only send to content extractor if url or data is provided
    if (input.url || input.data) {
      setupStatus(context, "EXTRACTING_INSIGHTS");
      const insights: AnalyzeResult = yield context.df.callActivity(
        contentExtractorAgent.name,
        input
      );

      input.scriptContent = insights.result?.contents[0].markdown || "";
    }

    setupStatus(context, "WRITING_SCRIPT");
    const podcastScript: PodcastScript = yield context.df.callActivity(
      scriptWriterAgent.name,
      input
    );

    setupStatus(context, "CONVERTING_SSML");
    const ssml = yield context.df.callActivity(
      ssmlConvertAgent.name,
      podcastScript.script
    );

    setupStatus(context, "CREATING_AUDIO");
    const speechInput: SpeechSynthInput = {
      ssml: ssml,
    };

    const speech = yield context.df.callActivity(speechAgent.name, speechInput);

    setupStatus(context, "COMPLETED");
    return { podcastScript, podcastUrl: speech };
  } catch (err) {
    setupStatus(context, "FAILED");
    throw err;
  }
};

df.app.orchestration(podcastOrchestratorAgent.name, podcastOrchestratorAgent);
