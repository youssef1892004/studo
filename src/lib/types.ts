import { OutputData } from "@editorjs/editorjs";

export interface Voice {
  gender: string;
  language: string;
  name: string;
}

// كل بطاقة ستحتوي على بيانات المحرر الخاصة بها
export interface TTSCardData {
  id: string;
  voice: string;
  data: OutputData; // بيانات من Editor.js
  text?: string;
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