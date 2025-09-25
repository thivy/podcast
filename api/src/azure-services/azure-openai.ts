import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from "@azure/identity";
import { AzureOpenAI } from "openai";

export const azureOpenAI = () => {
  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";
  const azureADTokenProvider = getBearerTokenProvider(credential, scope);

  const baseURL = `https://${AZURE_OPENAI_RESOURCE_NAME()}.openai.azure.com/openai/v1/`;

  const apiVersion = "preview"; // TODO what version to use?
  const azureOpenAIClient = new AzureOpenAI({
    azureADTokenProvider,
    baseURL,
    apiVersion,
  });

  return azureOpenAIClient;
};

export const azureOpenAIRealtime = () => {
  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";
  const azureADTokenProvider = getBearerTokenProvider(credential, scope);

  const endpoint = `https://${AZURE_OPENAI_RESOURCE_NAME()}.cognitiveservices.azure.com/`;
  const apiVersion = AZURE_OPENAI_REALTIME_API_VERSION();
  const deployment = AZURE_OPENAI_REALTIME_DEPLOYMENT();
  const azureOpenAIClient = new AzureOpenAI({
    azureADTokenProvider,
    apiVersion,
    deployment,
    endpoint,
  });

  return azureOpenAIClient;
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
