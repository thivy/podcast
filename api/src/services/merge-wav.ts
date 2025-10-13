/*
  Helper to merge multiple PCM WAV files (uncompressed) into a single WAV.
  No external dependencies; performs light-weight parsing of the RIFF structure.

  Supports (current implementation):
  - 8/16/24/32-bit PCM samples (int) and 32-bit float PCM (format code 3) – normalization only for 16-bit and 32-bit float.
  - Consistent format across all inputs (enforced by default).
  - Optional silence insertion between clips.
  - Optional peak normalization.

  Limitations / Notes:
  - Resampling (different sample rates) is NOT implemented. Choose one format or preprocess sources.
  - Channel count & bits per sample must match (unless mismatchMode !== 'strict', in which case the first file's fmt wins and others are only accepted if equal).
  - Large numbers of long clips may consume memory; consider streaming/ffmpeg for huge workloads.
*/

import { promises as fs } from "fs";
import * as path from "path";

export interface MergeWavConfig {
  /** Milliseconds of silence inserted between each clip (default 0) */
  insertSilenceMsBetween?: number;
  /** Perform peak normalization (scales so max sample reaches targetPeak). */
  normalize?: boolean | { targetPeak?: number };
  /** How to handle format mismatches */
  mismatchMode?: "strict" | "warn" | "coerce";
  /** If true, returns detailed debug info. */
  debug?: boolean;
  /** Custom logger override (defaults to console.log when debug true). */
  logger?: (...args: any[]) => void;
  /** Return encoding; default 'base64'. */
  returnEncoding?: "base64" | "binary" | "hex";
  /**
   * Treat inputs that are missing a RIFF/WAVE header as raw PCM and wrap them.
   * Applied only for mergeWavBuffers when a buffer/base64 does NOT start with 'RIFF'.
   */
  rawPcmFallbackFormat?: {
    sampleRate: number;
    numChannels: number;
    bitsPerSample: number; // 16 or 32 typical
    /** 1 = PCM int, 3 = IEEE float */
    audioFormat?: 1 | 3;
  };
  /** If true, parser will try to salvage truncated 'data' chunk instead of throwing. */
  tolerateTruncatedDataChunk?: boolean;
}

export interface MergedWavMeta {
  /** Encoded WAV file (header + data) in requested encoding (default base64). */
  data: string;
  /** Raw Buffer in case caller prefers direct use. */
  buffer: Buffer;
  /** Audio format details. */
  format: ParsedWavFormat;
  /** Total bytes in Buffer. */
  bytes: number;
  /** Number of source clips merged. */
  clipCount: number;
  /** Total duration in seconds. */
  durationSeconds: number;
}

interface ParsedWavFormat {
  audioFormat: number; // 1 = PCM, 3 = IEEE float
  numChannels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
}

interface ParsedWav {
  format: ParsedWavFormat;
  data: Buffer; // PCM frames only
  durationSeconds: number;
}

