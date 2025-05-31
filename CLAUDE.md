# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered TRPG (Tabletop Role-Playing Game) campaign management and game master assistance tool built as a monorepo using pnpm workspaces. The project helps game masters create and run TRPG campaigns with integrated AI assistance for character generation, scenario planning, and session management.

## Build and Development Commands

### Root Level Commands
```bash
# Development
pnpm dev                    # Run both frontend and proxy in parallel (using Turbo)
pnpm dev:frontend          # Run only frontend
pnpm dev:proxy            # Run only proxy server

# Build
pnpm build                 # Build all packages (using Turbo)
pnpm build:frontend       # Build only frontend
pnpm build:proxy         # Build only proxy server

# Testing
pnpm test:e2e             # Run Playwright E2E tests
pnpm test:e2e:ui          # Run Playwright tests with UI mode
pnpm test:trpg-session    # Run TRPG session functionality tests
pnpm test:ai-enhanced     # Run AI-enhanced feature tests

# Linting
pnpm lint                 # Lint all packages (using Turbo)

# Storybook
pnpm storybook           # Run Storybook development server
pnpm build-storybook     # Build Storybook static files
```

### Running a Single Test
```bash
# Run specific test file
cd apps/frontend
pnpm playwright test e2e/pages/trpg-session-page.spec.ts

# Run test with specific test name
pnpm playwright test -g "should create new campaign"

# Run test in headed mode (with browser UI)
pnpm playwright test --headed

# Run test with debugging
pnpm playwright test --debug
```

## High-Level Architecture

### Monorepo Structure
- **apps/frontend**: React 18 SPA with Material UI
  - State management: Recoil
  - Routing: React Router v7
  - Rich text editor: Slate.js for session notes
  - TRPG UI: Dice rolling, character sheets, session interface
  - Build tool: Vite
  
- **apps/proxy-server**: Express.js API server
  - AI integrations: OpenAI, Anthropic (Claude), Google (Gemini)
  - Framework: Express with TypeScript
  - Image storage: Google Cloud Storage
  - Database: Litestream
  - AI Agent framework: Mastra

- **packages/types**: Shared TypeScript type definitions for TRPG entities

### Key Architectural Patterns

1. **AI Integration Architecture**
   - Frontend makes requests to proxy server at `/api/ai-agent/*`
   - Proxy server handles API key management and provider selection
   - Multiple AI providers supported with unified interface
   - Context accumulation through "selected elements" pattern

2. **State Management Flow**
   - Global state in Recoil atoms (currentCampaignAtom, sessionStateAtom, etc.)
   - Local component state for UI interactions
   - Litestream database for campaign persistence
   - Cloud Storage for character images and base illustrations

3. **Screen Navigation Pattern**
   - Campaign creation flow: Home → Campaign Setup → Characters (PC/NPC) → World Building → Session Planning → TRPG Session
   - Developer mode toggle controls UI complexity
   - Each screen builds upon campaign context for AI assistance

4. **TRPG Session Interface Architecture**
   - Main session view with character display, chat interface, and interaction panels
   - Integrated dice rolling, skill checks, and power check mini-games
   - Real-time session state management
   - AI-driven game master assistance and NPC behavior

## Important Implementation Details

### AI Provider Configuration
- API keys stored in localStorage per provider
- Provider selection in AI Settings tab
- Test endpoint available at `/api/ai-agent/test-key`
- Custom endpoint support for self-hosted models

### Error Handling Patterns
- AI requests wrapped in try-catch with user-friendly error messages
- Loading states managed through Recoil atoms
- Snackbar notifications for user feedback
- Comprehensive error logging in proxy server

### Testing Strategy
- E2E tests using Playwright for critical TRPG workflows
- Screenshot-based visual regression tests
- AI-enhanced test scenarios for character generation and session management
- Session functionality tests for TRPG mechanics

### Deployment Configurations
- **Google Cloud Run**: Primary deployment platform
- **Google Cloud Storage**: Image and asset storage
- **Litestream**: Database with automated backups
- **Docker Compose**: Local development with Redis and Cloud Storage emulation

## Common Development Tasks

When implementing new AI features:
1. Add endpoint to `apps/proxy-server/src/routes/aiAgent.ts`
2. Add corresponding function to `apps/frontend/src/api/aiAgent.ts`
3. Create or update React hook for the feature
4. Integrate with AIChatPanel assist tab if applicable

When adding new TRPG screens:
1. Create page component in `apps/frontend/src/pages/`
2. Add route in `App.tsx`
3. Create context provider if needed
4. Add navigation item to sidebar (consider developer mode visibility)
5. Implement AI assistance integration
6. Add appropriate TRPG-specific UI components (dice, character sheets, etc.)
7. Document in `/docs/` folder

## Critical Files to Understand

### Core Architecture
- `apps/frontend/src/components/ai/AIChatPanel.tsx`: Core AI interaction component with developer mode toggle
- `apps/frontend/src/hooks/useAIChatIntegration.ts`: AI chat state management
- `apps/proxy-server/src/utils/systemPrompts.ts`: TRPG-specific AI persona definitions

### TRPG-Specific Components
- `apps/frontend/src/pages/TRPGSessionPage.tsx`: Main session interface (when implemented)
- `apps/frontend/src/components/trpg-session/SessionInterface.tsx`: Core session UI
- `apps/frontend/src/components/trpg-session/DiceRollUI.tsx`: Dice rolling mechanics
- `apps/frontend/src/components/characters/CharacterForm.tsx`: TRPG character sheet management

### Data Models
- `packages/types/index.ts`: TRPG entity type definitions (TRPGCampaign, TRPGCharacter, etc.)
- `apps/frontend/src/store/atoms.ts`: Campaign and session state management

### Key Architectural Changes from Novel Tool
- Campaign-focused instead of novel-focused data structures
- PC/NPC character distinction with full character sheets
- Session-based timeline instead of chronological narrative
- Developer mode UI visibility controls
- Real-time session state management for live play