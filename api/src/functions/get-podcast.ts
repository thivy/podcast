import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { downloadBlobToBuffer } from "../azure-services/azure-storage";

export async function getPodcast(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const name = request.params.name;
  if (!name) {
    return { status: 400, body: "Missing podcast name in route" };
  }

  try {
    const result = await downloadBlobToBuffer(name);
    if (!result) {
      return { status: 404, body: `Blob not found: ${name}` };
    }

    return {
      status: 200,
      body: result.buffer,
      headers: {
        "Content-Type": result.contentType || "audio/wav",
        "Content-Length": String(result.buffer.length),
        "Content-Disposition": `inline; filename="${name}"`,
      },
    };
  } catch (err: any) {
    context.log(`Error fetching blob: ${err?.message || err}`);
    return { status: 500, body: "Error retrieving audio blob" };
  }
}

app.http(getPodcast.name, {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "podcast/{name}",
  handler: getPodcast,
});
