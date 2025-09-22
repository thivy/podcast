import {
  AnalyzeOptions,
  ContentUnderstandingError,
  createContentUnderstandingClient,
  RequestBody,
} from "../azure-services/azure-content-understanding";

export const extractPodcastInsights = async (options: RequestBody) => {
  const client = createContentUnderstandingClient();

  if (!options.url && !options.data) {
    throw new ContentUnderstandingError("Either url or data must be provided");
  }

  const analyzeOptions: AnalyzeOptions = {
    analyzerType: "prebuilt-documentAnalyzer", // TODO: make this dynamic based on file type
    source: {
      data: options.data, // TODO: support url or data
    },
  };

  const result = await client.analyze(analyzeOptions);
  const finalResult = await client.getAnalyzerResults(result.id);

  return finalResult;
};
