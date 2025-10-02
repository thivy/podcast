import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
} from "@azure/functions";
import { debug } from "../common/debug";
import {
  extractAnalyzeOptions,
  extractContentInsights,
} from "../services/extract-podcast-insights/extract-content-insights";

const handler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    const options = await extractAnalyzeOptions(request);
    const insights = await extractContentInsights(options);

    return {
      status: 200,
      body: JSON.stringify(insights),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err: any) {
    debug("Error in simpleSpeechHandler:", err);
    return { status: 500, body: String(err?.message || err) };
  }
};

app.http(handler.name, {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "podcast/extractInsights",
  handler: handler,
});
