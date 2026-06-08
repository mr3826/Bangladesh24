create a md file for me
# Bangladesh24 — AI-Powered BD Map News Reels Platform

## Brand Goal
Build a headless short-form news brand called Bangladesh24.

Positioning
গত ২৪ ঘণ্টায় বাংলাদেশের গুরুত্বপূর্ণ ঘটনা — ম্যাপসহ সহজ ভাষায়।

The platform will generate short factual Bangladesh-focused reels using
- Bangladesh map visuals
- districtdivision highlights
- Bangla voiceover
- Bangla subtitles
- factual news summaries
- automated publishing queue

Primary platforms
- Facebook Reels
- Instagram Reels
- TikTok  YouTube Shorts later

Meta is moving Facebook video uploads toward Reels format, so the system should prioritize vertical short video output. contentReference[oaicite0]{index=0}

---

## Core Content Types

### 1. BD Last 24 Hours
Daily summary of 3–5 important national events.

Hook
গত ২৪ ঘণ্টায় বাংলাদেশে যা ঘটলো...

### 2. District Alert
District-specific updates
- flood
- accident
- strike
- road issue
- weather
- local incident
- public notice

Hook
আজ [District] নিয়ে বড় আপডেট...

### 3. Weather Alert
Use BMD or trusted weather source.

Hook
আজ এই জেলাগুলোতে সতর্কতা...

### 4. Price  Economy Update
Market prices, fuel, remittance, dollar rate, inflation, trade.

Hook
আজ বাজারে যে পরিবর্তন হলো...

### 5. Explainer
Not breaking news. Explains why something matters.

Hook
এই ঘটনার পেছনের কারণটা অনেকেই জানেন না...

---

## MVP Goal

Build a working local pipeline that can

1. Collect news from selected sources
2. Extract title, summary, source, publish time, link
3. Score story importance
4. Select top stories
5. Generate Bangla short video script
6. Generate voiceover
7. Generate subtitles
8. Render 916 video with BD map background
9. Save output video
10. Save caption + hashtags
11. Add item to posting queue

Do NOT build full auto-posting in MVP. Start with export + manual upload. Add API publishing later.

---

## Tech Stack

### Backend
- Node.js  TypeScript
- Express or Fastify
- SQLite for MVP
- Prisma ORM
- n8n optional for workflow automation

n8n is useful because it supports workflow automation, self-hosting, and many integrations, so design the backend so n8n can call internal API endpoints later. contentReference[oaicite1]{index=1}

### AI
Primary
- Gemini Flash for summarization, scoring, and script generation

Fallback
- OpenAI only if Gemini fails

Use cheap models first because high-volume summarization is the main workload. Google positions Gemini Flash-style models for efficient high-volume work. contentReference[oaicite2]{index=2}

### Video Rendering
Use
- Remotion OR FFmpeg

Recommended MVP
- Remotion for template-based map videos

### Voice
MVP options
- Edge TTS free
- Google TTS later
- ElevenLabs later only if budget allows

### Storage
Local folder first
- `outputsvideos`
- `outputsaudio`
- `outputssubtitles`
- `outputsthumbs`

Later
- Cloudflare R2  Supabase Storage

---

## Folder Structure

```txt
bangladesh24
  apps
    api
      src
        routes
        services
        workers
        db
        prompts
        utils
    renderer
      src
        compositions
        components
        maps
        templates
    admin
      src
        pages
        components
  packages
    shared
      src
        types
        constants
        districts.ts
        divisions.ts
  data
    sources.json
    bd-districts.geojson
    bd-divisions.geojson
  outputs
    videos
    audio
    subtitles
    thumbnails
  docs
    BRAND.md
    CONTENT_RULES.md
    PROMPTS.md
    ROADMAP.md
  .env.example
  package.json
  README.md