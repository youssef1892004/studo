import { OutputData } from "@editorjs/editorjs";

export interface Voice {
  name: string; // المعرف الفريد مثل "ar-SA-HamedNeural"
  gender: 'Male' | 'Female' | 'Not specified';
  languageName: string; // اسم اللغة الكامل مثل "Arabic"
  languageCode: string; // رمز اللغة مثل "ar"
  countryName: string; // اسم البلد الكامل مثل "السعودية"
  countryCode: string; // رمز البلد مثل "SA"
  characterName: string; // اسم الشخصية الواضح مثل "Hamed"
}

export interface TTSCardData {
  id: string;
  voice: string;
  data: OutputData;
  text?: string;
  audioUrl?: string;
  duration?: number;
  isGenerating?: boolean;
  job_id?: string;
  createdAt?: string | Date;
  isArabic?: boolean;
  persistentAudioUrl?: string;
  trimStart?: number;
  trimEnd?: number;
}

export interface TTSRequestItem {
  id: string;
  text: string;
  voice: string;
}

export interface Segment {
  id: string;
  duration: number;
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