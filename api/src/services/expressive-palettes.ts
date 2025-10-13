export type ExpressivePalette = {
  name: string; // Name of the palette
  description: string; // Description of the palette
  elements: string; // Comma-separated list of elements
  delivery: string; // Description of the delivery style
  voice: string; // Description of the voice
  tone: string; // Description of the tone
  pronunciation: string; // Description of the pronunciation
};

export const podcastEmotionsMarkdownTable = () => {
  return [
    "| Name | Delivery | Voice | Tone | Pronunciation |",
    "| ---- | -------- | ----- | ---- | ------------- |",
    ...Object.values(ExpressivePalettes).map(
      (p) =>
        `| ${p.name} | ${p.delivery.replace(/\|/g, "\\|")} | ${p.voice.replace(
          /\|/g,
          "\\|"
        )} | ${p.tone.replace(/\|/g, "\\|")} | ${p.pronunciation.replace(
          /\|/g,
          "\\|"
        )} |`
    ),
  ].join("\n");
};

// helper method to get the expressive palette based on name
export const getExpressivePaletteByName = (name: string): string => {
  const palette = ExpressivePalettes[name];

  if (!palette) {
    return null;
  }

  return `
  Delivery: ${palette.delivery}
  Voice: ${palette.voice}
  Tone: ${palette.tone}
  Pronunciation: ${palette.pronunciation}
  `;
};

