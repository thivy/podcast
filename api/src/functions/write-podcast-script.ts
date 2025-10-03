import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
} from "@azure/functions";
import { debug } from "../common/debug";

const writePodcastScriptHandler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    const script = "";

    return {
      status: 200,
      body: JSON.stringify(script),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err: any) {
    debug("Error in simpleSpeechHandler:", err);
    return { status: 500, body: String(err?.message || err) };
  }
};

app.http(writePodcastScriptHandler.name, {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "podcast/writeScript",
  handler: writePodcastScriptHandler,
});