/** Core WAV parse from Buffer */
function parseWavBuffer(
  buf: Buffer,
  label?: string,
  cfg?: MergeWavConfig
): ParsedWav {
  if (
    buf.toString("ascii", 0, 4) !== "RIFF" ||
    buf.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error(
      `NOT_WAV: Input ${label || "<buffer>"} is not a RIFF/WAVE file.`
    );
  }

  let offset = 12; // Skip RIFF header
  let fmt: ParsedWavFormat | undefined;
  let dataChunk: Buffer | undefined;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString("ascii", offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;
    const chunkDataEnd = chunkDataStart + chunkSize;
    if (chunkDataEnd > buf.length) {
      const remaining = buf.length - (offset + 8);
      if (
        cfg?.tolerateTruncatedDataChunk &&
        chunkId === "data" &&
        remaining > 0
      ) {
        // Clamp data chunk to remaining bytes
        const usable = buf.subarray(offset + 8, buf.length);
        dataChunk = usable;
        break; // stop parsing
      } else {
        throw new Error(
          `Malformed WAV: chunk '${chunkId}' size=${chunkSize} exceeds remaining bytes=${remaining} in ${
            label || "<buffer>"
          }`
        );
      }
    }
    if (chunkId === "fmt ") {
      fmt = {
        audioFormat: buf.readUInt16LE(chunkDataStart),
        numChannels: buf.readUInt16LE(chunkDataStart + 2),
        sampleRate: buf.readUInt32LE(chunkDataStart + 4),
        byteRate: buf.readUInt32LE(chunkDataStart + 8),
        blockAlign: buf.readUInt16LE(chunkDataStart + 12),
        bitsPerSample: buf.readUInt16LE(chunkDataStart + 14),
      };
    } else if (chunkId === "data") {
      dataChunk = buf.subarray(chunkDataStart, chunkDataEnd);
    }
    offset = chunkDataEnd + (chunkSize % 2); // word align
    if (fmt && dataChunk) break; // we have what we need
  }

  if (!fmt) throw new Error(`fmt chunk missing in ${label || "<buffer>"}`);
  if (!dataChunk)
    throw new Error(`data chunk missing in ${label || "<buffer>"}`);

  const bytesPerSample = fmt.bitsPerSample / 8;
  const totalFrames = dataChunk.length / (bytesPerSample * fmt.numChannels);
  const durationSeconds = totalFrames / fmt.sampleRate;

  return { format: fmt, data: dataChunk, durationSeconds };
}

/** Read and parse a WAV file into header info + PCM data. */
async function readWav(filePath: string): Promise<ParsedWav> {
  const buf = await fs.readFile(filePath);
  return parseWavBuffer(buf, filePath);
}

function logIf(cfg: MergeWavConfig, ...args: any[]) {
  if (cfg.debug) (cfg.logger || console.log)(...args);
}

/** Create a PCM silence buffer matching provided format */
function createSilence(ms: number, fmt: ParsedWavFormat): Buffer {
  if (ms <= 0) return Buffer.alloc(0);
  const frames = Math.round((ms / 1000) * fmt.sampleRate);
  const bytesPerFrame = fmt.blockAlign; // channels * bytesPerSample
  return Buffer.alloc(frames * bytesPerFrame, 0);
}

/** Write a wav header for given PCM data length & format. */
function buildWavHeader(fmt: ParsedWavFormat, dataLength: number): Buffer {
  const header = Buffer.alloc(44);
  // RIFF chunk descriptor
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataLength, 4); // file size - 8
  header.write("WAVE", 8, "ascii");

  // fmt subchunk
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(fmt.audioFormat, 20);
  header.writeUInt16LE(fmt.numChannels, 22);
  header.writeUInt32LE(fmt.sampleRate, 24);
  header.writeUInt32LE(fmt.byteRate, 28);
  header.writeUInt16LE(fmt.blockAlign, 32);
  header.writeUInt16LE(fmt.bitsPerSample, 34);

  // data subchunk
  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataLength, 40);
  return header;
}

/** Apply peak normalization in-place (supports 16-bit int & 32-bit float). */
function normalizePcm(data: Buffer, fmt: ParsedWavFormat, targetPeak = 0.98) {
  const { bitsPerSample, audioFormat } = fmt;
  if (audioFormat === 1 && bitsPerSample === 16) {
    let max = 0;
    for (let i = 0; i < data.length; i += 2) {
      const v = Math.abs(data.readInt16LE(i));
      if (v > max) max = v;
    }
    if (max === 0) return; // silence
    const scale = (targetPeak * 32767) / max;
    if (scale >= 1) return; // already below target
    for (let i = 0; i < data.length; i += 2) {
      const v = data.readInt16LE(i);
      const nv = Math.max(-32768, Math.min(32767, Math.round(v * scale)));
      data.writeInt16LE(nv, i);
    }
  } else if (audioFormat === 3 && bitsPerSample === 32) {
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.abs(data.readFloatLE(i));
      if (v > max) max = v;
    }
    if (max === 0) return;
    const scale = targetPeak / max;
    if (scale >= 1) return;
    for (let i = 0; i < data.length; i += 4) {
      const v = data.readFloatLE(i);
      data.writeFloatLE(v * scale, i);
    }
  }
}

