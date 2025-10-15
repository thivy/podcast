"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useRef } from "react";
import { Buffer } from "buffer";

type VoiceName = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse" | "marin" | "cedar";
type Style = "conversational" | "interview" | "debate" | "educational" | "stand-up-comedy" | "storytelling" | "documentary";
type Tone = "formal" | "informal" | "humorous" | "energetic";

const VOICES: VoiceName[] = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"];
const STYLES: Style[] = ["conversational", "interview", "debate", "educational", "stand-up-comedy", "storytelling", "documentary"];
const TONES: Tone[] = ["formal", "informal", "humorous", "energetic"];

interface PodcastStatus {
  status: "idle" | "submitting" | "polling" | "completed" | "error";
  instanceId?: string;
  statusUrl?: string;
  message?: string;
  podcastUrl?: string;
  runtimeStatus?: string;
}

export function PodcastForm() {
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [style, setStyle] = useState<Style>("stand-up-comedy");
  const [tone, setTone] = useState<Tone>("humorous");
  const [linesPerSpeaker, setLinesPerSpeaker] = useState<number | undefined>();
  const [speakers, setSpeakers] = useState<VoiceName[]>(["alloy", "ash"]);
  const [podcastStatus, setPodcastStatus] = useState<PodcastStatus>({ status: "idle" });
  const [apiUrl, setApiUrl] = useState("http://localhost:7071");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSpeaker = (voice: VoiceName) => {
    if (speakers.includes(voice)) {
      setSpeakers(speakers.filter((s) => s !== voice));
    } else if (speakers.length < 2) {
      setSpeakers([...speakers, voice]);
    }
  };

  const pollStatus = async (statusUrl: string) => {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(statusUrl);
        const data = await response.json();

        if (data.runtimeStatus === "Completed") {
          setPodcastStatus({
            status: "completed",
            message: "Podcast generated successfully!",
            podcastUrl: data.output?.podcastUrl,
            runtimeStatus: data.runtimeStatus,
          });
          return;
        } else if (data.runtimeStatus === "Failed") {
          setPodcastStatus({
            status: "error",
            message: "Podcast generation failed",
            runtimeStatus: data.runtimeStatus,
          });
          return;
        }

        // Still processing
        setPodcastStatus({
          status: "polling",
          message: `Status: ${data.customStatus?.status || data.runtimeStatus}`,
          runtimeStatus: data.runtimeStatus,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.error("Error polling status:", error);
        setPodcastStatus({
          status: "error",
          message: `Error polling status: ${error}`,
        });
        return;
      }
    }

    setPodcastStatus({
      status: "error",
      message: "Max polling attempts reached",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url && !file && !instruction) {
      alert("Please provide either a URL, file, or instruction");
      return;
    }

    if (speakers.length < 1 || speakers.length > 2) {
      alert("Please select 1-2 speakers");
      return;
    }

    setPodcastStatus({ status: "submitting", message: "Submitting podcast creation request..." });

    try {
      const formData = new FormData();
      
      if (url) formData.append("url", url);
      if (file) formData.append("file", file);
      if (instruction) formData.append("instruction", instruction);
      formData.append("style", style);
      formData.append("tone", tone);
      if (linesPerSpeaker !== undefined) {
        formData.append("linesPerSpeaker", linesPerSpeaker.toString());
      }
      speakers.forEach((speaker) => formData.append("voice", speaker));

      const response = await fetch(`${apiUrl}/api/podcast`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setPodcastStatus({
        status: "polling",
        instanceId: result.id,
        statusUrl: result.statusQueryGetUri,
        message: "Podcast generation started. Polling for status...",
      });

      // Start polling
      if (result.statusQueryGetUri) {
        await pollStatus(result.statusQueryGetUri);
      }
    } catch (error) {
      console.error("Error creating podcast:", error);
      setPodcastStatus({
        status: "error",
        message: `Error: ${error}`,
      });
    }
  };

  const handlePlayAudio = () => {
    if (podcastStatus.podcastUrl) {
      const audioUrl = `${apiUrl}/api/podcast/${podcastStatus.podcastUrl}`;
      window.open(audioUrl, "_blank");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Create Podcast</h1>
        <p className="text-neutral-500">Generate a podcast from a URL, file, or custom instruction</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiUrl">API URL</Label>
          <Input
            id="apiUrl"
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:7071"
          />
          <p className="text-sm text-neutral-500">Configure the API endpoint URL</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold">Content Source (at least one required)</h2>
          
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <Input
              id="file"
              type="file"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instruction">Custom Instruction</Label>
            <Textarea
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe what you want the podcast to be about..."
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select value={style} onValueChange={(value) => setStyle(value as Style)}>
              <SelectTrigger id="style">
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
              <SelectTrigger id="tone">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linesPerSpeaker">Lines Per Speaker (optional)</Label>
            <Input
              id="linesPerSpeaker"
              type="number"
              value={linesPerSpeaker ?? ""}
              onChange={(e) => setLinesPerSpeaker(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Leave empty for default"
            />
          </div>

          <div className="space-y-2">
            <Label>Speakers (select 1-2)</Label>
            <div className="grid grid-cols-2 gap-3">
              {VOICES.map((voice) => (
                <div key={voice} className="flex items-center space-x-2">
                  <Checkbox
                    id={voice}
                    checked={speakers.includes(voice)}
                    onChange={() => toggleSpeaker(voice)}
                    disabled={!speakers.includes(voice) && speakers.length >= 2}
                  />
                  <label
                    htmlFor={voice}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {voice}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-neutral-500">
              Selected: {speakers.join(", ") || "None"}
            </p>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={podcastStatus.status === "submitting" || podcastStatus.status === "polling"}
        >
          {podcastStatus.status === "submitting" || podcastStatus.status === "polling" 
            ? "Processing..." 
            : "Create Podcast"}
        </Button>
      </form>

      {podcastStatus.status !== "idle" && (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Status</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">State:</span> {podcastStatus.status}
            </p>
            {podcastStatus.message && (
              <p className="text-sm">
                <span className="font-medium">Message:</span> {podcastStatus.message}
              </p>
            )}
            {podcastStatus.runtimeStatus && (
              <p className="text-sm">
                <span className="font-medium">Runtime Status:</span> {podcastStatus.runtimeStatus}
              </p>
            )}
            {podcastStatus.instanceId && (
              <p className="text-sm">
                <span className="font-medium">Instance ID:</span> {podcastStatus.instanceId}
              </p>
            )}
          </div>

          {podcastStatus.status === "completed" && podcastStatus.podcastUrl && (
            <div className="space-y-2 pt-2">
              <Button onClick={handlePlayAudio} className="w-full">
                Play/Download Audio
              </Button>
              <audio controls className="w-full">
                <source src={`${apiUrl}/api/podcast/${podcastStatus.podcastUrl}`} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
