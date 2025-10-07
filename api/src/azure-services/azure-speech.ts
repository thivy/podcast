import * as speechsdk from "microsoft-cognitiveservices-speech-sdk";

type SynthResult = {
  buffer: Buffer;
};

const createSpeechConfig = () => {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;
  if (!speechKey || !speechRegion) {
    throw new Error("Missing AZURE_SPEECH_KEY or AZURE_SPEECH_REGION env vars");
  }
  const speechConfig = speechsdk.SpeechConfig.fromSubscription(
    speechKey,
    speechRegion
  );
  speechConfig.speechSynthesisOutputFormat =
    speechsdk.SpeechSynthesisOutputFormat.Riff48Khz16BitMonoPcm;
  return speechConfig;
};

// Synthesize SSML into an in-memory Buffer and return it with a suggested filename
export const synthesizeSpeechFromSsml = (
  ssml: string
): Promise<SynthResult> => {
  return new Promise<SynthResult>((resolve, reject) => {
    const speechConfig = createSpeechConfig();
    const synthesizer = new speechsdk.SpeechSynthesizer(speechConfig);

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        try {
          if (
            result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted
          ) {
            // result.audioData is an ArrayBuffer (Uint8Array-like) in the SDK
            const audioData = result.audioData as ArrayBuffer | Uint8Array;
            let buffer: Buffer;
            if (audioData instanceof ArrayBuffer) {
              buffer = Buffer.from(new Uint8Array(audioData));
            } else {
              buffer = Buffer.from(audioData as Uint8Array);
            }
            resolve({ buffer });
          } else {
            reject(
              new Error("Speech synthesis failed: " + result.errorDetails)
            );
          }
        } catch (err) {
          reject(err);
        } finally {
          try {
            synthesizer.close();
          } catch {}
        }
      },
      (error) => {
        try {
          synthesizer.close();
        } catch {}
        reject(error);
      }
    );
  });
};
