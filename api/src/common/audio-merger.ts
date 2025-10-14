type DecodedWav = {
  samples: Float32Array;
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
};

export class PureNodeAudioMerger {
  private readonly fallbackSampleRate = 24000;

  merge(base64Segments: string[], crossfadeSeconds = 0.1): string {
    if (!base64Segments.length) {
      throw new Error("No audio segments supplied to merge");
    }

    const decoded = base64Segments.map((b64) =>
      this.decodeWAV(Buffer.from(b64, "base64"))
    );

    const targetSampleRate = decoded[0].sampleRate || this.fallbackSampleRate;
    decoded.forEach((segment, idx) => {
      if (
        segment.sampleRate !== targetSampleRate ||
        segment.numChannels !== decoded[0].numChannels ||
        segment.bitsPerSample !== decoded[0].bitsPerSample
      ) {
        throw new Error(
          `Segment ${idx} format mismatch: sampleRate=${segment.sampleRate}, channels=${segment.numChannels}, bits=${segment.bitsPerSample}`
        );
      }
    });

    const merged = this.mergeFloatArrays(
      decoded.map((d) => d.samples),
      crossfadeSeconds,
      targetSampleRate
    );

    const wavBuffer = this.encodeWAV(merged, targetSampleRate);
    return wavBuffer.toString("base64");
  }

  private decodeWAV(buffer: Buffer): DecodedWav {
    if (buffer.length < 44) {
      throw new Error("WAV buffer too small");
    }
    if (buffer.toString("ascii", 0, 4) !== "RIFF") {
      throw new Error("Invalid WAV: missing RIFF header");
    }
    if (buffer.toString("ascii", 8, 12) !== "WAVE") {
      throw new Error("Invalid WAV: missing WAVE header");
    }

    let offset = 12;
    let fmt: {
      audioFormat: number;
      numChannels: number;
      sampleRate: number;
      bitsPerSample: number;
      blockAlign: number;
      byteRate: number;
    } | null = null;
    let dataOffset = -1;
    let dataLength = 0;

    while (offset + 8 <= buffer.length) {
      const chunkId = buffer.toString("ascii", offset, offset + 4);
      const chunkSize = buffer.readUInt32LE(offset + 4);
      const chunkDataStart = offset + 8;
      const paddedSize = chunkSize + (chunkSize & 1);

      if (chunkId === "fmt ") {
        if (chunkSize < 16 || chunkDataStart + chunkSize > buffer.length) {
          throw new Error("Invalid WAV: malformed fmt chunk");
        }
        fmt = {
          audioFormat: buffer.readUInt16LE(chunkDataStart),
          numChannels: buffer.readUInt16LE(chunkDataStart + 2),
          sampleRate: buffer.readUInt32LE(chunkDataStart + 4),
          byteRate: buffer.readUInt32LE(chunkDataStart + 8),
          blockAlign: buffer.readUInt16LE(chunkDataStart + 12),
          bitsPerSample: buffer.readUInt16LE(chunkDataStart + 14),
        };
      } else if (chunkId === "data") {
        const available = Math.max(0, buffer.length - chunkDataStart);
        const effectiveSize =
          chunkSize === 0xffffffff || chunkDataStart + chunkSize > buffer.length
            ? available
            : Math.min(chunkSize, available);
        dataOffset = chunkDataStart;
        dataLength = effectiveSize;
        break;
      }

      offset = chunkDataStart + paddedSize;
    }

    if (!fmt || dataOffset < 0 || dataLength <= 0) {
      throw new Error("Invalid WAV: missing fmt or data chunk");
    }
    if (fmt.audioFormat !== 1) {
      throw new Error(`Unsupported WAV encoding (format ${fmt.audioFormat})`);
    }
    if (fmt.bitsPerSample !== 16) {
      throw new Error(
        `Unsupported bit depth ${fmt.bitsPerSample}; expected 16-bit PCM`
      );
    }

    const bytesPerSample = fmt.bitsPerSample / 8;
    const frameSize = bytesPerSample * fmt.numChannels;
    const frameCount = Math.floor(dataLength / frameSize);
    const samples = new Float32Array(frameCount);

    for (let i = 0; i < frameCount; i++) {
      const frameOffset = dataOffset + i * frameSize;
      let sampleValue = 0;
      for (let ch = 0; ch < fmt.numChannels; ch++) {
        sampleValue += buffer.readInt16LE(frameOffset + ch * bytesPerSample);
      }
      samples[i] = sampleValue / fmt.numChannels / 32768;
    }

    return {
      samples,
      sampleRate: fmt.sampleRate,
      numChannels: fmt.numChannels,
      bitsPerSample: fmt.bitsPerSample,
    };
  }

  private mergeFloatArrays(
    segments: Float32Array[],
    crossfadeSeconds: number,
    sampleRate: number
  ): Float32Array {
    if (segments.length === 0) {
      return new Float32Array();
    }

    const baseCrossfade = Math.max(
      0,
      Math.floor(crossfadeSeconds * sampleRate)
    );
    let totalLength = segments[0].length;
    for (let i = 1; i < segments.length; i++) {
      const overlap = Math.min(
        baseCrossfade,
        segments[i - 1].length,
        segments[i].length
      );
      totalLength += segments[i].length - overlap;
    }

    const output = new Float32Array(totalLength);
    output.set(segments[0], 0);
    let writeOffset = segments[0].length;

    for (let i = 1; i < segments.length; i++) {
      const current = segments[i];
      const overlap = Math.min(
        baseCrossfade,
        segments[i - 1].length,
        current.length
      );
      const fadeStart = writeOffset - overlap;

      for (let j = 0; j < overlap; j++) {
        const fadeOut = 1 - j / overlap;
        const fadeIn = j / overlap;
        output[fadeStart + j] =
          output[fadeStart + j] * fadeOut + current[j] * fadeIn;
      }

      const remainder = current.subarray(overlap);
      output.set(remainder, writeOffset);
      writeOffset += current.length - overlap;
    }

    return output;
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Buffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * blockAlign;
    const buffer = Buffer.allocUnsafe(44 + dataSize);

    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16); // PCM header length
    buffer.writeUInt16LE(1, 20); // PCM format
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const clamped = Math.max(-1, Math.min(1, samples[i]));
      const intSample = Math.round(clamped * 32767);
      buffer.writeInt16LE(intSample, offset);
      offset += bytesPerSample;
    }

    return buffer;
  }
}
