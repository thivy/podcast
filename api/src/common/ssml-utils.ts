// Utility helpers to clean and validate / normalize SSML returned from the LLM
// Common failure modes we see:
// 1. Markdown code fences (```xml ... ```)
// 2. Missing <speak> root element
// 3. Missing required namespaces when using <mstts:express-as>
// 4. Leading BOM / stray characters before <speak>
// 5. Extra commentary before/after the SSML
// 6. AI sometimes escapes characters incorrectly or repeats closing tags
// We defensively normalize the SSML before sending it to Azure Speech.

const SPEAK_OPEN_REGEX = /^<speak[\s>]/i;

export interface SanitizeResult {
  ssml: string;
  modified: boolean;
  notes: string[];
}

export function sanitizeSsml(raw: string): SanitizeResult {
  const notes: string[] = [];
  let cleaned = raw || "";

  // Remove BOM
  if (cleaned.charCodeAt(0) === 0xfeff) {
    cleaned = cleaned.slice(1);
    notes.push("Removed BOM");
  }

  // Trim whitespace
  const beforeTrim = cleaned.length;
  cleaned = cleaned.trim();
  if (cleaned.length !== beforeTrim)
    notes.push("Trimmed surrounding whitespace");

  // Remove markdown fences
  if (/```/m.test(cleaned)) {
    cleaned = cleaned.replace(/```(?:ssml|xml)?/gi, "");
    notes.push("Stripped markdown code fences");
  }

  // Sometimes model wraps in <xml> ... ensure we only keep inner speak if present
  const speakMatch = cleaned.match(/<speak[\s\S]*?<\/speak>/i);
  if (speakMatch) {
    if (cleaned !== speakMatch[0]) {
      cleaned = speakMatch[0];
      notes.push("Extracted <speak>...</speak> segment from surrounding text");
    }
  }

  // If no <speak> root, wrap content
  if (!SPEAK_OPEN_REGEX.test(cleaned)) {
    notes.push("Wrapped content in <speak> root");
    cleaned = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">${cleaned}</speak>`;
  }

  // Ensure mstts namespace present if any mstts:* tags appear
  if (/mstts:/i.test(cleaned) && !/xmlns:mstts=/i.test(cleaned)) {
    cleaned = cleaned.replace(
      /<speak(\b[^>]*)>/i,
      (m, attrs) => `<speak${attrs} xmlns:mstts="http://www.w3.org/2001/mstts">`
    );
    notes.push("Injected missing xmlns:mstts namespace");
  }

  // Optional: basic sanity check for unclosed speak
  if (!/<\/speak>/i.test(cleaned)) {
    cleaned += "</speak>"; // fail-safe
    notes.push("Appended missing </speak> closing tag");
  }

  return { ssml: cleaned, modified: notes.length > 0, notes };
}
