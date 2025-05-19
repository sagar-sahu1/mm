# Database Schema: MindMash

This document describes the Firestore database structure for MindMash, including collections, fields, and relationships.

---

## Collections

### 1. users
- **Collection:** `users`
- **Document ID:** `uid` (Firebase Auth user ID, unique)
- **Fields:**
  - `displayName`: string
  - `photoURL`: string
  - `bio`: string
  - `birthdate`: string (YYYY-MM-DD)
  - `socialLinks`: object (github, linkedin, etc.)
  - `email`: string
  - `createdAt`: timestamp
  - `updatedAt`: timestamp
  - `totalScore`: number
  - `quizzesCompleted`: number
  - `lastLoginAt`: timestamp
  - `loginHistory`: array of date strings
  - `currentStreak`: number
  - `lastStreakLoginDate`: string

### 2. quizzes
- **Collection:** `quizzes`
- **Document ID:** `quizId` (unique, UUID)
- **Fields:**
  - `topic`: string
  - `subtopic`: string
  - `difficulty`: string
  - `questions`: array of question objects
  - `config`: object (AI input)
  - `createdAt`: timestamp
  - `startedAt`: timestamp
  - `score`: number
  - `completedAt`: timestamp
  - `currentQuestionIndex`: number
  - `timeLimitMinutes`: number
  - `perQuestionTimeSeconds`: number
  - `totalTimeTaken`: number
  - `challengerName`: string
  - `additionalInstructions`: string
  - `isPublic`: boolean
  - `quizTerminationReason`: string
  - `cheatingFlags`: number
  - `userId`: string (foreign key to users.uid)

### 3. cheating_logs
- **Collection:** `cheating_logs`
- **Document ID:** auto-generated
- **Fields:**
  - `userId`: string (foreign key to users.uid)
  - `quizId`: string (foreign key to quizzes.quizId)
  - `activityType`: string (e.g., 'tab_switch', 'fullscreen_exit', 'motion_detected', 'blank_frame')
  - `timestamp`: timestamp
  - `details`: string

### 4. challenges (optional)
- **Collection:** `challenges`
- **Document ID:** `slug` (unique)
- **Fields:**
  - `topic`, `difficulty`, `numberOfQuestions`, `questions`, `challengerUid`, etc.

---

## Relationships
- **users.uid** is the primary key for users.
- **quizzes.userId** is a foreign key to users.uid.
- **cheating_logs.userId** and **cheating_logs.quizId** are foreign keys to users and quizzes.
- **challenges.challengerUid** is a foreign key to users.uid.

## Data Sync
- User profile and quiz progress are synced in real-time via Firestore listeners.
- Cheating logs are written on suspicious activity and can be queried by user or quiz.
- Quiz results and cheating logs are used for PDF export and analytics.

---
For more details, see the codebase and [architecture.md](./architecture.md). 