This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

## Podcast Creation Form

The home page contains a Podcast Creation form built with shadcn-inspired UI components and validated by `zod`.

### Features

- **Configurable API URL** - Set the backend API endpoint URL (defaults to http://localhost:7071)
- **Multiple content sources** - Provide URL, upload file, or use custom instruction (at least one required)
- **Voice selection** - Choose 1-2 speakers from 10 available voices (alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar)
- **Style options** - Select from 7 podcast styles: conversational, interview, debate, educational, stand-up-comedy, storytelling, documentary
- **Tone options** - Choose from 4 tones: formal, informal, humorous, energetic
- **Optional parameters** - Set number of lines per speaker
- **Real-time status updates** - Polls the API for podcast generation status
- **Audio playback** - Plays completed podcast directly in the browser

### Schema

The payload conforms to this schema:

```ts
export const RequestBodySchema = z
  .object({
    url: z.string().url().optional(),
    data: z.instanceof(Buffer).optional(),
    style: StyleSchema.optional().default("stand-up-comedy"),
    tone: ToneSchema.optional().default("humorous"),
    instruction: z.string().optional(),
    linesPerSpeaker: z.number().optional(),
    speakers: z.array(VoiceNameSchema).min(1).max(2).default(["alloy", "ash"]),
    scriptContent: z.string().default(""),
  })
  .refine((data) => data.url || data.data || data.instruction, {
    message: "Either 'url', 'data' or 'instruction' must be provided",
  });
```

### API Integration

The form integrates with the Azure Functions backend:

1. **POST /api/podcast** - Submits podcast creation request with multipart form data
2. **Polling** - Uses the `statusQueryGetUri` from the response to poll for completion
3. **GET /api/podcast/{name}** - Retrieves the generated audio file once completed

### Running

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Optionally, configure the API URL by creating a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:7071
```

Open [http://localhost:3000](http://localhost:3000) to see the form.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
