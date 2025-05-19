# Project Architecture: MindMash

This document describes the structure of the MindMash codebase and the purpose of each major directory and file.

## Root
- **/public/**: Static assets (favicon, icons, manifest, etc.)
- **/docs/**: Project documentation (architecture, database schema, etc.)
- **/src/**: All application source code
- **/package.json, README.md, etc.**: Project config and docs

## /src
- **/app/**: Next.js App Router pages and API routes
  - **/app/quiz/[quizId]/**: Quiz taking page (proctoring, TTS, etc.)
  - **/app/contact/**: Contact page
  - **/app/api/**: API routes (if any)
  - **/app/results/[quizId]/**: Results page
  - ...other pages (about, dashboard, etc.)
- **/components/**: Reusable UI and logic components
  - **/components/layout/**: Header, Footer, SettingsPanel, etc.
  - **/components/quiz/**: QuizDisplay, MotionDetector, ResultDisplay, etc.
  - **/components/ui/**: Button, Input, Card, etc. (design system)
- **/contexts/**: React context providers (Auth, Quiz, Theme, etc.)
- **/hooks/**: Custom React hooks (e.g., use-local-storage, use-toast)
- **/lib/**: Utility functions (e.g., Firestore utils, TTS helpers)
- **/providers/**: App-wide providers (ThemeProvider, AuthProvider, etc.)
- **/config/**: Site config, constants
- **/types/**: TypeScript types and interfaces (Quiz, User, etc.)
- **/ai/**: AI flows (e.g., generate quiz questions, explanations)

## /public
- **favicon.ico**: M² favicon
- **icon-512.png, icon-192.png**: PWA icons
- **manifest.json**: PWA manifest
- **scholar-hat.svg**: Logo asset

## /docs
- **architecture.md**: This file
- **database-schema.md**: Database structure and relationships

## Key Patterns
- **App Router**: Uses Next.js 15 App Router for routing and layouts
- **Component-Driven**: UI is built from small, reusable components
- **Context Providers**: State management via React context (auth, quiz, theme)
- **Hooks**: Custom hooks for logic reuse
- **Proctoring**: Client-side webcam, screenshot prevention, and cheating log
- **Accessibility**: TTS, keyboard navigation, high contrast

---
For more details, see the codebase and [database-schema.md](./database-schema.md). 