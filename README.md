# Debate Coach

AI debate practice. A student picks a side, argues out loud against an AI opponent that works from a case file, and gets a practice feedback sheet at the end of the round.

## Requirements

- Node.js 22+
- API keys for at least one AI model (Anthropic or Gemini). A Deepgram key is needed for voice, and an Anam key for the avatar.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev
```

Open http://localhost:3000. The practice page is at `/practice`.

## Environment variables

All settings live in `.env.local` (never committed). `.env.example` lists every variable with its default.

| Variable                  | Required               | Purpose                                                                                                                                                                      |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`       | One of the two AI keys | Claude. Create a key at console.anthropic.com                                                                                                                                |
| `ANTHROPIC_MODEL`         | No                     | Claude model id. Default `claude-opus-5`                                                                                                                                     |
| `GEMINI_API_KEY`          | One of the two AI keys | Gemini. Create a key at aistudio.google.com                                                                                                                                  |
| `GEMINI_MODEL`            | No                     | Gemini model id. Default `gemini-3.8-flash`                                                                                                                                  |
| `DEEPGRAM_API_KEY`        | For voice              | Speech to text and the AI voice. The key needs the **Member** role                                                                                                           |
| `DEEPGRAM_STT_MODEL`      | No                     | Speech to text model. Default `nova-3`                                                                                                                                       |
| `DEEPGRAM_TTS_MODEL`      | No                     | AI voice. Default `aura-2-thalia-en`                                                                                                                                         |
| `ELEVENLABS_API_KEY`      | No                     | More natural AI voices (River, Daniel, Alice). Needs the Text to Speech permission                                                                                           |
| `ELEVENLABS_MODEL`        | No                     | ElevenLabs model. Default `eleven_v3_conversational`                                                                                                                         |
| `DEFAULT_PROVIDER`        | No                     | `claude` or `gemini`: the model selected when a round opens. Default `gemini`. The switch only shows when both keys are set                                                  |
| `GRADING_PROVIDER`        | No                     | `claude` or `gemini`: the model that writes every feedback sheet                                                                                                             |
| `AI_TURN_WORDS_JC`        | No                     | Target length of each AI speech at JC level, in words. Default 100, which gives replies of about 120 words                                                                   |
| `AI_TURN_WORDS_SECONDARY` | No                     | Target length of each AI speech at Secondary level, in words. Default 75, which gives replies of about 85 words                                                              |
| `AVATAR_PROVIDER`         | No                     | Who speaks the AI replies: `anam` (default), `aitwin`, `tavus`, or `voice` for no avatar. If that avatar's keys are missing, another configured avatar is used, then `voice` |
| `ANAM_API_KEY`            | For the Anam avatar    | Anam API key (Anam Lab, API Keys). Stays on the server                                                                                                                       |
| `ANAM_AVATAR_ID`          | For the Anam avatar    | The Anam avatar to show. Custom avatars are made in Anam Lab from one photo of an adult                                                                                      |
| `ANAM_VOICE_ID`           | No                     | Anam voice for the avatar. Defaults to Cole, a US male voice                                                                                                                 |
| `AITWIN_ID`               | For the AI Twin avatar | AI Twin API client ID (API Keys page on aitwin.me)                                                                                                                           |
| `AITWIN_SECRET`           | For the AI Twin avatar | AI Twin API client secret. Stays on the server                                                                                                                               |
| `AITWIN_TWIN_ID`          | For the AI Twin avatar | The avatar to show: a sample twin's slug, or the 64-character id of a custom face                                                                                            |
| `AITWIN_VOICE`            | No                     | Voice as `engine:voice`. Custom faces default to the standard voice `visemetts:rex`                                                                                          |
| `TAVUS_API_KEY`           | For the Tavus avatar   | Tavus API key                                                                                                                                                                |
| `TAVUS_PAL_ID`            | For the Tavus avatar   | The Tavus PAL to use. It must be created with `pipeline_mode` set to `echo`                                                                                                  |

The model toggle in the app shows only the models that have a key. Without a Deepgram key the round still works by typing.

The AI voice picker offers River (default), Daniel and Alice from ElevenLabs, and Thalia from Deepgram. Without an ElevenLabs key only Thalia is offered. If the ElevenLabs credit runs out, the reply is spoken by Thalia instead and the ElevenLabs voices are hidden for 12 hours, so the round never goes silent.

When an avatar is on, the avatar speaks the replies in its own voice, so the voice picker is hidden. If the Anam avatar is unavailable, replies fall back to these voices.

To move to a different account, change the key in `.env.local` (locally) or in the hosting environment variables (production). No code changes are needed.

The available models and whether voice is on are fixed when the app is built. After changing any environment variable on Vercel, **redeploy** the project so the change takes effect. Locally, restart `npm run dev`.

## The avatar (Anam)

The live setup runs on Gemini and Anam only. With just those keys set, the model and avatar switches are hidden.

### How a round uses it

