# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

成长时间胶囊 (Growth Capsule) - A web application for recording children's developmental behaviors and providing psychology-based analysis. The app tracks milestones across motor, language, social, cognitive, and emotional development categories.

The repo contains two projects:
- `growth-capsule/` - Main Next.js 14 web app (primary)
- `growth-capsule-mp/` - WeChat mini-program monorepo (pnpm workspace, early stage)

## Development Commands

All commands should be run from the `growth-capsule/` directory:

```bash
# Development
npm run dev          # Start Next.js dev server on http://localhost:3000
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push Prisma schema to SQLite database
npm run db:studio    # Open Prisma Studio GUI

# Multi-user migration
npm run db:migrate-multiuser   # Add ownerUid to existing data
npm run db:rollback-multiuser  # Revert to single-user
```

No test suite is configured. Validation is done via `npm run build` and `npm run lint`.

## Core Architecture

### Analyzer Pattern (Multi-tier Fallback System)

**Location**: `src/lib/analyzers/`

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

### Database Schema (Prisma + SQLite)

**Models**:
- `User` - User profile (uid as primary key, status, externalIds as JSON)
- `Child` - Child profile (name, birthDate, gender, avatarUrl, ownerUid)
- `Record` - Behavior records with `analysis` field storing JSON-serialized `GrowthAnalysisOutput`
  - Indexed on `[childId, date]` and `[childId, isFavorite]` and `[ownerUid]`
- `AnalysisRule` - Local psychology rules (age ranges, categories, milestones)

All data is scoped by `ownerUid` for multi-user isolation.

### Data Flow

1. User submits behavior record → API route (`/api/children/[id]/records`)
2. Route calls `analyzerManager.analyze()` with behavior data
3. Manager tries API analyzer first, falls back to local if unavailable
4. Analysis result stored in `Record.analysis` as JSON string
5. Frontend parses JSON to display structured insights

### Type System

**Central types** (`src/types/index.ts`):
- `GrowthAnalysisOutput` - Main analysis output (developmentStage, psychologicalInterpretation, emotionalInterpretation, parentingSuggestions, milestone, confidenceLevel, source)
- `ParentingSuggestion` - Structured advice with type, content, theoryReference, deepInsight
- `SuggestionType`: `'observe' | 'emotional' | 'guidance' | 'none'`
- `ConfidenceLevel`: `'high' | 'medium' | 'low'`

**Behavior categories**: `motor`, `language`, `social`, `cognitive`, `emotional`

### App Router Structure

```
/                                    # Homepage with child list
/children/new                        # Create child
/children/[id]                       # Child detail page
/children/[id]/record                # Add text record
/children/[id]/photo-record          # Add photo record
/children/[id]/voice-record          # Add voice record
/children/[id]/insights              # Analysis insights
/children/[id]/insights/[recordId]   # Single record analysis detail
/children/[id]/edit                  # Edit child
/children/[id]/delete                # Delete child
/timeline                            # Timeline view with search/filters
/insights                            # Global insights dashboard
/profile                             # User profile & settings
/export                              # Export/PDF generation
/import                              # Import from Day One journal
/guide                               # Growth stage guidance
/help                                # Help page
```

**API Routes**:
- `POST /api/analyze` - Standalone behavior analysis
- `GET/POST /api/children` - List/create children
- `GET/PUT/DELETE /api/children/[id]` - Child CRUD
- `GET/POST /api/children/[id]/records` - List/create records (auto-analysis on create)
- `POST /api/children/[id]/record-with-image` - Create record with image
- `PUT /api/children/[id]/avatar` - Upload avatar
- `GET/PUT/DELETE /api/records/[id]` - Record CRUD
- `PUT /api/records/[id]/favorite` - Toggle favorite
- `POST /api/upload/image` - Upload image
- `POST /api/import` - Import Day One exports
- `POST /api/dev/switch-uid` - Switch user UID (dev only)

### External API Configuration

**Environment variables** (`.env`):
- `AI_API_KEY` - API key for external AI service (optional)
- `AI_API_ENDPOINT` - API endpoint URL (optional)
- `AI_MODEL` - Model name (optional)
- `AI_API_FORMAT` - `openai` or `anthropic` (auto-detected from endpoint if omitted)
- `DEV_DEFAULT_UID` - Default user UID for development

Supports OpenAI-compatible APIs (DeepSeek, GLM, Moonshot, QianWen, OpenAI) and Anthropic Claude natively. If not configured, falls back to local analyzer automatically.

### Styling and Theme

**Tailwind CSS** with custom brand colors defined in `tailwind.config.ts`:
- Brand (orange): 50-700 scale (`brand-500` = `#F97316`)
- Accent (green): 50-600 scale (`accent-500` = `#22C55E`)

Custom React components in `src/components/` - no external UI library. Mobile-first responsive design with bottom navigation bar (`BottomTabBar.tsx`).

### Important Conventions

1. **Age calculation**: Always use `ageInMonths` for analysis (not years). Use `formatAge()` from `src/lib/utils.ts` for display.
2. **File uploads**: Stored per-user at `public/uploads/users/{ownerUid}/{avatars|records}/` with `{timestamp}-{originalname}` filenames. Supports JPEG, PNG, HEIC (auto-converts to JPEG).
3. **Analysis storage**: Store full JSON in `Record.analysis`, parse on read
4. **Date handling**: Convert Date objects to/from ISO strings for Prisma
5. **Error handling**: API routes return `{ success: true, ... }` or `{ success: false, error }` - never throw 500 errors
6. **Chinese language**: UI text in Chinese, code/comments in English
7. **Path alias**: `@/*` maps to `./src/*` in tsconfig
