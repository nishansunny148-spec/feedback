# Voice Feedback System

A production-ready voice-note client feedback system built with **Vite**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Postgres + Storage + Auth + Realtime).

## Features

- 🎙️ **Client Voice Note Recorder**: High quality browser microphone recording with live animated 60fps canvas waveform, countdown timer, auto mime-type detection (`.m4a` / `.webm`), and in-app browser detection.
- 📱 **Mobile-First Progressive Form**: Tactile 5-star rating picker, structured feedback questions, consent validation, and upload retry with exponential backoff.
- 📁 **File Fallback**: Automatic `<input type="file" accept="audio/*">` fallback when media devices are restricted.
- 🔒 **Private Admin Inbox**: Desktop & mobile responsive inbox with real-time new submission notifications, cursor pagination, filtering, searching, and sorting.
- 🎧 **Custom Audio Player**: Signed URL streaming (10-min lazy refresh), playback speed multiplier (0.75x–2x), 10s skip controls, duration fixing for WebM blobs, and audio file downloading.
- 🌙 **Dark-First Design System**: Rich modern aesthetics with customizable CSS variable tokens, light/dark mode support, background radial glow atmosphere, and glassmorphism.

---

## Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

`.env` contents:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key
VITE_TURNSTILE_SITE_KEY=
VITE_MAX_RECORDING_SECONDS=180
VITE_APP_NAME=Voice Feedback
```

> ⚠️ **Important**: Never place your Supabase `service_role` or secret key in `.env`. The frontend enforces that only the public `anon` key is permitted.

### 2. Database & Storage Setup

Run the SQL migration script from **Appendix A** inside your **Supabase SQL Editor**:

1. Open your Supabase Dashboard project.
2. Go to **SQL Editor** -> **New Query**.
3. Replace `'YOUR_ADMIN_EMAIL'` with your admin user's email address.
4. Execute the SQL script.

Next, in your Supabase Dashboard:
1. Navigate to **Authentication** -> **Providers** / **User Management**.
2. Disable **Allow new users to sign up** (so public registration is blocked).
3. Create your Admin user under **Authentication** -> **Users** matching `YOUR_ADMIN_EMAIL`.

### 3. Install & Run Locally

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Generating Client Links

To send a client-specific feedback link, insert a row into the `clients` table:

```sql
insert into public.clients (name, project)
values ('Acme Corp', 'Mobile Redesign');
```

Copy the generated `token` column value and share the URL:

```
https://your-domain.com/?c=<token>
```

When opened, the form automatically greets the client ("Hello, Acme Corp") and tags the submission with their project.

---

## Deployment (Vercel)

1. Push your code to a GitHub/GitLab repository.
2. Import the project into **Vercel**.
3. Set the Environment Variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MAX_RECORDING_SECONDS`
4. Deploy!

---

## Build & Quality Check

```bash
# Run TypeScript type check
npm run typecheck

# Build production bundle
npm run build
```
