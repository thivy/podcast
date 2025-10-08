import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
} from "@azure/functions";
import { ZodError } from "zod";
import { debug } from "../common/debug";
import { ValidationError } from "../common/error";
import { createPodcast } from "../services/create-podcast/create-podcast";
import { buildContentUnderstandingPayload } from "../services/extract-podcast-insights/extract-content-insights";

const handler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    const requestBody = await buildContentUnderstandingPayload(request);

    if (requestBody instanceof ZodError) {
      const zodError = new ValidationError(
        "Request validation failed",
        requestBody
      );
      throw zodError;
    }

    const insights = await createPodcast(requestBody);

    return {
      status: 200,
      body: JSON.stringify(insights),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err: any) {
    console.error("Error in handler:", err);
    if (err instanceof ZodError) {
      const zodError = new ValidationError("Request validation failed", err);

      return {
        status: 400,
        body: JSON.stringify({ error: zodError.toJSON() }),
        headers: {
          "Content-Type": "application/json",
        },
      };
    }

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
