# Firebase Studio - MindMash Quiz App

This is a Next.js starter project for MindMash, an AI-powered quiz application, developed in Firebase Studio.

## Features

*   AI-powered quiz generation on any topic.
*   User authentication (Email/Password, Google Sign-In).
*   Quiz history and performance tracking.
*   User profiles with customizable details and social links.
*   Challenge friends with shareable quiz links.
*   Leaderboard to see top players.
*   Responsive design with light/dark/system themes and accessibility options.
*   PDF export of quiz results.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
*   **State Management:** React Context API (for Auth and Quiz state)
*   **Backend & Auth:** Firebase (Authentication, Firestore, Storage)
*   **AI:** Google Gemini API via Genkit
*   **PDF Generation:** jsPDF
*   **UI Components:** ShadCN UI, Lucide React Icons

## Getting Started & Running Locally

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   **Node.js:** Version 18.x or later (includes npm). Download from [nodejs.org](https://nodejs.org/).
*   **VS Code (Recommended):** Download from [code.visualstudio.com](https://code.visualstudio.com/).
*   **Firebase Project:**
    *   A Firebase project set up. You can create one at [Firebase Console](https://console.firebase.google.com/).
    *   Authentication (Email/Password and Google Sign-In methods) enabled.
    *   Firestore Database created (start in test mode for development).
    *   Firebase Storage enabled.
*   **Google Cloud Project:**
    *   Your Firebase project is also a Google Cloud project. Ensure the **Gemini API (Vertex AI API or Generative Language API)** is enabled for this project.
    *   Authenticate your local environment with Google Cloud for Application Default Credentials (used by Genkit):
        ```bash
        gcloud auth application-default login
        ```

### Setup Instructions

1.  **Clone the Repository:**
    ```bash
    # If you have access to the repository
    # git clone <repository-url>
    # cd <repository-name>
    ```
    If you are working within Firebase Studio, the project files are already present.

2.  **Open in VS Code:**
    Open the project folder in Visual Studio Code.

3.  **Install Dependencies:**
    Open the integrated terminal in VS Code (View > Terminal) and run:
    ```bash
    npm install
    ```
    (or `yarn install` if you use Yarn).

4.  **Configure Environment Variables:**
    *   In the root of your project, create a file named `.env.local` (if it doesn't already exist).
    *   Add your Firebase project's configuration details. You can find these in your Firebase project settings (Project Overview > Project settings > General tab, scroll down to "Your apps" and select your web app).
        ```plaintext
        # .env.local

        # Firebase Configuration
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
        NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID

        # Genkit / Google AI Configuration
        # Ensure the Gemini API is enabled in your Google Cloud Project.
        # The @genkit-ai/googleai plugin typically uses Application Default Credentials
        # when run locally (after `gcloud auth application-default login`).
        # If you have a specific API key for Gemini you wish to use directly with Genkit,
        # you might configure it here if your Genkit setup uses it, e.g., GOOGLE_API_KEY=YOUR_GEMINI_OR_VERTEX_API_KEY
        # However, the current Genkit setup in src/ai/genkit.ts uses googleAI() which should leverage ADC.
        ```
    *   Replace `YOUR_FIREBASE_...` placeholders with your actual Firebase project credentials.

5.  **Firebase Console Configuration Details:**
    *   **Authentication:**
        *   In the Firebase Console, navigate to "Authentication".
        *   Under the "Sign-in method" tab, ensure "Email/Password" and "Google" providers are enabled. For Google, select the support email.
        *   Under the "Settings" tab > "Authorized domains", ensure `localhost` is listed. Firebase usually adds this by default.
    *   **Firestore Database:**
        *   Go to "Firestore Database".
        *   If you haven't created a database, do so. For development, you can start in **test mode**, which allows open read/write access.
            *Example Test Mode Rules (NOT FOR PRODUCTION):*
            ```firestore
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                match /{document=**} {
                  allow read, write: if true; // WARNING: Open access
                }
              }
            }
            ```
            For production, you **must** implement secure Firestore rules to protect your data.
    *   **Storage:**
        *   Go to "Storage".
        *   Click "Get started" if you haven't set it up.
        *   The default storage rules are often restrictive. For development, you might adjust them to allow reads/writes after authentication. A common starting point for authenticated users:
            ```storage
            rules_version = '2';
            service firebase.storage {
              match /b/{bucket}/o {
                match /{allPaths=**} {
                  allow read, write: if request.auth != null;
                }
              }
            }
            ```
            Secure these rules properly for production.

6.  **Run the Next.js Development Server:**
    In your VS Code terminal, start the application:
    ```bash
    npm run dev
    ```
    This command (from `package.json`) usually starts the app on port `9002`.

7.  **Access the Application:**
    Open your web browser and navigate to `http://localhost:9002`.

8.  **(Optional) Run Genkit Development Server:**
    If you are actively developing or debugging Genkit AI flows, you can run the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    Or, for automatic reloading on changes:
    ```bash
    npm run genkit:watch
    ```
    This allows you to inspect flows in the Genkit developer UI, typically available at `http://localhost:4000`.

You should now be able to run and test the MindMash application locally. Remember to replace placeholder API keys and configure Firebase security rules appropriately before deploying to production.