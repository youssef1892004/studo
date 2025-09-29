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
  job_id?: string; // <--- قم بإضافة هذا السطر
  createdAt?: string | Date; // ✅ أضف دي
  isArabic?: boolean; // (جديد) لتفعيل خاصية التشكيل
  persistentAudioUrl?: string;
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
export interface TTSCardData {
  id: string;
  voice: string;
  data: OutputData;
  text?: string;
  // --- === خصائص جديدة للشريط الزمني === ---
  audioUrl?: string;      // رابط المقطع الصوتي الخاص بهذه الفقرة
  duration?: number;      // مدة المقطع بالثواني
  isGenerating?: boolean; // لتتبع حالة توليد الصوت لهذه الفقرة
}