import { HttpRequest } from "@azure/functions";
import {
  AnalyzeOptions,
  ContentUnderstandingError,
  createContentUnderstandingClient,
  RequestBody,
} from "../azure-services/azure-content-understanding";

export const extractAnalyzeOptions = async (
  request: HttpRequest
): Promise<RequestBody> => {
  const clone = request.clone();
  try {
    const body: RequestBody = await clone.json();
    const { url } = body;
    if (url && typeof url === "string" && url.startsWith("http")) {
      return { url };
    }
  } catch (err: any) {
    let arrayBuffer = await clone.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    return { data: fileBuffer };
  }

  throw new ContentUnderstandingError("Either url or data must be provided");
};

export const extractContentInsights = async (options: RequestBody) => {
  const client = createContentUnderstandingClient();

  if (!options.url && !options.data) {
    throw new ContentUnderstandingError("Either url or data must be provided");
  }

  const analyzeOptions: AnalyzeOptions = {
    analyzerType: "prebuilt-documentAnalyzer", // TODO: make this dynamic based on file type
    source: options,
  };

  const result = await client.analyze(analyzeOptions);
  const finalResult = await client.getAnalyzerResults(result.id);

  return finalResult;
};
