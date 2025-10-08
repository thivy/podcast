import * as df from "durable-functions";
import { OrchestrationContext, OrchestrationHandler } from "durable-functions";
import { SpeechSynthInput } from "../services/create-podcast/create-audio";
import {
  PodcastScript,
  RequestBody,
} from "../services/write-podcast-script/models";
import { contentExtractorAgent } from "./content-extractor-agent";
import { scriptWriterAgent } from "./script-writer-agent";
import { speechAgent } from "./speech-agent";
import { ssmlWriterAgent } from "./ssml-writer-agent";

export const podcastOrchestratorAgent: OrchestrationHandler = function* (
  context: OrchestrationContext
) {
  context.df.setCustomStatus({ status: "EXTRACTING_CONTENT" });
  const input = context.df.getInput<RequestBody>();

  const insights = yield context.df.callActivity(
    contentExtractorAgent.name,
    input
  );

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

  return { podcastScript, podcastUrl: speech };
};

df.app.orchestration(podcastOrchestratorAgent.name, podcastOrchestratorAgent);
