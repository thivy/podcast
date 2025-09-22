import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
} from "@azure/functions";
import { debug } from "../common/debug";
import { extractPodcastInsights } from "../services/extract-podcast-insights";

const handler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    let arrayBuffer = await request.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const insights = await extractPodcastInsights({ data: fileBuffer });

    const response = JSON.stringify(insights);

    return {
      status: 200,
      body: response,
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