export const ExpressivePalettes: Record<string, ExpressivePalette> = {
  Enthusiasm: {
    name: "Enthusiasm",
    description:
      "A voice that bursts forward with lifted pitch and sparkling rhythm, making every word feel like an invitation to join the excitement.",
    elements: "lifted pitch sparkle, energetic rhythm, inviting emphasis",
    delivery:
      "Buoyant forward-leaning cadence with lively bounce and quick, optimistic emphasis on key nouns and verbs.",
    voice:
      "Bright, animated, slightly elevated in pitch with a clear open resonant top end.",
    tone: "Inviting, effervescent, motivating.",
    pronunciation:
      "Crisp consonants, lightly elongated stressed vowels, upward inflection on engaging phrases.",
  },
  Curiosity: {
    name: "Curiosity",
    description:
      "A tone that leans forward with rising inflections and gentle pauses, as if the speaker is discovering the answer alongside you.",
    elements: "rising inflections, gentle pauses, exploratory pacing",
    delivery:
      "Measured exploratory pacing with soft suspenseful pauses before key reveals.",
    voice: "Mid‑light timbre with inquisitive lift and gentle breath support.",
    tone: "Inquisitive, open, exploratory.",
    pronunciation:
      "Lightly softened consonants, lifted sentence‑final rises, delicate shaping of question words.",
  },
  Reflective: {
    name: "Reflective",
    description:
      "A slower, grounded delivery with softened edges and downward cadences, carrying the weight of thought and introspection.",
    elements: "slower pacing, softened cadence, downward contours",
    delivery:
      "Unhurried cadence with gentle downward arcs and contemplative spacing between phrases.",
    voice:
      "Warm mid‑low resonance with mellow airflow and controlled softness.",
    tone: "Thoughtful, calm, introspective.",
    pronunciation:
      "Rounded vowels, softened plosives, tapering word endings for quiet closure.",
  },
  Concern: {
    name: "Concern",
    description:
      "A warm, steady voice with softened consonants and careful pacing, wrapping the listener in protective empathy.",
    elements: "warm tone, careful pacing, softened consonants",
    delivery:
      "Careful, steady pacing with reassuring emphasis on comfort words and gentle micro‑pauses.",
    voice: "Low‑medium warmth with cushioned edges and steady breath bed.",
    tone: "Reassuring, empathetic, protective.",
    pronunciation:
      "Softened consonant onsets, lightly elongated soothing vowels, restrained sibilance.",
  },
  Excitement: {
    name: "Excitement",
    description:
      "Rapid, high‑energy bursts with sharp emphasis and quick breaths, like someone who can barely contain the news.",
    elements: "rapid bursts, high energy emphasis, quick breaths",
    delivery:
      "Burst‑driven rhythm with quick accelerations, staccato emphasis, and minimal hesitation.",
    voice:
      "High‑energy bright timbre with elevated pitch peaks and forward resonance.",
    tone: "Electrified, eager, dynamic.",
    pronunciation:
      "Sharp consonant attacks, clipped unstressed syllables, punchy stressed vowels.",
  },
  Wonder: {
    name: "Wonder",
    description:
      "Breath‑tinted phrases with wide pitch arcs and suspended pauses, as if marveling at something too beautiful for words.",
    elements: "breath‑tinted phrases, wide pitch arcs, suspended pauses",
    delivery:
      "Air‑laced elongated arcs with floating pauses that suspend before emotional words.",
    voice:
      "Light, breath‑tinted with airy shimmer and expanded head resonance.",
    tone: "Amazed, reverent, expansive.",
    pronunciation:
      "Gentle onset vowels, softened consonants, extended open vowels on awe terms.",
  },
  Whisper: {
    name: "Whisper",
    description:
      "A hushed, airy delivery with close‑mic intimacy, pulling the listener into a shared secret.",
    elements: "hushed delivery, airy texture, close‑mic intimacy",
    delivery:
      "Intimate near‑field hush with compressed dynamics and careful breath shaping.",
    voice: "Soft, airy, low amplitude with intimate proximity effect.",
    tone: "Confidential, delicate, secretive.",
    pronunciation:
      "De‑emphasized plosives, lightly aspirated fricatives, vowel softness over precision.",
  },
  Smile: {
    name: "Smile",
    description:
      "Rounded vowels and lilting cadence that make the happiness behind the words unmistakably audible.",
    elements: "rounded vowels, lilting cadence, bright warmth",
    delivery:
      "Gently bouncing cadence with melodic lift on mid‑phrase positives.",
    voice: "Warm upper‑mid resonance with subtle cheek‑lift coloration.",
    tone: "Cheerful, friendly, radiant.",
    pronunciation:
      "Rounded forward vowels, softened t/d, slight upward lilt on phrase endings.",
  },
  Relief: {
    name: "Relief",
    description:
      "A softened exhale woven into speech, with loosened pacing and a gentle drop in tone that signals release.",
    elements: "soft exhale, loosened pacing, gentle tonal drop",
    delivery:
      "Relaxed pacing with exhaled openings and descending final contours.",
    voice: "Breathy warm mid‑low register easing tension gradually.",
    tone: "Released, soothing, unwinding.",
    pronunciation:
      "Air‑released consonants, lightly prolonged sigh‑like vowels, softened endings.",
  },
  Sincere: {
    name: "Sincere",
    description:
      "A steady, unembellished voice with even pacing and natural resonance, carrying authenticity without performance.",
    elements: "steady tone, even pacing, natural resonance",
    delivery:
      "Even measured cadence with minimal ornamentation and plain emphasis.",
    voice:
      "Natural centered resonance, balanced clarity without theatrical color.",
    tone: "Honest, grounded, earnest.",
    pronunciation:
      "Neutral articulation, clean consonants, natural vowel length without exaggeration.",
  },
  Triumphant: {
    name: "Triumphant",
    description:
      "A soaring, resonant voice with lifted pitch and celebratory rhythm, carrying the victorious energy of a hard‑won achievement.",
    elements: "lifted pitch, resonant projection, celebratory rhythm",
    delivery:
      "Ascending rhythmic build with strategic holds before emphatic release peaks.",
    voice:
      "Full resonant chest‑head blend with ringing projection and lifted upper formants.",
    tone: "Victorious, elevating, exuberant.",
    pronunciation:
      "Clear emphatic consonants, bright open vowels, elongated triumph keywords.",
  },
  Urgent: {
    name: "Urgent",
    description:
      "Clipped, breathless delivery with rapid pacing and sharp emphasis, like breaking news that can’t wait another second.",
    elements: "clipped delivery, rapid pacing, sharp emphasis",
    delivery:
      "Accelerated pulse with short phrase bursts and minimal recovery gaps.",
    voice:
      "Tense forward‑driven timbre with compressed dynamics and alert sharpness.",
    tone: "Pressing, immediate, heightened.",
    pronunciation:
      "Clipped enunciation, percussive plosives, shortened unstressed syllables.",
  },
  Defiant: {
    name: "Defiant",
    description:
      "A bold, steady tone with firm pacing and rising inflections, projecting unshaken confidence against challenge.",
    elements: "bold tone, firm pacing, rising inflections",
    delivery:
      "Firm anchored pacing with assertive line starts and controlled upward challenge lifts.",
    voice: "Taut resonant core with reinforced lower mids and confident edge.",
    tone: "Unyielding, resolute, challenging.",
    pronunciation:
      "Hard consonant boundaries, deliberate stress, rising inflection on stance phrases.",
  },
  Passionate: {
    name: "Passionate",
    description:
      "Fiery, persuasive cadence with dynamic pitch swings and emotional weight, as if every word is fueled by conviction.",
    elements: "dynamic pitch swings, persuasive cadence, emotional weight",
    delivery:
      "Surging crescendos with swelling intensity, ebbing for emotional contrast.",
    voice:
      "Rich resonant spectrum with heated overtones and urgent breath drive.",
    tone: "Impassioned, fervent, persuasive.",
    pronunciation:
      "Full vowel expansion, emphatic consonant clarity, widened pitch intervals.",
  },
  Overjoyed: {
    name: "Overjoyed",
    description:
      "Bubbling, laughter‑tinged voice with quick bursts of energy, overflowing with happiness that can’t be contained.",
    elements: "laughter‑tinged tone, quick energy bursts, bubbling brightness",
    delivery:
      "Effervescent staccato bursts interwoven with light breathy laugh releases.",
    voice: "High bright sparkling timbre with buoyant overtones.",
    tone: "Ecstatic, effusive, sparkling.",
    pronunciation:
      "Short playful vowels, crisp consonants, upward flips in excited words.",
  },
  Shocked: {
    name: "Shocked",
    description:
      "Sudden, uneven rhythm with gasps and widened pitch, as though disbelief has just stolen the breath away.",
    elements: "sudden rhythm breaks, widened pitch, breath interruptions",
    delivery:
      "Interrupted rhythm with abrupt starts/stops and widened exclamatory spreads.",
    voice: "Breath‑caught brightened timbre with sudden pitch spikes.",
    tone: "Startled, disbelieving, jolted.",
    pronunciation:
      "Sharp onsets, widened stressed vowels, aspirated gasps between clauses.",
  },
  Tense: {
    name: "Tense",
    description:
      "Tight, restrained delivery with clipped pauses and compressed tone, holding suspense at the edge of release.",
    elements: "tight delivery, clipped pauses, compressed tone",
    delivery:
      "Restrained compressed phrasing with held breath micro‑pauses at tension points.",
    voice:
      "Constricted mid register with reduced warmth and controlled pressure.",
    tone: "Strained, suspenseful, contained.",
    pronunciation:
      "Tight articulation, shortened vowels, clenched consonant endings.",
  },
  Commanding: {
    name: "Commanding",
    description:
      "A deep, resonant voice with deliberate pacing and strong emphasis, radiating authority and control.",
    elements: "deep resonance, deliberate pacing, strong emphasis",
    delivery:
      "Measured authoritative stride with weighty stresses on directive verbs.",
    voice:
      "Full low resonant projection with firm tonal core and controlled breath.",
    tone: "Authoritative, assertive, resolute.",
    pronunciation:
      "Clear decisive consonants, grounded vowel centers, sustained imperative words.",
  },
  Exasperated: {
    name: "Exasperated",
    description:
      "Frustrated tone with drawn‑out sighs, uneven pacing, and sharp edges that reveal worn‑thin patience.",
    elements: "drawn‑out sighs, uneven pacing, sharp edges",
    delivery:
      "Uneven cadence with elongated sigh prefaces and clipped irritated closures.",
    voice:
      "Tired mid register with frayed edges and intermittent breath release.",
    tone: "Frustrated, weary, irritated.",
    pronunciation:
      "Dragged vowels on complaint words, sharpened consonants at emotional peaks.",
  },
  Exhilarated: {
    name: "Exhilarated",
    description:
      "Fast, adrenaline‑fueled rhythm with soaring pitch arcs and breathless energy, like riding the crest of a thrill.",
    elements: "fast rhythm, soaring pitch arcs, breathless energy",
    delivery:
      "Rushing momentum with elongation at peak pitch sweeps then rapid descent.",
    voice: "High energetic spectrum with breath‑pushed intensity and sparkle.",
    tone: "Thrilled, charged, ecstatic.",
    pronunciation:
      "Elevated pitch on key vowels, swift consonant linking, occasional breathy breaks.",
  },
  Tender: {
    name: "Tender",
    description:
      "A soft, nurturing tone with gentle pacing and affectionate warmth, as if cradling the listener in care.",
    elements: "soft tone, gentle pacing, affectionate warmth",
    delivery: "Cradling gentle pace with smooth legato phrase connections.",
    voice:
      "Soft warm intimate timbre with rounded resonance and low breath noise.",
    tone: "Affectionate, gentle, nurturing.",
    pronunciation:
      "Mildly elongated soothing vowels, softened consonant strikes, gentle sibilance.",
  },
  Nostalgic: {
    name: "Nostalgic",
    description:
      "A wistful, bittersweet delivery with softened edges and lingering pauses, like remembering something precious yet gone.",
    elements: "wistful tone, softened edges, lingering pauses",
    delivery:
      "Lingering phrasing with tapering endings and reflective mid‑sentence pauses.",
    voice: "Soft mellow timbre tinged with subtle airy wistfulness.",
    tone: "Bittersweet, wistful, gentle.",
    pronunciation:
      "Soft consonant decay, elongated memory keywords, gentle downward inflections.",
  },
  Confessional: {
    name: "Confessional",
    description:
      "A hushed, vulnerable voice with lowered volume and intimate pacing, as though revealing a guarded truth.",
    elements: "hushed voice, intimate pacing, lowered volume",
    delivery:
      "Quiet restrained pacing with breath‑laden hesitations before revealing words.",
    voice: "Low amplitude intimate timbre with vulnerable slight tremor.",
    tone: "Vulnerable, hesitant, earnest.",
    pronunciation:
      "Soft onset vowels, reduced plosive force, intimate lowered inflection.",
  },
  Playful: {
    name: "Playful",
    description:
      "A teasing, mischievous tone with quick rises in pitch and lighthearted rhythm, inviting the listener into the fun.",
    elements: "teasing tone, quick rises, lighthearted rhythm",
    delivery:
      "Bouncy syncopated rhythm with cheeky upward flips and teasing mini‑pauses.",
    voice: "Light agile timbre with elastic pitch agility.",
    tone: "Mischievous, lively, teasing.",
    pronunciation:
      "Crisp playful consonants, clipped unstressed syllables, upward scoops.",
  },
  Skeptical: {
    name: "Skeptical",
    description:
      "A doubtful, questioning delivery with tightened phrasing and a subtle 'raised eyebrow' in the voice.",
    elements: "doubtful inflection, tightened phrasing, subtle irony",
    delivery:
      "Compressed phrasing with dry pauses and restrained upward questioning lifts.",
    voice: "Dry mid register with narrowed resonance and slight edge.",
    tone: "Questioning, doubtful, wary.",
    pronunciation:
      "Tight clipped consonants, shortened vowels, slight ironic intonation shifts.",
  },
  Melancholy: {
    name: "Melancholy",
    description:
      "A quiet, weighted tone with slowed pacing and downward inflections, carrying the heaviness of sadness unspoken.",
    elements: "quiet tone, slowed pacing, downward inflections",
    delivery:
      "Slow weighted descent with elongated internal pauses and gentle downward cadences.",
    voice: "Muted low‑mid resonance with subdued brightness and soft airflow.",
    tone: "Somber, subdued, heavy.",
    pronunciation:
      "Lowered pitch centers, softened consonant edges, lengthened mournful vowels.",
  },
  Hopeful: {
    name: "Hopeful",
    description:
      "A gentle, upward‑leaning voice with softened brightness and forward‑looking cadence, as if reaching toward possibility.",
    elements: "upward leaning tone, softened brightness, forward cadence",
    delivery:
      "Forward‑tilting cadence with gradual upward contour and optimistic pacing.",
    voice: "Soft brightened timbre with light head resonance shimmer.",
    tone: "Optimistic, uplifting, anticipatory.",
    pronunciation:
      "Clear lightly lifted vowels, softened consonants, rising phrase conclusions.",
  },
  Yearning: {
    name: "Yearning",
    description:
      "A stretched, longing delivery with breath‑laden pauses and reaching intonation, conveying desire for what is absent.",
    elements: "stretched delivery, breath‑laden pauses, reaching intonation",
    delivery:
      "Extended reaching phrases with breath suspensions before emotionally charged words.",
    voice: "Air‑infused resonant timbre with gently strained lift.",
    tone: "Longing, aching, desirous.",
    pronunciation:
      "Elongated open vowels, softened consonants, upward glide on longing terms.",
  },
  Comforting: {
    name: "Comforting",
    description:
      "A soothing, steady tone with warm resonance and reassuring rhythm, wrapping the listener in safety and calm.",
    elements: "soothing tone, warm resonance, reassuring rhythm",
    delivery:
      "Steady rhythmic reassurance with smooth even pacing and gentle emphasis.",
    voice: "Warm enveloping resonance with soft harmonic bloom.",
    tone: "Calming, reassuring, steady.",
    pronunciation:
      "Rounded sustained vowels, softened plosives, gentle consonant transitions.",
  },
  Introspective: {
    name: "Introspective",
    description:
      "An inward, searching voice with thoughtful pauses and softened cadence, as if turning questions over within.",
    elements: "inward focus, thoughtful pauses, softened cadence",
    delivery:
      "Inward‑turned pacing with reflective pauses and softened decaying phrase ends.",
    voice:
      "Soft interior resonance with muted projection and contemplative breath.",
    tone: "Pensive, searching, gentle.",
    pronunciation:
      "Muted consonant strikes, lengthened reflective vowels, trailing endings.",
  },
  Epic: {
    name: "Epic",
    description:
      "A grand, cinematic delivery with resonant projection and sweeping cadence, making every phrase feel larger than life.",
    elements: "grand projection, sweeping cadence, resonant weight",
    delivery:
      "Broad sweeping arcs with deliberate build‑and‑release and heroic spacing.",
    voice:
      "Full spectrum resonant projection with extended sustain and harmonic richness.",
    tone: "Grand, majestic, monumental.",
    pronunciation:
      "Clear sculpted consonants, expansive vowels, dignified pacing on key nouns.",
  },
  Mysterious: {
    name: "Mysterious",
    description:
      "A hushed, shadowy tone with softened consonants and lingering pauses, hinting at secrets just out of reach.",
    elements: "hushed tone, softened consonants, lingering pauses",
    delivery:
      "Shadowed restrained pacing with deliberate hush and extended suspense pauses.",
    voice: "Soft darkened timbre with veiled resonance and intimate proximity.",
    tone: "Enigmatic, secretive, subtle.",
    pronunciation:
      "Soft consonant articulation, narrowed vowel focus, tapered phrase endings.",
  },
  Suspenseful: {
    name: "Suspenseful",
    description:
      "A deliberate, measured voice with tension‑filled pauses and restrained pacing, keeping the listener on edge.",
    elements: "measured pacing, tension pauses, restrained delivery",
    delivery:
      "Measured incremental build with tension holds before resolution words.",
    voice:
      "Controlled mid register with tightened resonance and contained energy.",
    tone: "Tense, anticipatory, restrained.",
    pronunciation:
      "Precise clipped consonants, delayed vowel release, controlled downward resets.",
  },
  Inspirational: {
    name: "Inspirational",
    description:
      "An uplifting, motivational cadence with rising pitch arcs and rallying rhythm, urging the listener toward action.",
    elements: "uplifting cadence, rising pitch arcs, rallying rhythm",
    delivery:
      "Rising motivational cadence with rhythmic rally points and energizing lifts.",
    voice:
      "Bright open projection with encouraging resonance and balanced warmth.",
    tone: "Uplifting, motivating, aspirational.",
    pronunciation:
      "Clear energetic consonants, elongated inspirational keywords, upward climbs.",
  },
  Philosophical: {
    name: "Philosophical",
    description:
      "An abstract, pondering delivery with layered pauses and thoughtful resonance, as if weighing ideas in real time.",
    elements: "pondering delivery, layered pauses, thoughtful resonance",
    delivery:
      "Layered pacing with reflective segmentation and gentle idea‑sifting pauses.",
    voice:
      "Moderate resonant timbre with contemplative tonal neutrality and subtle depth.",
    tone: "Pondering, reflective, neutral.",
    pronunciation:
      "Even measured articulation, lightly elongated conceptual terms, softened transitions.",
  },
  Ironic: {
    name: "Ironic",
    description:
      "A dry, knowing tone with subtle inflections and tongue‑in‑cheek timing, signaling humor beneath the surface.",
    elements: "dry tone, subtle inflections, tongue‑in‑cheek timing",
    delivery:
      "Dry restrained pacing with delayed punch inflections and understated emphasis.",
    voice:
      "Controlled mid register with faint sardonic edge and minimal breath color.",
    tone: "Wry, subtle, sly.",
    pronunciation:
      "Under‑enunciated unstressed syllables, slight ironic rises, clipped endings.",
  },
  Deadpan: {
    name: "Deadpan",
    description:
      "A flat, unembellished delivery with steady pacing and minimal inflection, letting understatement carry the humor.",
    elements: "flat delivery, steady pacing, minimal inflection",
    delivery:
      "Flat linear pacing with uniform emphasis and minimal melodic variance.",
    voice: "Neutral tonality with reduced harmonic color and steady airflow.",
    tone: "Dry, understated, neutral.",
    pronunciation:
      "Even clipped syllables, no elongation, consistent monotone placements.",
  },
  Whimsical: {
    name: "Whimsical",
    description:
      "A fairy‑tale, sing‑song cadence with playful rises and imaginative rhythm, evoking childlike wonder.",
    elements: "sing‑song cadence, playful rises, imaginative rhythm",
    delivery:
      "Sing‑song lilting cadence with playful rhythmic skips and airy flourish.",
    voice: "Light imaginative timbre with bright upper harmonic sparkle.",
    tone: "Playful, fanciful, lighthearted.",
    pronunciation:
      "Rounded animated vowels, delicate consonants, melodic inflection shifts.",
  },
  CosmicAwe: {
    name: "CosmicAwe",
    description:
      "A reverent, expansive voice with slowed pacing and vast resonance, as if staring into infinity itself.",
    elements: "reverent tone, slowed pacing, vast resonance",
    delivery:
      "Broad slow expanses with deep inhaled stillness before grand conceptual words.",
    voice: "Expansive resonant timbre with spacious reverb‑like depth.",
    tone: "Reverent, vast, transcendent.",
    pronunciation:
      "Elongated open vowels, softened consonants, widened pitch span on awe terms.",
  },
  Satirical: {
    name: "Satirical",
    description:
      "An exaggerated, mocking tone with sharp emphasis and parody‑like rhythm, amplifying humor through caricature.",
    elements: "exaggerated tone, sharp emphasis, parody rhythm",
    delivery:
      "Caricatured rhythmic exaggeration with punchy dramatic stress and ironic pacing shifts.",
    voice:
      "Flexible theatrical timbre with elastic dynamic swings and pointed coloration.",
    tone: "Mocking, exaggerated, witty.",
    pronunciation:
      "Sharply articulated consonants, elongated parody vowels, emphatic satirical stress.",
  },
};
