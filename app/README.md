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

The home page now contains a Podcast Creation form built with shadcn-inspired UI components and validated by `zod`.

### Features

- Multi-select speakers (must choose exactly two of: Drift, Lumen, Thorn, Quill)
- Provide one (or more) of: URL, uploaded file, or custom instruction (at least one required)
- Choose tone (formal, informal, humorous, energetic)
- Choose style (conversational, interview, debate, educational)
- Set number of lines per speaker (1–10, default 3)
- Optional custom instruction text area
- Client converts uploaded file to a `Buffer` before validation

### Schema

The payload logged to the console conforms to this schema:

```ts
export const RequestBodySchema = z
  .object({
    url: z.string().url().optional(),
    data: z.instanceof(Buffer).optional(),
    style: StyleSchema.optional().default("conversational"),
    tone: ToneSchema.optional().default("formal"),
    instruction: z.string().optional(),
    linesPerSpeaker: z.number().min(1).max(10).default(3),
    speakers: z
      .array(VoiceNameSchema)
      .min(1)
      .max(2)
      .default(["Drift", "Lumen"]),
    scriptContent: z.string().default(""),
  })
  .refine((data) => data.url || data.data || data.instruction, {
    message: "Either 'url', 'data' or 'instruction' must be provided",
  });
```

Note: Although the schema allows a minimum of 1 speaker, the UI enforces selecting exactly 2 to satisfy the product requirement.

### Running

Install new deps then start dev server:

```bash
npm install
npm run dev
```

Open the console in your browser devtools and submit the form to inspect the validated payload.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
