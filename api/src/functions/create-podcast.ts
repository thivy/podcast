import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  InvocationContext,
} from "@azure/functions";
import * as df from "durable-functions";
import { podcastOrchestratorAgent } from "../agents/orchestrator-agent";
import { buildContentUnderstandingPayload } from "../services/extract-podcast-insights/extract-content-insights";

const podcastHttpStart: HttpHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponse> => {
  const client = df.getClient(context);
  const requestBody = await buildContentUnderstandingPayload(request);

  const instanceId: string = await client.startNew(
    podcastOrchestratorAgent.name,
    { input: requestBody }
  );

  return client.createCheckStatusResponse(request, instanceId);
};

app.http(podcastHttpStart.name, {
  methods: ["POST"],
  route: "hello",
  authLevel: "anonymous",
  extraInputs: [df.input.durableClient()],
  handler: podcastHttpStart,
});
