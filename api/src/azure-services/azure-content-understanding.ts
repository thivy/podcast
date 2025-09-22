export type RequestBody = {
  url?: string; // URL to the file to be analyzed
  data?: Buffer; // Base64-encoded file content
};

export interface AnalyzeOptions {
  source: RequestBody;
  analyzerType: AnalyzerType;
}

export type AnalyzerType =
  | "prebuilt-documentAnalyzer"
  | "prebuilt-imageAnalyzer"
  | "prebuilt-audioAnalyzer"
  | "prebuilt-videoAnalyzer"
  | string;

export type AnalyzeStatus = "Running" | "NotStarted" | "Succeeded";

export type AnalyzeResult = {
  id: string;
  status: AnalyzeStatus;
  result: {
    analyzerId: AnalyzerType; // e.g., "prebuilt-documentAnalyzer"
    apiVersion: string; // e.g., "2025-05-01-preview"
    createdAt: string; // ISO date string
    warnings: any[]; // array of warning objects (specify type if known)
    contents: any[]; // array of content objects (specify type if known)
  };
};

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
    const binaryData = (source as RequestBody).data;
    const body = JSON.stringify({
      data: Buffer.from(binaryData).toString("base64"),
    });

    const submitResp = await this.fetcher(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
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
