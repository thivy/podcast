import { HttpRequest } from "@azure/functions";
import {
  AnalyzeOptions,
  createContentUnderstandingClient,
} from "../../azure-services/azure-content-understanding";
import {
  RequestBody,
  RequestBodySchema,
  Style,
  Tone,
  VoiceName,
} from "../write-podcast-script/models";

export const buildContentUnderstandingPayload = async (
  request: HttpRequest
): Promise<RequestBody> => {
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
  const voice = (formData.get("voice") as VoiceName) || undefined;
  const style = (formData.get("style") as Style) || undefined;
  const tone = (formData.get("tone") as Tone) || undefined;

  const requestBody: RequestBody = {
    url: url,
    data: fileBuffer,
    voice: voice,
    style: style,
    tone: tone,
  };

  // Validate with Zod
  const validatedBody = RequestBodySchema.parse(requestBody);
  return validatedBody;
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