- Before the round starts, the avatar plays its own short idle clip from Anam. No session is open, so it costs nothing.
- The live session opens when the student first speaks or types, and closes when the round ends or the page is closed. Anam bills every minute the session is open, including while the student speaks.
- Each Anam plan limits how many sessions can run at once (1 on the free plan). When the limit is reached, the round carries on and the replies are spoken by the voice instead, with a short note on the avatar.

### Change the avatar

1. In Anam Lab, create an avatar from one front-facing photo of an adult. Anam rejects photos that look under 18, and each plan allows a set number of custom avatars.
2. Copy the avatar's id and set it as `ANAM_AVATAR_ID`.
3. Optionally pick a voice from Anam's voice library and set its id as `ANAM_VOICE_ID`.
4. Redeploy.

Avatars belong to an Anam account, so after switching to a different account's key, create the avatar again on that account.

## Scripts

| Command                    | Purpose                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`              | Start the development server                                                |
| `npm run build`            | Production build                                                            |
| `npm start`                | Serve the production build                                                  |
| `npm run lint`             | Lint                                                                        |
| `npm run typecheck`        | Type check                                                                  |
| `npm test`                 | Run tests                                                                   |
| `npm run format`           | Format with Prettier                                                        |
| `npm run case-files:check` | Validate every case file in `case-files/`                                   |
| `npm run demo:audio`       | Regenerate the landing page demo voices in `public/demo/` (ElevenLabs)      |
| `npm run voices:preview`   | Regenerate the voice samples in `public/voices/` played by the voice picker |

The last two read the keys from `.env.local`, so run them locally.

## Case files

Each motion is a Word file (`.docx`) in `case-files/`. The file name becomes the case file id, so it may only contain letters, numbers, hyphens and underscores, with no spaces, for example `school-uniforms.docx`. When there is more than one file, the app shows a motion picker.

The easiest way to add a motion is to copy `under-16-social-media-ban.docx` and replace its content, keeping the same headings and layout.

### Structure

Use Word's built-in heading styles. Section headings are **Heading 2** and must start with the words below. Sections marked required must be present.

| Heading 2 starts with         | Contents                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (Heading 1)                   | The title, for example `Case File: School Uniforms`                                                                                                                                                                                                                                                       |
| `Motion` (required)           | A paragraph starting `Motion:` with the motion, then an optional bullet list of notes such as level, sides and format                                                                                                                                                                                     |
| `Definitions`                 | Bold sub-headings `Definitions`, `Burdens` and one containing "weigh" (for example `How to weigh the round`), each followed by a bullet list of `Label: text` items                                                                                                                                       |
| `Proposition case` (required) | One **Heading 3** per contention, starting with its id: `P1. Title`, `P2. Title` and so on. Under each: a paragraph `In plain English: …`, then bullets `Warrant: …`, `Evidence: …` (one or more) and `Impact: …`. All four are needed                                                                    |
| `Opposition case` (required)  | The same, with ids `O1`, `O2` and so on                                                                                                                                                                                                                                                                   |
| `Expected clash`              | **Heading 3** `Proposition's answers…` and `Opposition's answers…`, each followed by a two-column table: what the other side says, and how this side answers. Start the first cell with the contention id it answers, for example `O2: …`. Then a **Heading 3** `Key…` with a bullet list of clash points |
| `Evidence bank` (required)    | A table with the header row `Fact`, `Helps`, `Source`. `Helps` is `Prop`, `Opp` or `Both`. These rows are the only figures the AI may quote, and the feedback sheet checks the student's evidence against them                                                                                            |
| `Glossary`                    | A two-column table of term and plain-English meaning                                                                                                                                                                                                                                                      |
| `Notes for the developer`     | A bullet list. Put level guidance under a bullet `Difficulty level`, with nested bullets `JC: …` and `Secondary: …`. The AI follows these for each level                                                                                                                                                  |

Bullet labels can be written as `Label: text` or with the label in bold.

### Check and publish

1. Run `npm run case-files:check`. It lists every error and warning with where it is in the file. A file with errors is left out of the app.
2. Commit the file to the repository. On Vercel the new motion appears after the next deploy, because case files are bundled with the app when it is built.

## Deployment

The app is a standard Next.js project and deploys to Vercel as is.

1. Import the repository in Vercel.
2. Add the environment variables above in the project settings.
3. Deploy. Case files in `case-files/` are bundled with the API routes automatically.
4. After any later change to the environment variables, redeploy.

## Usage protection

The API routes spend paid credits (Anam, Gemini, Deepgram), so `src/proxy.ts` guards them:

- Only requests made by the app's own pages are accepted. Calls from other sites or from scripts get a 403.
- Each client has a generous limit per 10 minutes on every paid route (for example 15 avatar sessions and 60 AI replies). Past it, the route answers 429 with a "try again in a few minutes" message.

Each server instance keeps its own counts, so the limit stops bursts rather than enforcing an exact quota. For tighter control, add an access code or a rate limit rule in the Vercel firewall.
