import { z } from "zod";

export type RequestBody = z.infer<typeof RequestBodySchema>;
export type AnalyzeOptions = z.infer<typeof AnalyzeOptionsSchema>;

export type AnalyzerType = z.infer<typeof AnalyzerTypeSchema>;
export type AnalyzeStatus = z.infer<typeof AnalyzeStatusSchema>;

export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

const RequestBodySchema = z
  .object({
    url: z.string().url().optional(),
    data: z.instanceof(Buffer).optional(),
  })
  .refine((data) => data.url || data.data, {
    message: "Either 'url' or 'data' must be provided",
  });

const AnalyzerTypeSchema = z.enum([
  "prebuilt-documentAnalyzer",
  "prebuilt-imageAnalyzer",
  "prebuilt-audioAnalyzer",
  "prebuilt-videoAnalyzer",
]);

const AnalyzeOptionsSchema = z.object({
  source: RequestBodySchema,
  analyzerType: AnalyzerTypeSchema,
});

const AnalyzeStatusSchema = z.enum(["Running", "NotStarted", "Succeeded"]);

const AnalyzeResultSchema = z.object({
  id: z.string(),
  status: AnalyzeStatusSchema,
  result: z.object({
    analyzerId: AnalyzerTypeSchema, // e.g., "prebuilt-documentAnalyzer"
    apiVersion: z.string(), // e.g., "2024-04-30"
    createdAt: z.string(), // ISO date string
    warnings: z.array(z.any()), // array of warning objects (specify type if known)
    contents: z.array(z.any()), // array of content objects (specify type if known)
  }),
});

const MAX_ATTEMPTS = 30;
const MAX_DELAY_MS = 30000; // 30 seconds // TODO: make this configurable

export type ClientOptions = {
  maxAttempts: number; // default 30
};

export class ContentUnderstandingClient {
  private maxAttempts: number;
  constructor(opts: ClientOptions = { maxAttempts: MAX_ATTEMPTS }) {
    this.maxAttempts = opts.maxAttempts;
  }

  private get secrets() {
    if (!process.env.AZURE_CONTENT_UNDERSTANDING_ENDPOINT) {
      throw new ContentUnderstandingError(
        "Missing AZURE_CONTENT_UNDERSTANDING_ENDPOINT environment variable"
      );
    }
    if (!process.env.AZURE_CONTENT_UNDERSTANDING_KEY) {
      throw new ContentUnderstandingError(
        "Missing AZURE_CONTENT_UNDERSTANDING_KEY environment variable"
      );
    }
    if (!process.env.AZURE_CONTENT_UNDERSTANDING_API_VERSION) {
      throw new ContentUnderstandingError(
        "Missing AZURE_CONTENT_UNDERSTANDING_API_VERSION environment variable"
      );
    }

    return {
      endpoint: process.env.AZURE_CONTENT_UNDERSTANDING_ENDPOINT,
      apiVersion: process.env.AZURE_CONTENT_UNDERSTANDING_API_VERSION,
      key: process.env.AZURE_CONTENT_UNDERSTANDING_KEY,
    };
  }

  private buildAnalyzeUrl(analyzerType: AnalyzerType): string {
    return `${this.secrets.endpoint}/analyzers/${analyzerType}:analyze?api-version=${this.secrets.apiVersion}`;
  }

  private buildResultUrl(requestId: string): string {
    return `${this.secrets.endpoint}/analyzerResults/${encodeURIComponent(
      requestId
    )}?api-version=${this.secrets.apiVersion}`;
  }

  async getAnalyzerResults(requestId: string): Promise<AnalyzeResult> {
    let status: AnalyzeStatus = "NotStarted";

    while (status === "NotStarted" || status === "Running") {
      if (this.maxAttempts-- <= 0) {
        throw new ContentUnderstandingError("Max attempts reached");
      }

      const response = await this.fetcher(this.buildResultUrl(requestId), {
        method: "GET",
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new ContentUnderstandingError(
          "Failed to fetch analyzer results",
          {
            status: response.status,
            body: text,
          }
        );
      }

      const result: AnalyzeResult = await response.json();
      if (result.status === "Succeeded") {
        return result;
      } else {
        await this.delay(MAX_DELAY_MS);
      }
    }
  }

  /** Submit an analyze job and wait for completion, returning the final job JSON. */
  async analyze(options: AnalyzeOptions): Promise<AnalyzeResult> {
    const { source } = options;

    const analyzeUrl = this.buildAnalyzeUrl(options.analyzerType);
    const binaryData = source.data;

    let requestBody: {
      url?: string;
      data?: string;
    } = {};

    if (source.url) {
      requestBody.url = source.url;
    } else if (binaryData) {
      requestBody.data = Buffer.from(binaryData).toString("base64");
    }

    const submitResp = await this.fetcher(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!submitResp.ok) {
      const text = await submitResp.text();
      throw new ContentUnderstandingError("Analyze submission failed", {
        status: submitResp.status,
        body: text,
      });
    }

    // Service is expected to return a request id either in body or location header.
    return await submitResp.json();
  }

  private fetcher(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, {
      ...options,
      headers: {
        "Ocp-Apim-Subscription-Key": this.secrets.key,
        ...options.headers,
      },
    });
  }

  private delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }
}

export class ContentUnderstandingError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = "ContentUnderstandingError";
  }
}

// Convenience factory (mirrors pattern used by some Azure SDKs)
export function createContentUnderstandingClient(options?: ClientOptions) {
  return new ContentUnderstandingClient(options);
}
