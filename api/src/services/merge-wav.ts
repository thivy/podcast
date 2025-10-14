// ...existing code...
type ParsedWav = {
  format: {
    audioFormat: number;
    numChannels: number;
    sampleRate: number;
    bitsPerSample: number;
    blockAlign: number;
    byteRate: number;
  };
  dataOffset: number;
  dataLength: number;
  headerUntilData: Buffer;
  original: Buffer;
  debug?: {
    chunkTrail: string[];
  };
};

const WAV_DEBUG = process.env.WAV_DEBUG === "1";

function dumpHeader(tag: string, buf: Buffer, index?: number) {
  if (!WAV_DEBUG) return;
  const first64 = buf.subarray(0, Math.min(64, buf.length));
  const hex =
    first64
      .toString("hex")
      .match(/.{1,2}/g)
      ?.join(" ") || "";
  const ascii = first64.toString("ascii").replace(/[^\x20-\x7E]/g, "."); // printable only
  console.log(
    `[WAV][${tag}] idx=${index ?? "-"} len=${
      buf.length
    } head(hex)=${hex} head(ascii)=${ascii}`
  );
}

function parseWav(buf: Buffer, index?: number): ParsedWav {
  dumpHeader("raw", buf, index);

  if (buf.length < 20) {
    throw new Error("WAV too small (<20 bytes) - likely truncated or not WAV");
  }
  if (buf.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Missing RIFF");
  }
  if (buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Missing WAVE");
  }

  let offset = 12;
  let fmtFound = false;
  let dataFound = false;
  let fmt: ParsedWav["format"] | undefined;
  let dataOffset = -1;
  let dataLength = 0;
  let dataHeaderOffset = -1;
  const chunkTrail: string[] = [];

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    chunkTrail.push(`${chunkId}:${chunkSize}`);
    const chunkDataStart = offset + 8;
    const next = chunkDataStart + chunkSize + (chunkSize & 1);

    if (chunkId === "fmt ") {
      fmtFound = true;
      if (chunkSize < 16) {
        throw new Error("fmt chunk too small");
      }
      if (chunkDataStart + 16 > buf.length) {
        throw new Error("fmt chunk truncated");
      }
      const audioFormat = buf.readUInt16LE(chunkDataStart);
      const numChannels = buf.readUInt16LE(chunkDataStart + 2);
      const sampleRate = buf.readUInt32LE(chunkDataStart + 4);
      const byteRate = buf.readUInt32LE(chunkDataStart + 8);
      const blockAlign = buf.readUInt16LE(chunkDataStart + 12);
      const bitsPerSample = buf.readUInt16LE(chunkDataStart + 14);
      fmt = {
        audioFormat,
        numChannels,
        sampleRate,
        bitsPerSample,
        blockAlign,
        byteRate,
      };
    } else if (chunkId === "data") {
      dataFound = true;
      dataHeaderOffset = offset;
      const available = Math.max(0, buf.length - chunkDataStart);
      if (chunkSize === 0xffffffff || next > buf.length) {
        // Some encoders (e.g., streaming) set chunk size to 0xFFFFFFFF; clamp to available bytes
        dataLength = available;
      } else {
        dataLength = Math.min(chunkSize, available);
      }
      if (dataLength <= 0) {
        throw new Error(
          `data chunk has no payload (chunkSize=${chunkSize} available=${available})`
        );
      }
      dataOffset = chunkDataStart;
      break;
    }

    if (next > buf.length) {
      if (WAV_DEBUG) {
        console.warn(
          `[WAV][warn] Truncated chunk ${chunkId} size=${chunkSize} offset=${offset} bufferLen=${buf.length}`
        );
      }
      break; // stop scanning; we'll try fallback
    }

    offset = next;
  }

  // Fallback search if standard loop failed — try to recover fmt/data even when not debugging
  if (!fmtFound || !dataFound) {
    if (WAV_DEBUG) {
      console.warn(
        `[WAV][fallback] fmtFound=${fmtFound} dataFound=${dataFound} scanning raw search`
      );
    }
    if (!fmtFound) {
      const idx = buf.indexOf("fmt ");
      if (idx >= 12 && idx + 24 <= buf.length) {
        const size = buf.readUInt32LE(idx + 4);
        if (size >= 16) {
          const start = idx + 8;
          fmtFound = true;
          fmt = {
            audioFormat: buf.readUInt16LE(start),
            numChannels: buf.readUInt16LE(start + 2),
            sampleRate: buf.readUInt32LE(start + 4),
            byteRate: buf.readUInt32LE(start + 8),
            blockAlign: buf.readUInt16LE(start + 12),
            bitsPerSample: buf.readUInt16LE(start + 14),
          };
          if (WAV_DEBUG)
            console.log("[WAV][fallback] Recovered fmt via search");
        }
      }
    }
    if (!dataFound) {
      const idx = buf.indexOf("data");
      if (idx >= 12 && idx + 8 <= buf.length) {
        const size = buf.readUInt32LE(idx + 4);
        const start = idx + 8;
        const available = Math.max(0, buf.length - start);
        const length =
          size === 0xffffffff || start + size > buf.length ? available : size;
        if (length > 0) {
          dataFound = true;
          dataHeaderOffset = idx;
          dataOffset = start;
          dataLength = length;
          if (WAV_DEBUG)
            console.log("[WAV][fallback] Recovered data via search");
        }
      }
    }
  }

  if (!fmtFound || !dataFound || !fmt) {
    throw new Error(
      `Invalid WAV: missing fmt or data chunk (idx=${index} trail=${chunkTrail.join(
        ","
      )})`
    );
  }

  const headerUntilData = Buffer.from(
    buf.slice(0, dataHeaderOffset + 8) // include 'data' + size field
  );

  return {
    format: fmt,
    dataOffset,
    dataLength,
    headerUntilData,
    original: buf,
    debug: WAV_DEBUG ? { chunkTrail } : undefined,
  };
}

