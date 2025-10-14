import * as path from "path";

import { promises as fs } from "fs";

type WriteToDiskOptions = {
  fileName?: string;
  outputDir?: string;
  extension?: string;
};

const ensureExtension = (target: string, extension: string) => {
  const normalizedExtension = extension.startsWith(".")
    ? extension
    : `.${extension}`;
  return path.extname(target) ? target : `${target}${normalizedExtension}`;
};

const sanitizeFileName = (fileName: string) => fileName.replace(/\s+/g, "-");

export const writeToDisk = async (
  payload: Buffer | string,
  options: WriteToDiskOptions | string = {}
) => {
  let filePath: string | undefined;
  let bytes: number | undefined;
  try {
    const defaultExtension = ".wav";
    const normalizedOptions: WriteToDiskOptions | string = options;

    const buffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(
          payload.startsWith("data:")
            ? payload.substring(payload.indexOf(",") + 1)
            : payload,
          "base64"
        );

    const computeTargetFromOptions = (
      opts: WriteToDiskOptions | string
    ): { target: string; extension: string } => {
      if (typeof opts === "string") {
        const finalPath = ensureExtension(opts, defaultExtension);
        return { target: finalPath, extension: defaultExtension };
      }

      const {
        outputDir = "output",
        fileName,
        extension = defaultExtension,
      } = opts;
      const sanitizedFileName = sanitizeFileName(
        fileName ||
          // Replace characters invalid on Windows ( : * ? " < > | ) and also periods in the time portion for consistency
          `gpt-audio-${new Date()
            .toISOString()
            .replace(/[:*?"<>|]/g, "-")
            .replace(/\./g, "-")}`
      );
      const finalFileName = ensureExtension(sanitizedFileName, extension);
      return {
        target: path.join(outputDir, finalFileName),
        extension,
      };
    };

    const { target } = computeTargetFromOptions(normalizedOptions);

    const abs = path.isAbsolute(target)
      ? target
      : path.resolve(process.cwd(), target);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, buffer);

    filePath = abs;
    bytes = buffer.length;
  } catch (err: any) {
    console.error(
      "Error writing GPT audio to local file:",
      err?.message || err
    );
  }

  return { filePath, bytes };
};
