import { HttpRequest } from "@azure/functions";
import { ZodError } from "zod";
import {
  AnalyzeOptions,
  createContentUnderstandingClient,
} from "../azure-services/azure-content-understanding";
import {
  RequestBody,
  RequestBodySchema,
  Style,
  Tone,
  VoiceName,
} from "./models";

export const buildContentUnderstandingPayload = async (
  request: HttpRequest
): Promise<RequestBody | ZodError> => {
  // Handle multipart form data
  const formData = await request.formData();
  // Extract file
  const file = formData.get("file") as unknown as File;
  let fileBuffer: Buffer | undefined;

  if (file) {
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  }

  const url = formData.get("url") as string;

  // Extract preferences
  const speakersRaw =
    typeof formData.getAll === "function" ? formData.getAll("voice") : [];
  const speakers =
    Array.isArray(speakersRaw) && speakersRaw.length > 0
      ? (speakersRaw.filter(Boolean) as VoiceName[])
      : undefined;
  const style = (formData.get("style") as Style) || undefined;
  const tone = (formData.get("tone") as Tone) || undefined;
  const instruction = formData.get("instruction") as string;

  const requestBody: RequestBody = {
    url: url || undefined,
    data: fileBuffer,
    style: style,
    tone: tone,
    speakers: speakers,
    instruction: instruction || undefined,
  };

  const validatedBody = RequestBodySchema.safeParse(requestBody);

  if (!validatedBody.success) {
    return new ZodError(validatedBody.error.errors);
  }
  return validatedBody.data;
};

export const extractContentInsights = async (options: RequestBody) => {
  const client = createContentUnderstandingClient();

  const analyzeOptions: AnalyzeOptions = {
    analyzerType: "prebuilt-documentAnalyzer", // TODO: make this dynamic based on file type
    source: options,
  };

  const result = await client.analyzeAndGetResults(analyzeOptions);

  return result;
};
