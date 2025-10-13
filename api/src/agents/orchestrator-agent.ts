import * as df from "durable-functions";
import { OrchestrationContext, OrchestrationHandler } from "durable-functions";
import { AnalyzeResult } from "../azure-services/azure-content-understanding";
import { PodcastScript, PodcastStatus, RequestBody } from "../services/models";
import { audioAgent, AudioAgentInput } from "./audio-agent";
import { contentExtractorAgent } from "./content-extractor-agent";
import { scriptWriterAgent } from "./script-writer-agent";

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
    input.linesPerSpeaker = 2;
    setupStatus(context, "WRITING_SCRIPT");
    const podcastScript: PodcastScript = yield context.df.callActivity(
      scriptWriterAgent.name,
      input
    );

    // setupStatus(context, "CONVERTING_SSML");
    // const ssml = yield context.df.callActivity(
    //   ssmlConvertAgent.name,
    //   podcastScript.script
    // );

    setupStatus(context, "CREATING_AUDIO");
    const audioInputData: AudioAgentInput = {
      script: podcastScript.script,
    };

    const audio: string = yield context.df.callActivity(
      audioAgent.name,
      audioInputData
    );

    setupStatus(context, "COMPLETED");
    return { podcastScript, podcastUrl: audio };
  } catch (err) {
    setupStatus(context, "FAILED");
    throw err;
  }
};

df.app.orchestration(podcastOrchestratorAgent.name, podcastOrchestratorAgent);