export function mergeWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) throw new Error("No buffers to merge.");
  const parsed: ParsedWav[] = [];
  buffers.forEach((b, i) => {
    try {
      parsed.push(parseWav(b, i));
    } catch (err: any) {
      if (WAV_DEBUG) {
        console.error(
          `[WAV][error] segment index ${i} parse failed:`,
          err.message
        );
      }
      throw err; // rethrow for now (could skip if desired)
    }
  });

  const f0 = parsed[0].format;
  for (let i = 1; i < parsed.length; i++) {
    const f = parsed[i].format;
    if (
      f.audioFormat !== f0.audioFormat ||
      f.numChannels !== f0.numChannels ||
      f.sampleRate !== f0.sampleRate ||
      f.bitsPerSample !== f0.bitsPerSample
    ) {
      throw new Error(
        `Inconsistent WAV formats (index ${i} differs) cannot merge safely.`
      );
    }
  }

  const totalPcm = parsed.reduce((acc, p) => acc + p.dataLength, 0);
  const header = Buffer.from(parsed[0].headerUntilData);
  header.writeUInt32LE(totalPcm, header.length - 4); // data size
  const fileSizeMinus8 = header.length - 8 + totalPcm;
  header.writeUInt32LE(fileSizeMinus8, 4); // RIFF size

  const out = Buffer.allocUnsafe(header.length + totalPcm);
  header.copy(out, 0);

  let writeOffset = header.length;
  for (const p of parsed) {
    p.original.copy(
      out,
      writeOffset,
      p.dataOffset,
      p.dataOffset + p.dataLength
    );
    writeOffset += p.dataLength;
  }

  if (WAV_DEBUG) {
    console.log(
      `[WAV][merge] segments=${parsed.length} totalPCM=${totalPcm} outBytes=${out.length}`
    );
  }
  return out;
}
// ...existing code...
