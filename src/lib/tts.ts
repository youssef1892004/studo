// src/lib/tts.ts (Modified uploadAudioSegment function)
import { Voice } from './types';

export async function fetchVoices(signal?: AbortSignal): Promise<Voice[]> {
  try {
    const response = await fetch('/api/voices', { cache: 'no-store', signal });
    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }
    return response.json();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // Navigation or component unmount aborted the request; return empty list silently.
      return [];
    }
    throw err;
  }
}

export async function generateSpeech(text: string, voice: string): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to generate speech');
  }

  return response.blob();
}
// [MODIFIED] وظيفة تحديث لتحميل الصوت إلى S3 عبر مسار API جديد
export async function uploadAudioSegment(audioBlob: Blob, projectId: string): Promise<string> {
  console.log(`Converting audio blob to data URL for project: ${projectId}`);
  
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob as data URL.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Error reading blob.'));
    };
    reader.readAsDataURL(audioBlob);
  });
  
  // استدعاء مسار API الجديد للرفع إلى S3 وحفظ الرابط في Hasura
  const response = await fetch('/api/project/upload-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, projectId }),
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload audio segment to S3.');
  }

  const { persistentAudioUrl } = await response.json();
  return persistentAudioUrl; // إرجاع رابط S3 الدائم
}