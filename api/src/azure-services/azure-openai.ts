import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from "@azure/identity";
import { AzureOpenAI } from "openai";

export const azureOpenAI = () => {
  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";
  const azureADTokenProvider = getBearerTokenProvider(credential, scope);

  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  if (!deploymentName) {
    throw new Error("Missing AZURE_OPENAI_DEPLOYMENT_NAME env var");
  }

  const baseURL = `https://${deploymentName}.openai.azure.com/openai/v1/`;

  const apiVersion = "preview"; // TODO what version to use?
  const azureOpenAIClient = new AzureOpenAI({
    azureADTokenProvider,
    baseURL,
    apiVersion,
  });

  return azureOpenAIClient;
};

export const AZURE_OPENAI_MODEL_NAME = () => {
  const modelName = process.env.AZURE_OPENAI_MODEL_NAME;
  if (!modelName) {
    throw new Error("Missing AZURE_OPENAI_MODEL_NAME env var");
  }
  return modelName;
};
