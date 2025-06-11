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

### important

- このプロジェクトはバイブコーディングを学ぶための学習プロジェクトです。
- 要求があるたびにプロンプトの内容を docs/chat.md ファイルに整理します。
- 文書と会話は日本語で行ってください。
- コアロジックは TDD で実装してください。
- UI は TDD で実装する必要はありませんが、リアルタイムで確認できるように画面を表示してください。
- 変更後の UI チェックは、 browsermcp で意図した変更を行えたか確認をしてください。
- 視覚的ブラウザーでの検証は、必ずスクリーンショットを撮り確認を行ってください。
  また、「意図した動作」が行えているかの確認が重要となります。動作実行前のスクリーンショットと、動作実行後のスクリーンショットを確認し、UI が「意図した動作」を反映した結果になっているかの確認をしてください。
- UI とロジックの分離を行い、適切なソースコードの長さを保つよう心がけてください。
- コミット前に必ず docs/chat.md と docs/tasks.md ファイルを更新してください。
- コミット前にプロンプトと変更内容をチュートリアル形式で@docs/tutorial.md に整理してください。
- チュートリアルにはプロンプトの目的も併せて記載してください。
- 新しいドキュメントが追加される場合、README にリンクと説明を一緒に追加してください。
- UIテスト実施の際、現在はdockerの開発サーバーを使用しています。
再起動の必要がある場合は、docker-composeコマンドで実行してください。
- テスト実行時、ブラウザーのコンソールの情報を取得してまずは解析をしてください。
- プロジェクトで使う型定義は画面間や proxy-server との連携で齟齬が出ないよう、packages の中にまとめています。ファイル内での一時的な型定義はできるだけ避け、共通の型の仕様をしてください。
- テストデータは型変換が不要なように、共通の型と同じ型でテストデータを作成してください。(なんのためのテストデータか分からなくなるためです)
  (ファイルパス: packages\types\index.ts)
- テストデータ作成時、ファイルの拡張子を.ts で作成し、ファイル内で json の形で記載と、忘れずに型の情報を設定してください。
- テストで使用するデータはファイルを作成して残してください。エラー原因のトレースや改善に使うためです。
- 「互換性のある型」を作って、テストデータ用の型を定義する実装は絶対にやめてください。実データを扱える型でテストを行ってください。
- any 型の仕様を避け、typescript の型システムの恩恵を受けられるようにしてください。
- フォールバックの実装を避け、ユーザーが解消できるエラーの提示を心がけてください。
  (エラーを隠さず、真摯にプロジェクトに向き合ってください)
- ユーザーから隠匿された、proxy-server でのフォールバックは厳禁です。
  リトライ or エラー解消のためのヒントを含めたエラー表示を行う(この際 API キーの開示はしない)ように実装してください。
- フォールバック機能、特に try{}catch{}の構文で、エラーを返さずに一時的なメッセージをフロントに返す仕様は「ガチでクソ」実装だと認識してください。
  (ユーザーがエラー解消するチャンスを奪う、という意味で最悪、ということです)
- API キーをフロントに開示するような実装は"セキュリティ上重大なインシデント"です。
- 未使用で、使用目的のない機能やコンポーネントは消去に努めてください。
- 後方互換機能は不要です。現在、TRPG を AI agent が実行するプロジェクトとして、単体で動作を行っています。
- テスト用ドキュメントは docs\TRPG_SESSION_TEST_GUIDE.md に記載されています。テスト開始時には内容を読み、そしてテスト実行時に失敗したらナレッジを集め、同じ失敗を繰り返さないようにノウハウを記載をしていってください。
- こうした方が良いのでは、という提案は率先してお願いします。同じミスを繰り返している場合、特にこうした方が同じミスを減らせる、というような提案をお願いします。
- data-testid は、率先してコンポーネントに設定してください。また、test 実施時のコンポーネント指定にはこちらを優先指定し、ない場合はコンポーネントに設定してください。
- ローカルでヘルパー関数を作って型を変換するのは、型の運用としておかしいと思います。(変換してローカルで使い捨ての型を作ってしまうと、大量に使い捨ての型ができてしまう)。
  ローカルでヘルパー関数を作り方を変換するのではなく、適切に型の運用自体を修正してください。

### most important

- """テストデータ用の型定義は絶対にしないでください。"""
- """テストデータは、本番と同じ型を使って作成してください。「有効なテストデータ=本番で使う型定義と一致した構造のデータ」です。"""
- テストデータとプロジェクトで共通使用している型が異なる場合、"""修正するべきはテストデータ"""です。修正対処を間違えず、実装を行ってください。
- フロントエンド・バックエンド共通で使用するための型定義がありますので、キャンペーン、キャラ、エネミー、イベント、キャラクター動作のためのイベントなど、プロジェクト共通で使用する型はこちらを参照する。
  (ファイルパス: packages\types\index.ts)
- フロントエンド・バックエンド共通の型定義を修正する場合、別のページで使用している場合はそのページも修正すること。
- 常に「誠実な」実装者であることを心がけてください。
  テストは成功できたことを、確実に見ること。常にユーザーが使用するデータでテストを行うこと。
- 「テストは、正常な動作で UI の動作チェックを行う」のが大事です。押下できないボタンを強制的に押下したり、結果を得るために通常利用不可なものを利用する実装はガチで最悪なのでやめてください。
