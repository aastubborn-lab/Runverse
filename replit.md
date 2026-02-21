# Runverse

## Overview

Runverse is a mobile-first running companion app built with **Expo (React Native)** on the frontend and an **Express.js** backend server. The app allows users to track runs, find running partners, participate in challenges, view leaderboards, and share social feed posts. It features onboarding flow, GPS run tracking, user profiles with XP/leveling, and a gamified experience with badges and challenges.

The project uses a monorepo-style structure where the Expo mobile app and Express server coexist, with a shared schema layer between them.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: `expo-router` v6 with file-based routing and typed routes enabled
- **Navigation Structure**: Tab-based layout under `app/(main)/` with 5 tabs: Home, Feed, Run, Leaderboard, Profile. Onboarding is a separate top-level route.
- **State Management**: `@tanstack/react-query` for server state; local data stored via `AsyncStorage` through a `lib/storage.ts` abstraction layer
- **Fonts**: Inter font family (400, 500, 600, 700 weights) loaded via `@expo-google-fonts/inter`
- **UI Libraries**: `react-native-reanimated` for animations, `expo-linear-gradient` for gradients, `expo-haptics` for haptic feedback, `expo-blur` and `expo-glass-effect` for visual effects
- **Styling**: Dark theme by default using a centralized `constants/colors.ts` color palette (dark navy background with teal/green primary color `#00D4AA`)
- **Error Handling**: Class-based `ErrorBoundary` component wrapping the entire app
- **Platform Support**: Primarily iOS and Android (tablet support disabled on iOS). Web support exists but is secondary.

### Data Storage (Client-Side)

- **Primary local storage**: `@react-native-async-storage/async-storage` with structured keys for user profiles, runs, feed posts, challenges, partners, workouts, and onboarding state
- **Data Models**: Defined as TypeScript interfaces in `lib/storage.ts` — includes `UserProfile`, `RunRecord`, `FeedPost`, `Challenge`, `Partner`, `Badge`, `Workout`, `LeaderboardEntry`
- **ID Generation**: Uses `expo-crypto` for generating UUIDs on the client side

### Backend (Express.js)

- **Runtime**: Node.js with TypeScript, compiled via `tsx` in dev and `esbuild` for production
- **Server**: Express v5 with HTTP server, configured with CORS for Replit domains and localhost
- **API Pattern**: Routes registered via `server/routes.ts` with `/api` prefix convention (currently minimal — mostly scaffolding)
- **Storage Layer**: Abstracted via `IStorage` interface in `server/storage.ts`, currently using in-memory `MemStorage` (Map-based). Designed to be swapped with database-backed implementation.
- **Database Schema**: Drizzle ORM with PostgreSQL dialect. Schema defined in `shared/schema.ts` — currently only a `users` table (id, username, password). Uses `drizzle-zod` for validation schema generation.
- **Static Serving**: Production mode serves a static build of the Expo web app; has a landing page template for when no static build exists

### Shared Layer

- **`shared/schema.ts`**: Drizzle ORM schema definitions shared between frontend and backend. Contains table definitions, Zod validation schemas, and TypeScript types.

### Build & Deployment

- **Development**: Two processes run in parallel — Expo dev server for the mobile app and Express server for the API
- **Production Build**: Expo static web build via custom `scripts/build.js`, Express server bundled via esbuild
- **Database Migrations**: Drizzle Kit configured to output migrations to `./migrations/` directory; `db:push` command for schema pushing

### Key Design Decisions

1. **Local-first data**: Most app data (runs, profile, feed) is stored client-side in AsyncStorage rather than requiring server round-trips. This enables offline usage and fast UI but means data doesn't sync across devices yet.

2. **In-memory server storage**: The backend uses `MemStorage` as a placeholder. The `IStorage` interface is designed for easy swap to PostgreSQL via Drizzle ORM when ready.

3. **Monorepo structure**: Frontend and backend share the same repository and `shared/` directory, simplifying type sharing but requiring careful dependency management.

4. **Tab-based navigation**: Five main tabs provide the core app experience, with onboarding as a gated entry flow stored via AsyncStorage flag.

## External Dependencies

- **PostgreSQL**: Database configured via `DATABASE_URL` environment variable, schema managed by Drizzle ORM. Currently the server uses in-memory storage but is set up to migrate to Postgres.
- **GitHub API**: Integration via `@octokit/rest` through Replit's GitHub connector (`server/github.ts`). Used for repository management scripts (fetching repos, issues, file trees for the Runverse project on GitHub).
- **Replit Infrastructure**: CORS configuration, domain handling, and GitHub connector authentication all rely on Replit environment variables (`REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `REPLIT_CONNECTORS_HOSTNAME`, etc.)
- **Expo Services**: Splash screen, fonts, image picking, location services, and other native capabilities via Expo SDK modules
- **Google Fonts**: Inter font family loaded via `@expo-google-fonts/inter`