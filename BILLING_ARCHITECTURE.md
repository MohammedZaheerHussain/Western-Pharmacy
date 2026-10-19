# 🏗️ Billova Billing Architecture — A-to-Z Blueprint

> **Purpose**: Complete architectural guide for building a billing application from scratch.  
> **Reference Implementation**: Western Pharmacy (Billova Medical)  
> **Adaptable To**: Clothing, Grocery, Hardware, Electronics — any retail billing domain.  
> **Author**: Mohammed Zaheer Hussain  
> **Last Updated**: March 10, 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack Decision](#2-tech-stack-decision)
3. [Project Setup — Step by Step](#3-project-setup--step-by-step)
4. [Folder Structure](#4-folder-structure)
5. [Type System Design](#5-type-system-design)
6. [Database Layer (IndexedDB)](#6-database-layer-indexeddb)
7. [Service Layer Pattern](#7-service-layer-pattern)
8. [Hooks Architecture](#8-hooks-architecture)
9. [Component Hierarchy](#9-component-hierarchy)
10. [Billing Engine](#10-billing-engine)
11. [Feature Gating & Plans](#11-feature-gating--plans)
12. [License Protection](#12-license-protection)
13. [Authentication & Role System](#13-authentication--role-system)
14. [Cloud Sync (Supabase)](#14-cloud-sync-supabase)
15. [PWA & Offline-First](#15-pwa--offline-first)
16. [Deployment Pipeline](#16-deployment-pipeline)
17. [Adapting for Clothing Billing](#17-adapting-for-clothing-billing)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  React Components + Pages + Tailwind CSS + Dark Mode     │
├─────────────────────────────────────────────────────────┤
│                      HOOKS LAYER                         │
│  useBilling • useMedicines • useReports • useRole        │
│  useFeatureAccess • useSyncStatus                        │
├─────────────────────────────────────────────────────────┤
│                   GUARD LAYER (License)                   │
│  guardedOperations.ts → assertLicenseActive()            │
├─────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                          │
│  storage.ts • syncService.ts • adminSupabase.ts          │
│  licenseGuard.ts                                         │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                             │
│  IndexedDB (offline) ←→ Supabase (cloud sync)           │
└─────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Offline-First**: All data lives in IndexedDB. App works without internet.
2. **Cloud-Optional**: Supabase syncs data to cloud when available.
3. **Double-Layer Protection**: License enforcement at both UI and business logic layers.
4. **Feature Gating**: Plan-based access control (demo → basic → pro → premium).
5. **PWA**: Installable as desktop app, works offline after first load.

---

## 2. Tech Stack Decision

| Layer          | Technology          | Why This?                                    |
|----------------|---------------------|----------------------------------------------|
| **Framework**  | React 18            | Component model, large ecosystem, fast dev   |
| **Language**   | TypeScript 5.6      | Type safety, catch bugs at compile time      |
| **Styling**    | Tailwind CSS 3.4    | Utility-first, rapid UI prototyping          |
| **Build**      | Vite 6              | Instant HMR, fast builds, ESM-native         |
| **Local DB**   | IndexedDB (via idb) | Offline storage, structured data, 250MB+     |
| **Cloud DB**   | Supabase            | PostgreSQL + Auth + RLS + Realtime           |
| **Icons**      | Lucide React        | Clean icons, tree-shakable, consistent       |
| **Charts**     | Recharts            | React-native charting, responsive            |
| **PWA**        | vite-plugin-pwa     | Service worker, caching, installability      |
| **Deployment** | Vercel              | Auto-deploy from Git, edge CDN, free tier    |

### Key Dependencies (package.json)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.93.2",
    "idb": "^8.0.0",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^3.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.2",
    "vite": "^6.0.3",
    "vite-plugin-pwa": "^1.2.0"
  }
}
```

---

## 3. Project Setup — Step by Step

### Step 1: Scaffold
```bash
npx -y create-vite@latest my-billing-app -- --template react-ts
cd my-billing-app
npm install
```

### Step 2: Install Core Dependencies
```bash
# Runtime deps
npm install idb lucide-react recharts @supabase/supabase-js

# Dev deps
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p
```

### Step 3: Configure Vite + PWA
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Your Billing App',
        short_name: 'Billing',
        description: 'Inventory & Billing System',
        start_url: '/',
        display: 'standalone',
        theme_color: '#7C3AED',
        icons: [
          { src: '/logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}']
      }
    })
  ]
})
```

### Step 4: Configure TypeScript (strict mode)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### Step 5: Environment Variables
```bash
# .env.local (never commit this)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 4. Folder Structure

```
src/
├── App.tsx                 # Main app — routing, layout, auth, theme
├── main.tsx                # React entry point
├── index.css               # Global Tailwind imports + custom CSS
│
├── types/                  # 📐 TypeScript interfaces (DEFINE FIRST)
│   ├── item.ts             # Core item type (Medicine/Clothing/etc)
│   ├── customer.ts         # Customer & loyalty types
│   ├── purchase.ts         # Purchase order types
│   ├── tax.ts              # GST/tax calculation types
│   └── user.ts             # User roles & permissions types
│
├── services/               # 🔧 Business logic (NO React dependencies)
│   ├── storage.ts          # IndexedDB CRUD — THE CORE ENGINE
│   ├── guardedOperations.ts # License-protected write wrappers
│   ├── licenseGuard.ts     # License enforcement logic
│   ├── syncService.ts      # Cloud sync to Supabase
│   └── adminSupabase.ts    # Admin operations (Supabase client)
│
├── hooks/                  # 🪝 React state management
│   ├── useBilling.ts       # Cart, billing flow, bill CRUD
│   ├── useMedicines.ts     # Item CRUD with UI state
│   ├── useReports.ts       # Report generation
│   ├── useRole.ts          # Role-based access
│   ├── useFeatureAccess.tsx # Plan-based feature gating
│   └── useSyncStatus.ts    # Cloud sync state
│
├── components/             # 🧩 Reusable UI components
│   ├── BillingPanel.tsx    # Main billing interface
│   ├── MedicineModal.tsx   # Add/edit item form
│   ├── FilterBar.tsx       # Search & filter controls
│   ├── StatusBadge.tsx     # Stock status indicators
│   ├── BackupModal.tsx     # Backup & restore
│   ├── LicenseExpiredOverlay.tsx
│   └── ... (30 components)
│
├── pages/                  # 📄 Full page views
│   ├── AdminApp.tsx        # Super admin dashboard
│   ├── Reports.tsx         # Sales reports
│   ├── Purchases.tsx       # Purchase orders
│   ├── Suppliers.tsx       # Supplier management
│   └── ... (12 pages)
│
├── context/                # React context providers
│   └── ThemeContext.tsx
│
└── data/                   # Static data / seed data
    └── sampleData.ts
```

### Build Order (Critical!)

```
1. types/       → Define ALL interfaces first
2. services/    → Build storage.ts (pure logic, no React)
3. hooks/       → Wrap services in React state management
4. components/  → Build reusable UI pieces
5. pages/       → Assemble components into full views
6. App.tsx      → Wire routing, auth, theme, layout
```

---

## 5. Type System Design

> **Rule**: Define all types FIRST. They are the contract between layers.

### Core Item Type Pattern

```typescript
// types/item.ts — Adapt this for ANY domain

// For Pharmacy:
export interface Medicine {
    id: string;
    name: string;
    brand: string;
    salt: string;               // ← domain-specific
    category: MedicineCategory; // ← domain-specific
    quantity: number;
    unitPrice: number;
    batches?: Batch[];
    location: ItemLocation;
    barcode?: string;
    hsn?: string;              // Tax code
    taxRate?: number;
    createdAt: string;
    updatedAt: string;
    auditHistory: AuditEntry[];
}

// For Clothing — same pattern, different fields:
export interface ClothingItem {
    id: string;
    name: string;              // "Men's Slim Fit Shirt"
    brand: string;             // "Allen Solly"
    sku: string;               // Stock Keeping Unit
    category: ClothingCategory; // 'Shirts' | 'Pants' | etc.
    
    // Clothing-specific fields:
    size: string;              // "S" | "M" | "L" | "XL" | "XXL"
    color: string;
    fabric: string;            // "Cotton" | "Polyester" | etc.
    variants?: Variant[];      // Size/color combos with individual stock
    
    quantity: number;
    mrp: number;               // Maximum Retail Price
    sellingPrice: number;      // Actual selling price
    purchasePrice: number;     // Cost price
    
    location: ItemLocation;
    barcode?: string;          // EAN barcode per variant
    hsn?: string;              // 6201 for shirts, etc.
    taxRate?: number;          // GST: 5% (≤₹1000) or 12% (>₹1000)
    
    createdAt: string;
    updatedAt: string;
    auditHistory: AuditEntry[];
}
```

### Billing Types Pattern

```typescript
// This pattern works for ANY billing domain

export interface BillItem {
    itemId: string;
    itemName: string;
    brand: string;
    quantity: number;
    unitPrice: number;
    total: number;
    // Domain-specific:
    batchNumber?: string;   // Pharmacy
    size?: string;          // Clothing
    color?: string;         // Clothing
}

export interface Bill {
    id: string;
    billNumber: string;        // "BILL-0001" auto-increment
    customerName?: string;
    customerPhone?: string;
    items: BillItem[];
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    taxAmount?: number;        // GST
    grandTotal: number;
    createdAt: string;
}
```

### Audit Trail Pattern (reusable for any domain)

```typescript
export interface AuditEntry {
    id: string;
    timestamp: string;
    action: 'created' | 'updated' | 'quantity_changed' | 'sold';
    changes?: {
        field: string;
        oldValue: string | number;
        newValue: string | number;
    }[];
    note?: string;
}
```

---

## 6. Database Layer (IndexedDB)

> **This is the HEART of the application.** Get this right first.

### Schema Definition

```typescript
// services/storage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
    items: {
        key: string;
        value: YourItemType;
        indexes: {
            'by-name': string;
            'by-category': string;
            'by-expiry': string;
        };
    };
    bills: {
        key: string;
        value: Bill;
        indexes: {
            'by-date': string;
            'by-number': string;
        };
    };
    counters: {
        key: string;
        value: { id: string; value: number };
    };
}

const DB_NAME = 'your-app-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AppDB> | null = null;

async function getDB(): Promise<IDBPDatabase<AppDB>> {
    if (dbInstance) return dbInstance;
    
    dbInstance = await openDB<AppDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            // Version 1: Initial schema
            if (oldVersion < 1) {
                const itemStore = db.createObjectStore('items', { keyPath: 'id' });
                itemStore.createIndex('by-name', 'name');
                itemStore.createIndex('by-category', 'category');
                
                const billStore = db.createObjectStore('bills', { keyPath: 'id' });
                billStore.createIndex('by-date', 'createdAt');
                billStore.createIndex('by-number', 'billNumber');
                
                db.createObjectStore('counters', { keyPath: 'id' });
            }
            // Future: if (oldVersion < 2) { ... }
        }
    });
    
    return dbInstance;
}
```

### CRUD Pattern — Copy This for Every Entity

```typescript
// ─── CREATE ───
export async function addItem(
    item: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'auditHistory'>
): Promise<Item> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newItem: Item = {
        ...item,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        auditHistory: [createAuditEntry('created')]
    };
    await db.put('items', newItem);
    return newItem;
}

// ─── READ ───
export async function getAllItems(): Promise<Item[]> {
    const db = await getDB();
    return db.getAll('items');
}

export async function getItem(id: string): Promise<Item | undefined> {
    const db = await getDB();
    return db.get('items', id);
}

// ─── UPDATE (with audit trail) ───
export async function updateItem(
    id: string,
    updates: Partial<Item>
): Promise<Item | undefined> {
    const db = await getDB();
    const existing = await db.get('items', id);
    if (!existing) return undefined;

    // Build audit trail
    const changes = Object.keys(updates)
        .filter(key => existing[key] !== updates[key])
        .map(key => ({
            field: key,
            oldValue: existing[key],
            newValue: updates[key]
        }));

    const updated: Item = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
        auditHistory: [
            createAuditEntry('updated', changes),
            ...existing.auditHistory
        ]
    };
    
    await db.put('items', updated);
    return updated;
}

// ─── DELETE ───
export async function deleteItem(id: string): Promise<boolean> {
    const db = await getDB();
    await db.delete('items', id);
    return true;
}
```

### Bill Number Auto-Increment

```typescript
export async function getNextBillNumber(): Promise<string> {
    const db = await getDB();
    const counter = await db.get('counters', 'bill-counter');
    const nextNum = (counter?.value || 0) + 1;
    await db.put('counters', { id: 'bill-counter', value: nextNum });
    return `BILL-${String(nextNum).padStart(4, '0')}`;
}
```

---

## 7. Service Layer Pattern

### The Golden Rule
```
Components → Hooks → Guarded Operations → Storage → IndexedDB
                         ↑
                 License check here
```

### guardedOperations.ts — Wrapper Pattern

```typescript
// Every write function goes through license check
import * as storage from './storage';
import { assertLicenseActive } from './licenseGuard';

function guardWrite<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return (async (...args: Parameters<T>) => {
        assertLicenseActive(); // Throws LicenseExpiredError if expired
        return fn(...args);
    }) as T;
}

// Guard all write operations
export const addItem = guardWrite(storage.addItem);
export const updateItem = guardWrite(storage.updateItem);
export const deleteItem = guardWrite(storage.deleteItem);
export const createBill = guardWrite(storage.createBill);

// Read operations pass through directly
export { getAllItems, getItem, getAllBills } from './storage';
```

---

## 8. Hooks Architecture

### Core Hook Pattern

```typescript
// hooks/useItems.ts
export function useItems() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const data = await guardedOps.getAllItems();
            setItems(data);
        } catch (err) {
            setError('Failed to load items');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);

    const addItem = async (data: ItemFormData) => {
        try {
            await guardedOps.addItem(data);
            await loadItems(); // Refresh list
        } catch (err) {
            if (err instanceof LicenseExpiredError) {
                setError('License expired — cannot add items');
            } else {
                setError('Failed to add item');
            }
        }
    };

    return { items, loading, error, addItem, loadItems };
}
```

### useBilling Hook — The Complex One

```typescript
export function useBilling() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);

    // Computed values
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const grandTotal = subtotal - discountAmount;

    const addToCart = (item: Item, qty: number) => {
        // Check stock, calculate price, add to cart
    };

    const submitBill = async () => {
        const bill = await guardedOps.createBill(
            cart, discountPercent, customerName
        );
        setCart([]); // Reset cart
        return bill;
    };

    return {
        cart, subtotal, discountAmount, grandTotal,
        addToCart, submitBill, setDiscountPercent,
        customerName, setCustomerName
    };
}
```

---

## 9. Component Hierarchy

```
App.tsx
├── Header (logo, nav, theme toggle, user menu)
├── Sidebar / Navigation
│   ├── Dashboard
│   ├── Inventory
│   ├── Billing
│   ├── Reports
│   ├── Suppliers
│   ├── Purchases
│   ├── Staff (premium)
│   └── Settings
│
├── Main Content Area (renders active page)
│   ├── Dashboard Page
│   ├── Inventory Page
│   │   ├── FilterBar (search, category, status filters)
│   │   ├── ItemTable / ItemGrid
│   │   ├── ItemModal (add/edit form)
│   │   └── BulkActions
│   ├── Billing Page
│   │   ├── ItemSearch (autocomplete)
│   │   ├── Cart Table
│   │   ├── CustomerInfo
│   │   ├── DiscountSection
│   │   ├── BillSummary
│   │   └── PrintReceipt
│   └── Reports Page
│       ├── DateRangePicker
│       ├── SalesChart (Recharts)
│       └── ExportButton
│
├── Overlays (conditional)
│   ├── LicenseExpiredOverlay
│   ├── ExpiryWarningBanner
│   └── AccountSuspendedOverlay
│
└── Modals
    ├── SettingsModal
    ├── BackupModal
    └── PrintPreview
```

---

## 10. Billing Engine

### Flow: Item → Cart → Bill → Stock Deduction

```
1. User searches for item
2. User selects item + enters quantity
3. System validates stock availability
4. Item added to cart with calculated price
5. User can add discount (% or fixed)
6. User clicks "Create Bill"
7. ATOMIC OPERATION:
   a. Deduct stock from each item
   b. Create bill record
   c. Update audit trail
   d. Generate bill number
8. Show print preview
```

### Stock Deduction — Must Be Atomic

```typescript
export async function createBill(
    items: BillItem[],
    discountPercent: number = 0,
    customerName?: string
): Promise<Bill> {
    const db = await getDB();
    const tx = db.transaction(['items', 'bills', 'counters'], 'readwrite');
    
    try {
        // 1. Validate ALL stock before any changes
        for (const item of items) {
            const medicine = await tx.objectStore('items').get(item.itemId);
            if (!medicine || medicine.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${item.itemName}`);
            }
        }

        // 2. Deduct stock from each item
        for (const item of items) {
            const medicine = await tx.objectStore('items').get(item.itemId);
            medicine.quantity -= item.quantity;
            medicine.auditHistory.unshift(createAuditEntry('sold'));
            await tx.objectStore('items').put(medicine);
        }

        // 3. Create bill record
        const billNumber = await getNextBillNumber();
        const subtotal = items.reduce((s, i) => s + i.total, 0);
        const discountAmount = subtotal * (discountPercent / 100);
        
        const bill: Bill = {
            id: generateId(),
            billNumber,
            customerName,
            items,
            subtotal,
            discountPercent,
            discountAmount,
            grandTotal: subtotal - discountAmount,
            createdAt: new Date().toISOString()
        };

        await tx.objectStore('bills').put(bill);
        await tx.done; // Commit transaction
        
        return bill;
    } catch (err) {
        // Transaction auto-aborts on error — all changes rolled back
        throw err;
    }
}
```

### Bill Editing — Reverse + Re-apply

```typescript
// When editing a bill:
// 1. Calculate delta between old and new quantities
// 2. Restore old stock amounts
// 3. Deduct new stock amounts
// All in one atomic transaction
```

---

## 11. Feature Gating & Plans

### Plan Tiers

```
demo       → 3-day trial, basic features only
basic      → Inventory + Billing + Basic Reports
pro        → Basic + Advanced Reports + Suppliers + Barcode + WhatsApp
premium    → Pro + Multi-User + Staff + Activity Logs + Loyalty
```

### useFeatureAccess Pattern

```typescript
export function useFeatureAccess(plan: UserPlan) {
    return {
        canViewReports: ['pro', 'premium'].includes(plan),
        canManageSuppliers: ['pro', 'premium'].includes(plan),
        canScanBarcode: ['pro', 'premium'].includes(plan),
        canManageStaff: plan === 'premium',
        canViewActivityLogs: plan === 'premium',
        canUseLoyalty: plan === 'premium',
        maxItems: plan === 'demo' ? 50 : Infinity,
        maxBillsPerDay: plan === 'demo' ? 10 : Infinity,
    };
}
```

### UI Gating Pattern

```tsx
// In component:
const { canManageSuppliers } = useFeatureAccess(userPlan);

{canManageSuppliers ? (
    <NavItem icon={Truck} label="Suppliers" />
) : (
    <NavItem icon={Truck} label="Suppliers" badge="PRO" locked />
)}
```

---

## 12. License Protection

### Double-Layer Enforcement

```
Layer 1: UI OVERLAY
├── LicenseExpiredOverlay — blocks entire screen
├── ExpiryWarningBanner — shows countdown
└── Feature buttons disabled

Layer 2: BUSINESS LOGIC GUARD
├── guardedOperations.ts wraps every write function
├── assertLicenseActive() called before any write
└── Throws LicenseExpiredError if expired
```

### Why Two Layers?

A tech-savvy user could bypass the UI overlay via browser DevTools. The business logic guard ensures no data writes are possible even if the UI is bypassed.

---

## 13. Authentication & Role System

### Auth Flow (Supabase)

```
1. User opens app
2. Check Supabase auth session
3. If authenticated → load user role & plan
4. If not → show login screen
5. After login → validate license → load data
```

### Role Levels

```
super_admin  → Can create clients, manage licenses, view all data
admin        → Full access to their pharmacy instance
staff        → Can bill, view inventory (can't delete/export)
viewer       → Read-only access
```

---

## 14. Cloud Sync (Supabase)

### Architecture

```
IndexedDB (primary) ─── Sync Queue ──→ Supabase (backup)
        ↑                                      │
        └──────── Pull on reconnect ←──────────┘
```

### Sync Service Pattern

```typescript
// syncService.ts
export async function queueSync(
    entityType: 'item' | 'bill',
    localId: string,
    operation: 'create' | 'update' | 'delete',
    payload?: unknown
) {
    // Store in sync queue (IndexedDB)
    // Process queue when online
    // Retry with exponential backoff
}
```

### Multi-Tenant Isolation

Every record in Supabase has a `client_id`. Row Level Security ensures tenants only see their own data:

```sql
CREATE POLICY "Clients see own data"
    ON medicines FOR SELECT
    USING (client_id = auth.jwt() ->> 'client_id');
```

---

## 15. PWA & Offline-First

### vite-plugin-pwa Config

```typescript
VitePWA({
    registerType: 'autoUpdate',    // Auto-update service worker
    manifest: { /* name, icons, theme */ },
    workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [{
            urlPattern: /fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts-cache' }
        }]
    }
})
```

### What This Gets You

- ✅ App installable from browser
- ✅ Works offline after first load
- ✅ Own window (no browser chrome)
- ✅ Background sync when reconnected
- ✅ Automatic updates

---

## 16. Deployment Pipeline

### Vercel Setup

```
1. Connect GitHub repo to Vercel
2. Framework: Vite
3. Build: npm run build
4. Output: dist/
5. Environment vars: Set in Vercel Dashboard
6. Auto-deploy: Push to main → deploy
```

### vercel.json — SPA + Security Headers

```json
{
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                { "key": "X-Content-Type-Options", "value": "nosniff" }
            ]
        }
    ],
    "rewrites": [
        {
            "source": "/((?!api|manifest).*)",
            "destination": "/index.html"
        }
    ]
}
```

---

## 17. Adapting for Clothing Billing

### What Changes

| Aspect | Pharmacy | Clothing |
|--------|----------|----------|
| **Item fields** | salt, schedule, batches, tabletsPerStrip | size, color, fabric, variants |
| **Categories** | Tablet, Syrup, Injection | Shirts, Pants, Sarees |
| **Pricing** | MRP per strip, tablet loose pricing | MRP, selling price, size-based pricing |
| **Stock unit** | Tablets (smallest unit) | Pieces (per size/color combo) |
| **Tax (GST)** | 5% / 12% based on drug type | 5% (≤₹1000) / 12% (>₹1000) |
| **Barcode** | Per medicine | Per variant (size+color) |
| **Batch** | Expiry-based batches | Season/lot-based |
| **Returns** | Rare (expired meds) | Very common (wrong size/color) |

### What Stays the Same

- ✅ IndexedDB storage layer (just change the schema)
- ✅ Billing engine (cart → bill → stock deduction)
- ✅ Hooks architecture (useItems, useBilling)
- ✅ Feature gating & License protection
- ✅ Cloud sync pattern
- ✅ PWA & offline-first
- ✅ Auth & role system
- ✅ Deployment pipeline
- ✅ Component hierarchy (just swap domain-specific UI)

### Clothing-Specific Additions

1. **Variant System**: Each item has size×color variants, each with own stock
2. **Returns & Exchanges**: Full return/exchange workflow (mandatory for apparel)
3. **Season Tags**: Items tagged by season for clearance/markdown
4. **Discount Rules**: Buy 2 get 1, combo offers, seasonal sales
5. **MRP vs Selling Price**: Indian retail law requires both on bill

### Copy-Paste Checklist for New Domain

```
□ Define types/item.ts with your domain fields
□ Define types/customer.ts (usually same)
□ Copy services/storage.ts → change schema + item fields
□ Copy services/guardedOperations.ts → same pattern
□ Copy hooks/useBilling.ts → adapt cart logic
□ Copy hooks/useItems.ts → adapt filters/sort
□ Build domain-specific components (ItemModal, FilterBar)
□ Assemble pages
□ Wire App.tsx routing
□ Configure PWA manifest
□ Deploy to Vercel
```

---

## 📚 Resources

- [IndexedDB + idb](https://github.com/jakearchibald/idb)
- [Supabase Docs](https://supabase.com/docs)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts](https://recharts.org/)
- [OWASP Security Top 10](https://owasp.org/www-project-top-ten/)

---

*Built with ❤️ by Team Billova. Fork it, adapt it, ship it.* 🚀
