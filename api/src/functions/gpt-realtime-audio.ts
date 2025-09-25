import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
} from "@azure/functions";
import { debug } from "../common/debug";
import { createPodcastAudio } from "../services/create-podcast-audio/create-podcast-audio";

/**
 * HTTP POST /realtime/audio
 * Body: { "prompt": string }
 * Returns: { format, transcript, audioBase64, bytes }
 */
const realtimeAudioHandler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    // Allow prompt via query (?prompt=) or JSON body { prompt }
    let prompt = request.query.get("prompt") || "";
    if (!prompt) {
      try {
        const body: any = await request.json();
        if (body && typeof body.prompt === "string") prompt = body.prompt;
      } catch {
        // ignore body parse errors for GET
      }
    }
    if (!prompt) {
      return {
        status: 400,
        body: "Missing 'prompt' (query ?prompt= or JSON body)",
      };
    }

    const result = await createPodcastAudio(prompt, {});
    const body = Buffer.from(result.audioBase64, "base64");
    return {
      status: 200,
      body: body,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(body.length),
        "Content-Disposition": `inline; filename="realtime-audio.wav"`,
        "Cache-Control": "no-store",
      },
    };
  } catch (err: any) {
    debug("Error in realtimeAudioHandler", err);
    return { status: 500, body: err?.message || String(err) };
  }
};

app.http(realtimeAudioHandler.name, {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "realtime/audio",
  handler: realtimeAudioHandler,
});
