# DealFlow Pro — Real Estate Pipeline Manager

A full-stack deal flow and pipeline management tool built for real estate operations. Track acquisitions and development deals from sourcing through closing, with contacts, documents, checklists, financial tracking, and automated deadline notifications.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Email | Resend (transactional email for deadline digests) |
| Hosting | DigitalOcean App Platform (or Vercel, Netlify) |

---

## Features

- **Pipeline Kanban Board** — Visual deal tracking across Sourcing → LOI → Due Diligence → Contract → Closing
- **Deal Status Categories** — Prospective, Hot, Warm, Cold, On Hold, About to Close, Dead/Passed, Closed/Won
- **Per-Deal Checklists** — Auto-generated templates (18 items for acquisitions, 14 for development), plus custom items
- **Financial Tracking** — Purchase price, NOI, cap rate, cash-on-cash, loan terms (LTV, rate, amortization), IRR, equity multiple, tax assessment
- **Contact Management** — 7 role types (brokers, attorneys, lenders, title, PMs, investors, government), linked per deal with global directory
- **Document Storage** — Upload and store files per deal via Supabase Storage
- **Deadline Tracking** — Per-deal deadlines with countdown badges and urgency indicators
- **Email Digest** — Daily/weekly email notifications for upcoming deadlines
- **Multi-User Auth** — Organization-based access with role-based permissions (owner, admin, member, viewer)
- **Row-Level Security** — All data scoped to organizations via Supabase RLS policies

---

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

### 2. Run the Database Migration

Copy the contents of `supabase/migrations/001_initial_schema.sql` and run it in the **Supabase SQL Editor** (Dashboard → SQL Editor → New Query → paste → Run).

This creates all tables, indexes, RLS policies, storage buckets, and triggers.

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start adding deals.

---

## Deploy to DigitalOcean

### Option A: App Platform (Recommended)

1. Push your code to GitHub
2. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
3. Click **Create App** → select your GitHub repo
4. Configure:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:** Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Deploy — DigitalOcean handles SSL, CDN, and scaling

### Option B: Droplet + Nginx

```bash
# On your droplet
git clone your-repo
cd dealflow-pro
npm install
npm run build

# Serve the dist/ folder with Nginx
sudo apt install nginx
# Copy dist/ to /var/www/dealflow
# Configure Nginx to serve the SPA with fallback to index.html
```

---

## Email Digest Setup

### 1. Get a Resend API Key

Sign up at [resend.com](https://resend.com) (free tier = 100 emails/day).

### 2. Deploy the Edge Function

```bash
supabase functions deploy deadline-digest
```

### 3. Set Secrets

```bash
supabase secrets set RESEND_API_KEY=re_your_key
supabase secrets set EMAIL_FROM="DealFlow Pro <notifications@yourdomain.com>"
supabase secrets set APP_URL="https://dealflow.yourdomain.com"
```

### 4. Schedule with pg_cron

In Supabase Dashboard → SQL Editor:

```sql
-- Enable pg_cron if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily at 8 AM UTC
SELECT cron.schedule(
  'deadline-digest',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-project-id.supabase.co/functions/v1/deadline-digest',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);
```

---

## Project Structure

```
dealflow-pro/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example
├── src/
│   ├── main.jsx                 # App entry, routing, auth
│   ├── index.css                # Global styles
│   ├── lib/
│   │   ├── supabase.js          # Supabase client
│   │   ├── constants.js         # Stages, statuses, roles, checklists
│   │   └── store.js             # Zustand state management
│   ├── pages/
│   │   ├── LoginPage.jsx        # Auth (sign in / sign up)
│   │   └── DashboardPage.jsx    # Main app shell
│   └── components/
│       ├── KanbanView.jsx       # Pipeline kanban board
│       ├── ListView.jsx         # Table/list view
│       ├── ContactsPage.jsx     # Global contacts directory
│       ├── DealPanel.jsx        # Deal detail slide-out panel
│       └── NewDealModal.jsx     # Create new deal
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── functions/
        └── deadline-digest/
            └── index.ts         # Email digest edge function
```

---

## Roadmap

- [ ] Gmail / Outlook integration (link emails to deals)
- [ ] Calendar sync (Google Calendar / Outlook)
- [ ] Drag-and-drop Kanban reordering
- [ ] Inline financial field editing
- [ ] Team member assignment per deal
- [ ] Audit trail / activity log view
- [ ] PDF export for deal summaries
- [ ] Mobile responsive design
- [ ] WhatsApp notifications via Clawdbot integration
