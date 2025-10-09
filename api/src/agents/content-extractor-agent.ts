import * as df from "durable-functions";
import { ActivityHandler } from "durable-functions";
import { AnalyzeResult } from "../azure-services/azure-content-understanding";
import { extractContentInsights } from "../services/extract-content-insights";
import { RequestBody } from "../services/models";

export const contentExtractorAgent: ActivityHandler = async (
  input: RequestBody
): Promise<AnalyzeResult> => {
  const insights = await extractContentInsights(input);
  return insights;
};

df.app.activity(contentExtractorAgent.name, { handler: contentExtractorAgent });
