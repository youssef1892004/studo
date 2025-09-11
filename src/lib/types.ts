// File path: src/lib/types.ts
// Reverted to the simpler version before the timeline feature

export interface Voice {
  gender: string;
  language: string;
  name: string;
}

export interface TTSCardData {
  id: string;
  text: string;
  voice: string;
}

// This is the type expected by the merge API route
export interface TTSRequestItem {
    id: string;
    text: string;
    voice: string;
}


// User and Auth types remain as they are correct
export interface User {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
}

export interface HasuraUser {
    id: string;
    displayName: string;
    email: string;
    passwordHash: string;
    roles: { role: string }[];
}

export interface AudioResult {
  id: string;
  text: string;
  voice: string;
  createdAt: string;
  audioUrl: string;
}