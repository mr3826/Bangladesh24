# Bangladesh24 MVP

Bangladesh24 is a local-first pipeline for short factual Bangladesh news reels.

This scaffold includes:

- npm workspaces monorepo
- Express API with TypeScript
- SQLite + Prisma schema
- RSS source ingestion service
- Bangladesh-local story filtering
- deterministic story scoring service
- React/Vite admin dashboard

## Quick Start

```bash
npm install
npm run db:push
npm run dev
```

API: `http://localhost:4000`

Admin dashboard: `http://localhost:5173`

For live Gemini script generation, create a local `.env` file:

```bash
GEMINI_API_KEY=your-rotated-key
GEMINI_MODEL=gemini-2.5-flash
```

## Useful Commands

```bash
npm run ingest
npm run score
npm run media -- --story-id <story-id> --step subtitles
npm run media -- --story-id <story-id> --step voiceover
npm run media -- --story-id <story-id> --step render
npm run build
```

`npm run db:push` generates Prisma Client and initializes the local SQLite tables. The app still uses Prisma Client for all reads/writes.

## Review Flow

1. Run ingestion.
2. Run scoring.
3. Open the admin dashboard.
4. Use `Review` to edit selected stories.
5. Use `Generate` to ask Gemini for a Bangla script, caption, and hashtags.
6. Use `Subtitles` to export `.srt` and `.vtt` files.
7. Use `Voiceover` to generate an Edge TTS MP3.
8. Use `Render` to generate a 9:16 Remotion MP4.
9. Use `Queue` when the story is ready for manual upload.

Generated media is saved locally:

- `outputs/subtitles`
- `outputs/audio`
- `outputs/videos`

The MVP intentionally stops at local export and manual upload. Auto-posting APIs are still a later module.

## Bangladesh-Only Policy

Bangladesh24 only accepts stories about events that happened inside Bangladesh. The ingestion service skips global or foreign stories, and the scoring/review/render pipeline requires `isBangladeshLocal = true`.
