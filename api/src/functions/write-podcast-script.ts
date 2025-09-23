import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
} from "@azure/functions";
import { debug } from "../common/debug";
import { writePodcastScript } from "../services/write-podcast-script/write-podcast-script";

const writePodcastScriptHandler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    const script = await writePodcastScript("The future of AI in healthcare");

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
