import { HttpHandler, HttpRequest, HttpResponseInit } from "@azure/functions";
import { debug } from "../common/debug";
import { PodcastScriptInput } from "../services/write-podcast-script/models";

const createPodcastHandler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    let input: PodcastScriptInput = await request.json();

    return {
      status: 200,
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err: any) {
    debug("Error in simpleSpeechHandler:", err);
    return { status: 500, body: String(err?.message || err) };
  }
};

// app.http(createPodcastHandler.name, {
//   methods: ["GET"],
//   route: "podcast",
//   authLevel: "anonymous",
//   extraInputs: [df.input.durableClient()],
//   handler: createPodcastHandler,
// });
