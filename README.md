# PUNT.AI — Setup Guide

## Stack
- **Next.js 14** (App Router)
- **Supabase** — Auth + Postgres database
- **Tailwind CSS**
- **TypeScript**

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Wait for it to provision (~2 min)
3. Go to **Settings → API** and copy:
   - `Project URL`
   - `anon public` key

---

## 2. Set Up the Database

1. In your Supabase dashboard go to **SQL Editor**
2. Paste the entire contents of `supabase-setup.sql` and click **Run**
3. This creates:
   - `profiles` table (auto-created on signup)
   - `punts` table (your bet history)
   - `leaderboard_view` (aggregated rankings)
   - Row Level Security policies
   - Auto-triggers for new users

---

## 3. Install & Configure the App

```bash
# Clone / create the project
npx create-next-app@latest punt-ai --typescript --tailwind --app

# Copy all files into the project, then:
npm install @supabase/supabase-js @supabase/ssr lucide-react

# Set up environment variables
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## File Structure

```
punt-ai/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← sidebar wrapper
│   │   ├── dashboard/page.tsx  ← AI picks + overview
│   │   ├── punts/page.tsx      ← log & track bets
│   │   ├── leaderboard/page.tsx
│   │   └── profile/page.tsx
│   ├── layout.tsx              ← fonts + global styles
│   ├── globals.css
│   └── page.tsx                ← redirects to /dashboard or /login
├── components/
│   └── layout/
│       └── Sidebar.tsx
├── lib/
│   └── supabase.ts             ← browser + server clients
├── types/
│   └── database.ts             ← TypeScript types
├── middleware.ts               ← route protection
└── supabase-setup.sql          ← run this in Supabase
```

---

## Features

- ✅ Register / Login / Forgot Password
- ✅ Auto-creates profile on signup
- ✅ Protected routes via middleware
- ✅ Dashboard with AI picks + recent punts
- ✅ Log new punts with event, pick, odds, stake
- ✅ Filter punts by status (pending/won/lost)
- ✅ Leaderboard ranked by net profit
- ✅ Profile editing
- ✅ Sign out

## Next Steps

- Wire up real AI picks (OpenAI / Anthropic API)
- Add deposit/withdraw flow (Stripe)
- Admin panel to settle pending punts
- Push notifications for results
- Mobile app (React Native)
