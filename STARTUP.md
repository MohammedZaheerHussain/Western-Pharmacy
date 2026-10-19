# 🚀 Western Pharmacy — Developer Startup Guide

> **Last Updated**: March 10, 2026  
> **Project**: Billova Medical Billing (Western Pharmacy Instance)  
> **Live URL**: Deployed on Vercel (auto-deploys from `main` branch)  
> **Repo**: [github.com/MohammedZaheerHussain/Western-Pharmacy](https://github.com/MohammedZaheerHussain/Western-Pharmacy)

---

## 📋 Prerequisites

| Tool    | Minimum Version | Check Command   |
|---------|-----------------|-----------------|
| Node.js | v18+            | `node -v`       |
| npm     | v9+             | `npm -v`        |
| Git     | v2.x            | `git --version` |

> **Recommended**: Node v24.x (currently used by the project)

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/MohammedZaheerHussain/Western-Pharmacy.git
cd Western-Pharmacy

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Fill in your Supabase credentials in .env.local (see section below)

# 5. Start development server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root (it's already in `.gitignore`):

```env
# ─── REQUIRED ───────────────────────────────────────────────
# Supabase Project URL
# Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
VITE_SUPABASE_URL=https://kztprknzpjlkvbfuabgt.supabase.co

# Supabase Anon Key (public, safe for client-side)
# Get from: Same page as above → "anon public" key
VITE_SUPABASE_ANON_KEY=<ask project owner for the anon key>

# ─── ADMIN ONLY (Optional) ─────────────────────────────────
# Service Role Key — ONLY needed if you're working on admin features
# ⚠️ NEVER commit this key or expose it in client-side code
VITE_SUPABASE_SERVICE_ROLE_KEY=<ask project owner - KEEP SECRET>
```

> **⚠️ Important**: Ask **Mohammed Zaheer** for the actual Supabase credentials. Never share them in chat or commit them to git.

---

## 🗄️ Supabase Database Setup

If you're setting up a **fresh Supabase project**, run these SQL scripts in order via the [Supabase SQL Editor](https://supabase.com/dashboard/project/kztprknzpjlkvbfuabgt/sql):

### Step 1: Core Tables
Run the file: `supabase/RUN_IN_DASHBOARD.sql`  
This creates the `plans`, `clients`, `licenses`, and `branding` tables.

### Step 2: Plans Data
Run the file: `supabase/add_plans.sql`  
This inserts all plan tiers (demo, basic, pro, premium).

### Step 3: Migrations (in order)
```
supabase/migrations/20260130130000_add_plans.sql
supabase/migrations/20260130140000_plans_rls.sql
supabase/migrations/20260205000000_client_sync_tables.sql
```

> **Note**: If you're connecting to the existing Supabase project (not a new one), the database is already set up — just connect with the credentials.

---

## 📜 Available Scripts

| Command              | Description                              |
|----------------------|------------------------------------------|
| `npm run dev`        | Start dev server at `localhost:5173`      |
| `npm run build`      | TypeScript check + production build       |
| `npm run preview`    | Preview production build locally          |
| `npm run lint`       | Run ESLint                               |

---

## 🏗️ Project Architecture

```
Western-Pharmacy/
├── src/
│   ├── App.tsx              # Main app component (routes, auth, layout)
│   ├── main.tsx             # React entry point
│   ├── index.css            # Global styles
│   ├── components/          # 30 UI components
│   │   ├── BackupModal.tsx
│   │   ├── BillingPanel.tsx
│   │   ├── ExpiryWarningBanner.tsx
│   │   ├── LicenseExpiredOverlay.tsx
│   │   ├── MedicineModal.tsx
│   │   ├── PurchaseOrderModal.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useBilling.ts         # Billing state & operations
│   │   ├── useMedicines.ts       # Medicine CRUD operations
│   │   ├── useFeatureAccess.tsx   # Plan-based feature gating
│   │   ├── useReports.ts         # Report generation
│   │   ├── useRole.ts            # Role-based access
│   │   └── useSyncStatus.ts      # Cloud sync management
│   ├── pages/               # 12 page components
│   │   ├── AdminApp.tsx          # Super admin dashboard
│   │   ├── AdvancedReports.tsx
│   │   ├── Purchases.tsx
│   │   └── ...
│   ├── services/            # Business logic layer
│   │   ├── storage.ts            # IndexedDB operations (core)
│   │   ├── guardedOperations.ts  # License-protected write wrapper
│   │   ├── licenseGuard.ts       # License enforcement logic
│   │   ├── adminSupabase.ts      # Supabase admin client
│   │   ├── syncService.ts        # Cloud sync service
│   │   └── ...
│   ├── types/               # TypeScript type definitions
│   └── context/             # React context providers
├── supabase/
│   ├── migrations/          # Database migration SQL files
│   └── functions/           # Edge Functions (server-side)
├── public/                  # Static assets (logo, icons)
├── vercel.json              # Vercel deployment config
├── vite.config.ts           # Vite + PWA configuration
├── tailwind.config.js       # Tailwind CSS config
└── tsconfig.json            # TypeScript configuration
```

---

## 🧰 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | React 18 + TypeScript 5.6           |
| Styling     | Tailwind CSS 3.4                    |
| Build Tool  | Vite 6 + vite-plugin-pwa            |
| Local DB    | IndexedDB (via `idb` library)       |
| Cloud DB    | Supabase (PostgreSQL + Auth)        |
| Charts      | Recharts 3.7                        |
| Icons       | Lucide React                        |
| Barcode     | @zxing/library                      |
| Deployment  | Vercel (auto-deploy on push)        |

---

## 🔐 Key Architecture Concepts

### Offline-First Storage
All data is stored locally in **IndexedDB**. The app works fully offline. Cloud sync to Supabase is optional.

- Primary storage: `src/services/storage.ts`
- Cloud sync: `src/services/syncService.ts`

### License Protection (Double-Layer)
Write operations are guarded at two levels:

1. **UI Layer**: `LicenseExpiredOverlay` blocks the screen when license expires
2. **Business Logic Layer**: `guardedOperations.ts` wraps all write functions with `assertLicenseActive()` checks

All hooks (`useBilling`, `useMedicines`) import write functions from `guardedOperations.ts` instead of `storage.ts` directly.

### Feature Gating
Plan-based feature access is controlled by `useFeatureAccess.tsx`. Plans: `demo`, `basic`, `pro`, `premium`.

### Role System
User roles (`admin`, `staff`, `viewer`) are managed by `useRole.ts`. The super admin panel is at `/admin`.

---

## 🚢 Deployment

### Vercel (Production)
- **Auto-deploys** on every push to `main` branch
- **Config**: `vercel.json` handles SPA rewrites and security headers
- **Environment vars**: Set in Vercel Dashboard → Settings → Environment Variables

### Manual Build
```bash
npm run build    # Outputs to dist/
npm run preview  # Test production build locally
```

---

## ⌨️ Keyboard Shortcuts

| Key   | Action              |
|-------|---------------------|
| `B`   | Open Billing Panel  |
| `D`   | Toggle Dark Mode    |
| `/`   | Focus Search Bar    |
| `Esc` | Close Modal/Panel   |

---

## 🔧 Troubleshooting

### "Supabase environment variables not configured"
→ Make sure `.env.local` exists with valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Build fails with TypeScript errors
→ Run `npm run build` locally before pushing. The build uses strict TypeScript checking (`noUnusedLocals`, `noUnusedParameters`).

### PWA not updating / stale cache
→ In Chrome DevTools → Application → Service Workers → click "Unregister", then hard refresh.

### IndexedDB data not showing
→ Check DevTools → Application → IndexedDB → look for the `billova-pharmacy-db` database.

---

## 👥 Team Contacts

| Role            | Name              | Contact                |
|-----------------|-------------------|------------------------|
| Project Owner   | Mohammed Zaheer   | *(add contact info)*   |
| Collaborator    | *(your teammate)* | *(add contact info)*   |

---

## 📝 Important Notes

1. **Never commit `.env.local`** — it contains secret keys
2. **Always run `npm run build`** before pushing — Vercel will reject broken builds
3. **`main` branch auto-deploys** — treat it as production
4. **IndexedDB is per-browser** — data doesn't sync between browsers unless cloud sync is enabled
5. The **Service Role Key** should only be used for admin operations and is a major security concern if exposed client-side

---

*Welcome to the team! If anything is unclear, reach out to the project owner.* 🎉