export async function mergeWavFiles(
  filePaths: string[],
  config: MergeWavConfig = {}
): Promise<MergedWavMeta> {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new Error("No WAV file paths provided.");
  }
  const cfg: MergeWavConfig = {
    insertSilenceMsBetween: 0,
    mismatchMode: "strict",
    ...config,
  };

  logIf(cfg, `Merging ${filePaths.length} wav files...`);
  const parsed: ParsedWav[] = [];
  for (const fp of filePaths) {
    const abs = path.resolve(fp);
    const p = await readWav(abs);
    parsed.push(p);
  }

  const baseFmt = parsed[0].format;
  // Validate formats
  for (let i = 1; i < parsed.length; i++) {
    const f = parsed[i].format;
    const mismatch =
      f.audioFormat !== baseFmt.audioFormat ||
      f.numChannels !== baseFmt.numChannels ||
      f.sampleRate !== baseFmt.sampleRate ||
      f.bitsPerSample !== baseFmt.bitsPerSample;
    if (mismatch) {
      if (cfg.mismatchMode === "strict") {
        throw new Error(
          `Format mismatch in file index ${i}. All WAVs must share audioFormat, channels, sampleRate, bitsPerSample.`
        );
      } else if (cfg.mismatchMode === "warn") {
        logIf(cfg, `WARNING: format mismatch in file ${i}, using base format.`);
      } else if (cfg.mismatchMode === "coerce") {
        // We could attempt conversion here but that's non-trivial; documented limitation.
      }
    }
  }

  const silence = createSilence(cfg.insertSilenceMsBetween || 0, baseFmt);
  const segments: Buffer[] = [];
  parsed.forEach((p, idx) => {
    segments.push(p.data);
    if (idx < parsed.length - 1 && silence.length) segments.push(silence);
  });
  const totalPcmLength = segments.reduce((acc, b) => acc + b.length, 0);
  const mergedPcm = Buffer.allocUnsafe(totalPcmLength);
  let offset = 0;
  for (const seg of segments) {
    seg.copy(mergedPcm, offset);
    offset += seg.length;
  }

  if (cfg.normalize) {
    const targetPeak =
      typeof cfg.normalize === "object" && cfg.normalize.targetPeak
        ? cfg.normalize.targetPeak
        : 0.98;
    logIf(cfg, `Normalizing audio to target peak ${targetPeak}`);
    normalizePcm(mergedPcm, baseFmt, targetPeak);
  }

  const header = buildWavHeader(baseFmt, mergedPcm.length);
  const finalBuffer = Buffer.concat([header, mergedPcm]);

  const durationSeconds =
    mergedPcm.length /
    baseFmt.byteRate; /* since byteRate = sampleRate * blockAlign */

  const encoding = cfg.returnEncoding || "base64";
  const data = finalBuffer.toString(encoding);

  return {
    data,
    buffer: finalBuffer,
    bytes: finalBuffer.length,
    format: baseFmt,
    clipCount: parsed.length,
    durationSeconds,
  };
}

