# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

成长时间胶囊 (Growth Capsule) - A web application for recording children's developmental behaviors and providing psychology-based analysis. The app tracks milestones across motor, language, social, cognitive, and emotional development categories.

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
```

## Core Architecture

### Analyzer Pattern (Multi-tier Fallback System)

The app uses a sophisticated analyzer architecture for child development analysis:

**Location**: `src/lib/analyzers/`

**Components**:
- `base.ts` - Defines the `Analyzer` interface and type definitions
- `analyzer-manager.ts` - Manages multiple analyzers with priority-based fallback
- `local-analyzer.ts` - Local rule-based analyzer (always available, priority: 1)
- `api-analyzer.ts` - External API analyzer (GLM/Claude, priority: 10)

**Key Design**:
1. Analyzers are registered by priority (higher number = higher priority)
2. AnalyzerManager tries each analyzer in order until one succeeds
3. **Always returns success** - never throws 500 errors
4. Falls back to local analyzer if external APIs fail
5. To add a new analyzer: implement the `Analyzer` interface and register in `AnalyzerManager`

### Data Flow

1. User submits behavior record → API route (`/api/children/[id]/records`)
2. Route calls `analyzerManager.analyze()` with behavior data
3. Manager tries API analyzer first, falls back to local if unavailable
4. Analysis result stored in `Record.analysis` as JSON string
5. Frontend parses JSON to display structured insights

### Database Schema

**Models** (Prisma + SQLite):
- `Child` - Child profile (name, birthDate, gender, avatarUrl)
- `Record` - Behavior records with analysis results
  - `analysis` field stores JSON-serialized `GrowthAnalysisOutput`
  - Indexed on `[childId, date]` for efficient queries
- `AnalysisRule` - Local psychology rules (age ranges, categories, milestones)

**Key Relations**:
- `Child` → `Record` (one-to-many, cascade delete)

### Type System

**Central types** (`src/types/index.ts`):
- `SuggestionType`: `'observe' | 'emotional' | 'guidance' | 'none'`
- `ConfidenceLevel`: `'high' | 'medium' | 'low'`
- `ParentingSuggestion`: Structured advice with type, content, theory reference
- `GrowthAnalysisOutput`: Main analysis output format

**Behavior categories**:
- `motor` - 运动发展 (motor development)
- `language` - 语言发展 (language development)
- `social` - 社交能力 (social skills)
- `cognitive` - 认知发展 (cognitive development)
- `emotional` - 情感发展 (emotional development)

### App Router Structure

Next.js 14 App Router with nested layouts:

```
/                           # Homepage with child list
/children/new               # Create child
/children/[id]              # Child detail page
/children/[id]/record       # Add text record
/children/[id]/photo-record # Add photo record
/children/[id]/insights     # Analysis insights
/children/[id]/edit         # Edit child
/timeline                   # Timeline view
/insights                   # Insights overview
/profile                    # User profile
```

**API Routes**:
- `POST /api/analyze` - Analyze behavior (standalone)
- `POST /api/children/[id]/records` - Create record with auto-analysis
- `POST /api/children/[id]/record-with-image` - Create record with image
- `POST /api/upload/image` - Upload images to `/public/uploads/`
- `POST /api/import` - Import from Day One journal exports

### External API Configuration

**Environment variables** (`.env`):
- `AI_API_KEY` - API key for external AI service (optional)
- `AI_API_ENDPOINT` - API endpoint URL (optional)

If not configured, app falls back to local analyzer automatically.

**To integrate new AI providers**:
1. Update `callExternalAPI()` in `api-analyzer.ts`
2. Handle provider-specific request/response formats
3. No changes needed elsewhere - fallback system handles failures

### Styling and Theme

**Tailwind CSS** with custom brand colors:
- Brand (orange): 50-700 scale (`brand-500` = `#F97316`)
- Accent (green): 50-600 scale (`accent-500` = `#22C55E`)
- Used for developmental insights and category badges

**Component library**: Custom React components in `src/components/`
- No external UI library used
- Mobile-first responsive design
- Bottom navigation bar (`BottomTabBar.tsx`)

### Important Conventions

1. **Age calculation**: Always use `ageInMonths` for analysis (not years)
2. **Image uploads**: Store in `public/uploads/` with unique filenames
3. **Analysis storage**: Store full JSON in `Record.analysis`, parse on read
4. **Date handling**: Convert Date objects to/from ISO strings for Prisma
5. **Error handling**: API routes return `{ success: false, error }` on failure
6. **Chinese language**: UI text in Chinese, code/comments in English

### File Upload Pattern

Images stored in `public/uploads/`:
- Avatars: `public/uploads/avatars/`
- Record images: `public/uploads/records/`
- Filenames: `{timestamp}-{originalname}`
- Forms use `FormData` with `multipart/form-data`

### Psychology Analysis System

**Local rules** (`src/lib/psychology-analysis.ts`):
- Maps age ranges + categories → developmental theories
- References: Piaget, Erikson, Vygotsky, Bowlby
- Returns stage, interpretation, suggestions, milestones
- Confidence based on keyword matching strength

**AI analysis** (when configured):
- Provides deeper insights and personalized suggestions
- Includes emotional interpretation for parents
- Theory references with deep insights
- Higher confidence for nuanced behaviors
