import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

export const getBlobServiceClient = () => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) {
    throw new Error("Missing AZURE_STORAGE_ACCOUNT_NAME env var");
  }
  const credential = new DefaultAzureCredential();
  const blobUrl = `https://${accountName}.blob.core.windows.net`;
  return new BlobServiceClient(blobUrl, credential);
};

export const getContainerName = () => {
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  if (!containerName) {
    throw new Error("Missing AZURE_STORAGE_CONTAINER_NAME env var");
  }
  return containerName;
};

export const uploadBufferToBlob = async (
  buffer: Buffer,
  blobName: string,
  contentType = "audio/wav"
) => {
  const client = getBlobServiceClient();
  const containerName = getContainerName();
  const containerClient = client.getContainerClient(containerName);

  const blobClient = containerClient.getBlockBlobClient(blobName);

  await blobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  return blobClient.name;
};

export const downloadBlobToBuffer = async (blobName: string) => {
  const client = getBlobServiceClient();
  const containerName = getContainerName();
  const containerClient = client.getContainerClient(containerName);

  const blobClient = containerClient.getBlobClient(blobName);
  const exists = await blobClient.exists();
  if (!exists) {
    return null;
  }

  const download = await blobClient.download();
  const chunks: Buffer[] = [];
  const readable = download.readableStreamBody;
  if (!readable) {
    // fallback: try to read downloaded array buffer
    const downloaded = await blobClient.downloadToBuffer();
    return {
      buffer: downloaded,
      contentType:
        (download.contentType as string) || "application/octet-stream",
    };
  }

  return await new Promise<{ buffer: Buffer; contentType: string }>(
    (resolve, reject) => {
      readable.on("data", (chunk: Buffer) => chunks.push(chunk));
      readable.on("end", () =>
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: download.contentType || "application/octet-stream",
        })
      );
      readable.on("error", (err) => reject(err));
    }
  );
};
