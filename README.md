# MindMash

MindMash is a modern, accessible, and responsive quiz platform built with Next.js, React, and Tailwind CSS. It features text-to-speech, proctored quizzes (with webcam and screenshot prevention), a beautiful UI, and is installable as a Progressive Web App (PWA).

## 🚀 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** React 18, Tailwind CSS
- **PWA:** next-pwa, manifest, offline support
- **Accessibility:** Text-to-Speech, keyboard navigation, high contrast mode
- **Other:** Firebase (for auth/data), Lucide icons, modern hooks & context

---

## 🖥️ How to Run Locally

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/mindmash.git
   cd mindmash
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local` and fill in your Firebase or other secrets as needed.

4. **Run the development server:**
   ```sh
   npm run dev
   ```
   - Open [http://localhost:9002](http://localhost:9002) in your browser.

5. **Enjoy!**
   - The app is fully responsive and works on all devices.
   - Try out the quiz, text-to-speech, and install as a PWA!

---

## 🌍 How to Deploy on Vercel (Free)

1. **Push your code to GitHub:**
   ```sh
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/mindmash.git
   git push -u origin main
   ```

2. **Go to [vercel.com](https://vercel.com/) and sign up (free)**
   - Use your GitHub account for easy integration.

3. **Import your MindMash repo**
   - Click "New Project" and select your repo.
   - Vercel auto-detects Next.js. Click "Deploy".

4. **Wait for the build to finish**
   - You'll get a free URL like `https://mindmash.vercel.app`.
   - Open it on any device/browser. Install as a PWA!

5. **(Optional) Add a custom domain**
   - You can use a free domain from [Freenom](https://www.freenom.com/) or add your own.

---

## ✨ Features
- **Responsive:** Looks great on mobile, tablet, and desktop.
- **PWA:** Installable, offline-ready, fast.
- **Text-to-Speech:** Reads questions and answers aloud for accessibility.
- **Proctored Quizzes:**
  - **Webcam proctoring:** Detects if the camera is blocked or user leaves the frame (human-friendly, not aggressive).
  - **Screenshot prevention:** Blocks PrintScreen and common screenshot shortcuts.
  - **Time limits and cheating flags.**
- **PDF Export:** Download quiz results as a PDF with user ID, quiz info, answers, and suspicious activity log.
- **Modern UI:** Beautiful, engaging, and easy to use.
- **Easy Deployment:** One-click deploy to Vercel.
- **New M² Favicon:** Mathematical-style favicon for MindMash.
- **Improved Desktop Footer:** Footer is now perfectly aligned and spaced for large screens.
- **[Project Architecture](./docs/architecture.md):** Deep dive into the project structure.
- **[Database Schema](./docs/database-schema.md):** Details on all stored data, tables, and relationships.

---

## 🧑‍💻 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---
