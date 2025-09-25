import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from "@azure/identity";
import { AzureOpenAI } from "openai";

const credential = new DefaultAzureCredential();
const scope = "https://cognitiveservices.azure.com/.default";
const azureADTokenProvider = getBearerTokenProvider(credential, scope);

const resolveEndpoint = () =>
  `https://${AZURE_OPENAI_RESOURCE_NAME()}.cognitiveservices.azure.com/`;

let cachedClient: AzureOpenAI | undefined;
let cachedRealtimeClient: AzureOpenAI | undefined;

export const azureOpenAI = () => {
  if (!cachedClient) {
    cachedClient = new AzureOpenAI({
      azureADTokenProvider,
      apiVersion: AZURE_OPENAI_API_VERSION(),
      deployment: AZURE_OPENAI_MODEL_NAME(),
      endpoint: resolveEndpoint(),
    });
  }
  return cachedClient;
};

export const azureOpenAIRealtime = () => {
  if (!cachedRealtimeClient) {
    cachedRealtimeClient = new AzureOpenAI({
      azureADTokenProvider,
      apiVersion: AZURE_OPENAI_REALTIME_API_VERSION(),
      deployment: AZURE_OPENAI_REALTIME_DEPLOYMENT(),
      endpoint: resolveEndpoint(),
    });
  }
  return cachedRealtimeClient;
};

export const AZURE_OPENAI_RESOURCE_NAME = () => {
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;
  if (!resourceName) {
    throw new Error("Missing AZURE_OPENAI_RESOURCE_NAME env var");
  }
  return resourceName;
};

export const AZURE_OPENAI_REALTIME_API_VERSION = () => {
  const apiVersion =
    process.env.AZURE_OPENAI_REALTIME_API_VERSION || "2024-10-01-preview";

  if (!apiVersion) {
    throw new Error("Missing AZURE_OPENAI_REALTIME_API_VERSION env var");
  }
  return apiVersion;
};

export const AZURE_OPENAI_REALTIME_DEPLOYMENT = () => {
  const deploymentName = process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT;
  if (!deploymentName) {
    throw new Error("Missing AZURE_OPENAI_REALTIME_DEPLOYMENT env var");
  }
  return deploymentName;
};

export const AZURE_OPENAI_MODEL_NAME = () => {
  const modelName = process.env.AZURE_OPENAI_MODEL_NAME;
  if (!modelName) {
    throw new Error("Missing AZURE_OPENAI_MODEL_NAME env var");
  }
  return modelName;
};

export const AZURE_OPENAI_API_VERSION = () => {
  const version = process.env.AZURE_OPENAI_API_VERSION || "preview";
  if (!version) {
    throw new Error("Missing AZURE_OPENAI_API_VERSION env var");
  }
  return version;
};
