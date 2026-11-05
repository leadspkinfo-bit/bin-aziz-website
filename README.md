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

## Umrah quotation calculator

1. Run `supabase/migrations/011_quotation_system.sql` in the Supabase SQL Editor.
2. Load rates: `/admin/scan` (AI sync from pictures), the `/admin/rates/*` pages, CSV import, or `npm run seed -- export.json`.
3. Switch on "Umrah calculator" in the admin website controls. `/calculator` is a 404 until then.

Environment variables (`.env.local`, and the same in Vercel → Project → Settings → Environment Variables):

| Variable | Where it comes from | Needed for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API | everything |
| `GEMINI_API_KEY` | Google AI Studio → Get API key | `/admin/scan` |
| `GEMINI_MODELS` (optional) | comma list, default `gemini-3.6-flash,gemini-3.5-flash` | `/admin/scan` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret) | `npm run seed` on this machine only. Server only — never give it a `NEXT_PUBLIC_` name |

Admins sign in with the existing Supabase admin account (`/admin/login`). `npm test` runs the calculation tests; `npm run test-gemini` and `npm run list-models` check the Gemini key.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
