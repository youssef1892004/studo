
# Project Documentation: AI Voice Studio

This document provides a comprehensive overview of the AI Voice Studio project, including its architecture, setup instructions, and API reference.

## 1. Project Overview

AI Voice Studio is a Next.js web application that allows users to convert Arabic text into natural-sounding speech using advanced AI. It provides a studio-like environment for users to create and manage audio projects, select from a variety of voices, and generate high-quality audio files.

### Key Technologies

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **Text Editor:** Editor.js
- **Data Fetching:** GraphQL with Apollo Client
- **Authentication:** JWT-based authentication with a Hasura backend.
- **Audio Processing:** `fluent-ffmpeg` for merging audio segments.
- **File Storage:** AWS S3 (or Wasabi) for storing generated audio files.

## 2. Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- Node.js (v20 or later)
- Yarn or npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd studo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # OR
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the necessary environment variables for Hasura, AWS S3, and the TTS service.

4.  **Run the development server:**
    ```bash
    npm run dev
    # OR
    yarn dev
    ```

The application should now be running at `http://localhost:3000`.

### Available Scripts

- `dev`: Starts the development server.
- `build`: Creates a production build of the application.
- `start`: Starts the production server.
- `lint`: Runs the ESLint code linter.

## 3. Project Structure

The project follows a standard Next.js `app` directory structure.

```
/
├── public/               # Static assets (images, audio files)
├── src/
│   ├── app/              # Application routes and pages
│   │   ├── api/          # API routes (backend logic)
│   │   ├── (pages)/      # Page components for different routes (e.g., login, projects)
│   │   ├── globals.css   # Global styles
│   │   └── layout.tsx    # Root layout for the application
│   ├── components/       # Reusable React components
│   │   ├── studio/       # Components specific to the Studio page
│   │   └── ui/           # General UI components (Button, Card, etc.)
│   ├── contexts/         # React context providers (AuthContext, ThemeContext)
│   └── lib/              # Helper functions, type definitions, and client-side libraries
├── next.config.js        # Next.js configuration
└── package.json          # Project dependencies and scripts
```

## 4. Code Explanation

This section provides an overview of some of the key files and logic in the application.

### `src/app/studio/[id]/page.tsx`

This is the main page for the AI Voice Studio. It's a client-side component that handles the entire studio experience for a specific project.

- **State Management:** Uses `useState` and `useRef` to manage the project title, voices, text cards, generation status, and more.
- **Data Fetching:** On load, it fetches the project data (including text blocks) from the Hasura backend using `getProjectById` and the list of available voices from the TTS API.
- **Core Functionality:**
    - `handleGenerate`: Iterates through the text cards, calls the `/api/tts/generate-segment` endpoint for each, and then polls the `/api/tts/status/[job_id]` endpoint until the audio is ready. Once completed, it fetches the audio from `/api/tts/result/[job_id]`.
    - `handleDownloadAll`: Merges all generated audio segments into a single MP3 file by calling the `/api/tts/merge-all` endpoint.
- **Auto-saving:** Uses a `useEffect` hook with a `setTimeout` to automatically save project changes (text content and title) to the backend every 2 seconds.

### `src/contexts/AuthContext.tsx`

This context provides authentication state and functions to the entire application.

- **State:** Stores the current `user` object and an `isLoading` flag.
- **Initialization:** On mount, it checks `localStorage` for a saved user session to maintain login state across page reloads.
- **Functions:**
    - `login`: Sends a POST request to `/api/auth/token` with the user's credentials. On success, it saves the user data and JWT to `localStorage`.
    - `logout`: Clears the user data from `localStorage` and the component's state.

### `src/components/Editor.tsx`

A wrapper component for the `Editor.js` library. It's configured with basic tools like `Header`, `List`, and `Paragraph`. It's used within each "card" in the studio to allow users to write and edit the text they want to convert to speech.

### `src/lib/graphql.ts`

This file contains all the functions for interacting with the Hasura GraphQL backend. It abstracts the `fetch` logic and provides typed functions for querying and mutating data.

- `getProjectsByUserId`: Fetches all projects for a given user.
- `getProjectById`: Fetches a single project by its ID.
- `insertProject`: Creates a new project.
- `updateProject`: Updates an existing project's data (title and text blocks).
- `deleteProject`: Deletes a project.

## 5. API Reference

The backend logic is implemented as API Routes within the `src/app/api/` directory.

| Endpoint                               | Method | Description                                                                                             |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `/api/auth/token`                      | `POST` | Authenticates a user with email and password, and returns a JWT if successful.                          |
| `/api/register`                        | `POST` | Registers a new user.                                                                                   |
| `/api/project/get-records`             | `GET`  | Fetches audio records for a project and generates pre-signed URLs for playback.                         |
| `/api/project/upload-audio`            | `POST` | Uploads an audio file (as a base64 data URL) to S3/Wasabi and saves the link in Hasura.                  |
| `/api/voices`                          | `GET`  | Fetches the list of available TTS voices from the external TTS provider.                                |
| `/api/tts/create`                      | `POST` | Creates a full TTS job with multiple text blocks.                                                       |
| `/api/tts/generate-segment`            | `POST` | Creates a TTS job for a single text segment and returns the `job_id`.                                   |
| `/api/tts/status/[job_id]`             | `GET`  | Checks the status of a TTS job (`pending`, `completed`, `failed`).                                      |
| `/api/tts/result/[job_id]`             | `GET`  | Fetches the generated audio file (as a blob) for a completed job.                                       |
| `/api/tts/preview`                     | `POST` | Generates a short audio preview for a specific voice.                                                   |
| `/api/tts/merge-all`                   | `POST` | Takes a list of `job_ids`, fetches the corresponding audio files, merges them into a single MP3 using `ffmpeg`, and returns the result. |