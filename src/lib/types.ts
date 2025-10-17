
import { OutputData } from "@editorjs/editorjs";

export interface Voice {
  name: string;
  voiceId: string;
  gender: 'Male' | 'Female' | 'Not specified';
  languageName: string;
  languageCode: string;
  countryName: string;
  countryCode: string;
  characterName: string;
  provider?: string;
  isPro?: boolean;
}

// Represents a single editor card/block in the studio UI
export interface StudioBlock {
  // Backend fields from Voice_Studio_blocks
  id: string;
  project_id: string;
  block_index: string; // Changed to string for database compatibility
  content: OutputData;
  s3_url?: string;
  created_at: string;
  
  
  // Frontend-only state
  voice: string;
  audioUrl?: string;      // Temporary URL for client-side playback
  duration?: number;
  isGenerating?: boolean;
  job_id?: string;
  isArabic?: boolean;
  trimStart?: number;
  trimEnd?: number;
  // Require explicit user selection before generation
  voiceSelected?: boolean;
}

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

export interface Project {
  id: string;
  name: string;
  description: string;
  crated_at: string;
  user_id: string;
  blocks_json?: any;
}
