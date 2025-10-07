import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponseInit,
} from "@azure/functions";
import { debug } from "../common/debug";
import { synthesizeSpeechFromSsmlToFile } from "../services/create-podcast/create-audio";
import { writeSsml } from "../services/create-podcast/create-azure-speech-ssml";
import { PodcastScript } from "../services/write-podcast-script/models";

const createPodcastHandler: HttpHandler = async (
  request: HttpRequest
): Promise<HttpResponseInit> => {
  try {
    // let input: PodcastScriptInput = await request.json();
    const podcastScript: PodcastScript = {
      script: [
        {
          speaker: "alloy",
          conversation:
            "Welcome back to FutureCast! Today we're diving into how AI will reshape the next decade. Sage, when you hear 'AI and the future,' what's the first transformation that comes to mind?",
        },
        {
          speaker: "sage",
          conversation:
            "Acceleration. AI is compressing the time between idea and execution. Prototyping, analysis, iteration—what once took weeks can now take hours.",
        },
        {
          speaker: "alloy",
          conversation:
            "And that acceleration isn't just for engineers—creators, researchers, educators all get leverage. It's like giving everyone a small, specialized team in their pocket.",
        },
        {
          speaker: "sage",
          conversation:
            "Exactly. The creative renaissance is underrated. People who couldn't code or design are now orchestrating systems with natural language. The bottleneck shifts from technical skill to clarity of thought.",
        },
        {
          speaker: "alloy",
          conversation:
            "Let’s talk work. There's anxiety about job loss, but I see a re-bundling: tasks get automated, but roles evolve toward judgment, storytelling, and integration.",
        },
        {
          speaker: "sage",
          conversation:
            "Right. Repetitive pattern-recognition tasks shrink. High-context decision-making, ethics, and cross-domain synthesis grow. The winners learn to 'manage layers of abstraction'—humans guiding AI ensembles.",
        },
        {
          speaker: "alloy",
          conversation:
            "Healthcare is a huge frontier. Real-time triage, personalized treatment paths, drug discovery acceleration. Yet patient trust hinges on transparency—why did the model recommend that?",
        },
        {
          speaker: "sage",
          conversation:
            "So we'll see 'explainability interfaces' become a profession. Designers crafting narrative around probabilistic outputs: translating model rationale into human-aligned reasoning.",
        },
        {
          speaker: "alloy",
          conversation:
            "Education also flips. Adaptive tutors model not just what you know, but how you learn—pacing, modality, emotional signals. Classrooms become simulation hubs guided by AI mentors.",
        },
        {
          speaker: "sage",
          conversation:
            "And lifelong learning normalizes. Credentials fragment into skill graphs updated continuously by performance signals—projects, collaborations, validated micro-assessments.",
        },
        {
          speaker: "alloy",
          conversation:
            "Ethics and governance: Do you think regulation can keep pace without smothering innovation?",
        },
        {
          speaker: "sage",
          conversation:
            "Only if it's iterative and data-driven. Static rules won’t work. We'll need 'regulatory sandboxes' plus open model auditing protocols—crypto-style proofs for safety claims.",
        },
        {
          speaker: "alloy",
          conversation:
            "Personalization risk: the echo chamber effect intensifies if AI overfits to our current selves. We might need 'curated serendipity layers'—algorithms that inject productive novelty.",
        },
        {
          speaker: "sage",
          conversation:
            "Nice term. A healthy system optimizes not just for preference satisfaction but for capability expansion. That means measuring growth, not just engagement.",
        },
        {
          speaker: "alloy",
          conversation:
            "Let’s not forget infrastructure. Energy efficiency of inference at scale becomes a geopolitical factor. Model routing—deciding when to use a tiny model versus a giant one—will be standard.",
        },
        {
          speaker: "sage",
          conversation:
            "Yeah, 'intelligence orchestration' platforms emerge: dynamic composition of models, tools, retrieval, and human feedback loops—latency, cost, accuracy all traded in real time.",
        },
        {
          speaker: "alloy",
          conversation:
            "So if you're listening and wondering 'What should I do now?'—start building a personal AI stack: a workflow, a prompt library, an evaluation habit. Treat AI like compounding capital.",
        },
        {
          speaker: "sage",
          conversation:
            "And cultivate discernment. Don’t just accept outputs—stress-test them. Ask: What assumption is hidden here? What alternative framing could produce a better result?",
        },
        {
          speaker: "alloy",
          conversation:
            "Future optimism, tempered by responsibility: we can amplify human potential—or automate mediocrity. The difference comes down to intentional design.",
        },
        {
          speaker: "sage",
          conversation:
            "Agreed. The future with AI isn't predetermined; it's negotiated through daily choices in architecture, policy, and culture. Let's choose well.",
        },
        {
          speaker: "alloy",
          conversation:
            "That’s a wrap. If this sparked ideas, share your favorite insight and how you'll apply it this week. Until next time, stay curious.",
        },
      ],
    };

    const input = await writeSsml(podcastScript);
    console.log("Generated SSML:", input);
    const result = await synthesizeSpeechFromSsmlToFile(input);
    return {
      status: 200,
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err: any) {
    debug("Error in simpleSpeechHandler:", err);
    return { status: 500, body: String(err?.message || err) };
  }
};

app.http(createPodcastHandler.name, {
  methods: ["GET"],
  route: "hello",
  authLevel: "anonymous",
  handler: createPodcastHandler,
});
