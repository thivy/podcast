import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { debug } from "../common/debug";

export const extractPodcastInsightsHandler: HttpHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  try {
    const response = { message: "Hello from simpleSpeech function!" };
    return {
      status: 200,
      body: JSON.stringify(response),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err: any) {
    debug("Error in simpleSpeechHandler:", err);
    return { status: 500, body: String(err?.message || err) };
  }
};

app.http(extractPodcastInsightsHandler.name, {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "podcast/extractInsights",
  handler: extractPodcastInsightsHandler,
});