/** Merge already-loaded WAV buffers or base64 strings (each must be a complete WAV). */
export async function mergeWavBuffers(
  wavs: (Buffer | string)[],
  config: MergeWavConfig = {}
): Promise<MergedWavMeta> {
  if (!Array.isArray(wavs) || wavs.length === 0) {
    throw new Error("No WAV buffers provided.");
  }
  const cfg: MergeWavConfig = {
    insertSilenceMsBetween: 0,
    mismatchMode: "strict",
    ...config,
  };
  logIf(cfg, `Merging ${wavs.length} in-memory wav buffers...`);
  const parsed: ParsedWav[] = [];
  for (let i = 0; i < wavs.length; i++) {
    const raw = wavs[i];
    let buf: Buffer;
    if (typeof raw === "string") {
      // Assume base64 unless it looks like hex
      const isLikelyHex = /^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0;
      buf = Buffer.from(raw, isLikelyHex ? "hex" : "base64");
    } else {
      buf = raw;
    }
    // If it's a WAV header parse directly; else optionally wrap as raw PCM.
    const isWav =
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WAVE";
    if (isWav) {
      parsed.push(parseWavBuffer(buf, `buffer[${i}]`, cfg));
    } else if (cfg.rawPcmFallbackFormat) {
      const fmt = cfg.rawPcmFallbackFormat;
      const bytesPerSample = fmt.bitsPerSample / 8;
      const blockAlign = fmt.numChannels * bytesPerSample;
      const byteRate = fmt.sampleRate * blockAlign;
      const header = buildWavHeader(
        {
          audioFormat: fmt.audioFormat || (fmt.bitsPerSample === 32 ? 3 : 1),
          numChannels: fmt.numChannels,
          sampleRate: fmt.sampleRate,
          byteRate,
          blockAlign,
          bitsPerSample: fmt.bitsPerSample,
        },
        buf.length
      );
      const wrapped = Buffer.concat([header, buf]);
      parsed.push(parseWavBuffer(wrapped, `raw-pcm[${i}]`, cfg));
    } else {
      throw new Error(
        `Buffer index ${i} is not a WAV (missing RIFF header) and no rawPcmFallbackFormat provided.`
      );
    }
  }
  const baseFmt = parsed[0].format;
  for (let i = 1; i < parsed.length; i++) {
    const f = parsed[i].format;
    const mismatch =
      f.audioFormat !== baseFmt.audioFormat ||
      f.numChannels !== baseFmt.numChannels ||
      f.sampleRate !== baseFmt.sampleRate ||
      f.bitsPerSample !== baseFmt.bitsPerSample;
    if (mismatch) {
      if (cfg.mismatchMode === "strict") {
        throw new Error(
          `Format mismatch in buffer index ${i}. All WAVs must share audioFormat, channels, sampleRate, bitsPerSample.`
        );
      } else if (cfg.mismatchMode === "warn") {
        logIf(
          cfg,
          `WARNING: format mismatch in buffer ${i}, using base format.`
        );
      }
    }
  }
  const silence = createSilence(cfg.insertSilenceMsBetween || 0, baseFmt);
  const segments: Buffer[] = [];
  parsed.forEach((p, idx) => {
    segments.push(p.data);
    if (idx < parsed.length - 1 && silence.length) segments.push(silence);
  });
  const totalPcmLength = segments.reduce((a, b) => a + b.length, 0);
  const mergedPcm = Buffer.allocUnsafe(totalPcmLength);
  let off = 0;
  for (const s of segments) {
    s.copy(mergedPcm, off);
    off += s.length;
  }
  if (cfg.normalize) {
    const targetPeak =
      typeof cfg.normalize === "object" && cfg.normalize.targetPeak
        ? cfg.normalize.targetPeak
        : 0.98;
    logIf(cfg, `Normalizing audio to target peak ${targetPeak}`);
    normalizePcm(mergedPcm, baseFmt, targetPeak);
  }
  const header = buildWavHeader(baseFmt, mergedPcm.length);
  const finalBuffer = Buffer.concat([header, mergedPcm]);
  const durationSeconds = mergedPcm.length / baseFmt.byteRate;
  const encoding = cfg.returnEncoding || "base64";
  const data = finalBuffer.toString(encoding);
  return {
    data,
    buffer: finalBuffer,
    bytes: finalBuffer.length,
    format: baseFmt,
    clipCount: parsed.length,
    durationSeconds,
  };
}

// Backwards compatibility: alias name for older calling style expecting base64 string only.
export async function mergeWavFilesToString(
  filePaths: string[],
  config: Omit<MergeWavConfig, "returnEncoding"> & {
    returnEncoding?: "base64" | "hex" | "binary";
  } = {}
): Promise<string> {
  const result = await mergeWavFiles(filePaths, config);
  return result.data;
}
