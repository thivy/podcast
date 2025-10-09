import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import * as df from "durable-functions";
import { ZodError } from "zod";
import { podcastOrchestratorAgent } from "../agents/orchestrator-agent";
import { ValidationError } from "../common/error";
import { buildContentUnderstandingPayload } from "../services/extract-podcast-insights";

const podcastHttpStart: HttpHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  const client = df.getClient(context);
  const requestBody = await buildContentUnderstandingPayload(request);

  if (requestBody instanceof ZodError) {
    const zodError = new ValidationError(
      "Request validation failed",
      requestBody
    );

    return {
      status: 400,
      body: JSON.stringify({ error: zodError.toJSON() }),
    };
  }

  const instanceId: string = await client.startNew(
    podcastOrchestratorAgent.name,
    { input: requestBody }
  );

  return client.createCheckStatusResponse(request, instanceId);
};

app.http(podcastHttpStart.name, {
  methods: ["POST"],
  route: "podcast",
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: podcastHttpStart,
});
