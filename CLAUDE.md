# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

成长时间胶囊 (Growth Capsule) - A web application for recording children's developmental behaviors and providing psychology-based analysis. Tracks milestones across motor, language, social, cognitive, and emotional development categories.

The repo contains two projects:
- `growth-capsule/` - Main Next.js 14 web app (primary, production-ready)
- `growth-capsule-mp/` - WeChat mini-program monorepo via pnpm workspace (early stage)

## Development Commands

### Main Web App (growth-capsule/)

```bash
cd growth-capsule

npm run dev          # Next.js dev server on http://localhost:3000
npm run build        # Production build (also used for validation - no test suite)
npm run lint         # ESLint

npm run db:push      # Push Prisma schema to SQLite database
npm run db:studio    # Open Prisma Studio GUI

# Multi-user migration
npm run db:migrate-multiuser   # Add ownerUid to existing data
npm run db:rollback-multiuser  # Revert to single-user
```

### WeChat Mini-Program (growth-capsule-mp/)

```bash
cd growth-capsule-mp

pnpm dev:mp          # Taro dev mode for WeChat mini-program
pnpm build:mp        # Build mini-program for production
pnpm dev:server      # Next.js backend on port 3001
pnpm build:shared    # Build shared utilities package
pnpm build:all       # Build shared → server → mini-program
```

No test suite is configured. Validation is done via `npm run build` and `npm run lint`.

## Core Architecture

### Analyzer Pattern (Multi-tier Fallback System)

**Location**: `growth-capsule/src/lib/analyzers/`

- `base.ts` - `Analyzer` interface and type definitions
- `analyzer-manager.ts` - Manages analyzers with priority-based fallback
- `local-analyzer.ts` - Rule-based analyzer (always available, priority: 1)
- `api-analyzer.ts` - External API analyzer (OpenAI-compatible + Anthropic, priority: 10)

**Key Design**:
1. Analyzers registered by priority (higher = tried first)
2. AnalyzerManager tries each until one succeeds
3. **Always returns success** - never throws 500 errors
4. Falls back to local analyzer if external APIs fail
5. To add a new analyzer: implement `Analyzer` interface and register in `AnalyzerManager`

### Authentication & Multi-User (src/lib/auth.ts)

UID-based user isolation (no login/password system yet). UID resolved by priority:
1. `X-DEV-UID` HTTP header (for API testing)
2. `dev-uid` cookie (set via `DevUidSwitcher` component in browser)
3. `DEV_DEFAULT_UID` env var
4. Fallback: `uid_default_local`

Key functions:
- `getServerUid()` - For Server Components
- `getCurrentUid(request)` - For API routes
- `checkOwnership(resourceOwnerUid, currentUid)` - Returns 403 if mismatch
- `getUserUploadDir(ownerUid, subdir)` / `getUserUploadUrl(...)` - Per-user file paths

### Database (Prisma + SQLite)

Schema at `growth-capsule/prisma/schema.prisma`, database file at `growth-capsule/prisma/growth-capsule.db`.

**Models**: `User` (uid primary key), `Child` (profile + ownerUid), `Record` (behavior records with JSON-serialized analysis), `AnalysisRule` (local psychology rules).

All data is scoped by `ownerUid` for multi-user isolation. Record is indexed on `[childId, date]`, `[childId, isFavorite]`, and `[ownerUid]`.

### Data Flow

1. User submits behavior record → API route (`/api/children/[id]/records`)
2. Route calls `analyzerManager.analyze()` with behavior data
3. Manager tries API analyzer first, falls back to local if unavailable
4. Analysis result stored in `Record.analysis` as JSON string
5. Frontend parses JSON to display structured insights

### Type System

Central types in `src/types/index.ts`:
- `GrowthAnalysisOutput` - Main analysis result (developmentStage, psychologicalInterpretation, emotionalInterpretation, parentingSuggestions, milestone, confidenceLevel, source)
- `ParentingSuggestion` - Structured advice with type (`observe` | `emotional` | `guidance` | `none`), content, theoryReference, deepInsight
- **Behavior categories**: `motor`, `language`, `social`, `cognitive`, `emotional`

### Mini-Program Architecture (growth-capsule-mp/)

pnpm workspace with three packages:
- `packages/miniprogram/` - Taro 4.1.11 + React 18 WeChat mini-program (mirrors web app pages)
- `packages/server/` - Next.js 14 backend (port 3001), separate Prisma + SQLite instance
- `packages/shared/` - TypeScript utility library (psychology rules, shared utils) consumed by both

### External API Configuration

See `.env.example` in `growth-capsule/` for full setup reference.

Key env vars: `AI_API_KEY`, `AI_API_ENDPOINT`, `AI_MODEL`, `AI_API_FORMAT` (`openai` or `anthropic`, auto-detected from endpoint if omitted), `DEV_DEFAULT_UID`.

Supports OpenAI-compatible APIs (DeepSeek, GLM, Moonshot, QianWen, OpenAI) and Anthropic Claude natively. Falls back to local analyzer automatically if not configured.

### Styling and Theme

**Tailwind CSS** with custom brand colors in `tailwind.config.ts`:
- Brand (orange): 50-700 scale (`brand-500` = `#F97316`)
- Accent (green): 50-600 scale (`accent-500` = `#22C55E`)

Custom React components in `src/components/` - no external UI library. Mobile-first responsive design with bottom navigation bar (`BottomTabBar.tsx`).

## Important Conventions

1. **Age calculation**: Always use `ageInMonths` for analysis (not years). Use `formatAge()` from `src/lib/utils.ts` for display.
2. **File uploads**: Stored per-user at `public/uploads/users/{ownerUid}/{avatars|records}/` with `{timestamp}-{originalname}` filenames. Supports JPEG, PNG, HEIC (auto-converts to JPEG).
3. **Analysis storage**: Store full JSON in `Record.analysis`, parse on read.
4. **Date handling**: Convert Date objects to/from ISO strings for Prisma.
5. **Error handling**: API routes return `{ success: true, ... }` or `{ success: false, error }` - never throw 500 errors.
6. **Chinese language**: UI text in Chinese, code/comments in English.
7. **Path alias**: `@/*` maps to `./src/*` in tsconfig.
