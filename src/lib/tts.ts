// src/lib/tts.ts (Modified uploadAudioSegment function)
import { Voice } from './types';

// A robust function to get the correct API path
export const getApiUrl = (path: string) => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://ghaymah.systems')
    : 'http://localhost:3000';

  if (typeof window === 'undefined') {
    // We are on the server, so we need an absolute URL
    return `${baseUrl}${path}`;
  }
  // We are on the client, so a relative URL is fine
  return path;
};

export async function fetchVoices(signal?: AbortSignal): Promise<Voice[]> {
  try {
    const response = await fetch(getApiUrl('/api/voices'), { cache: 'no-store', signal });
    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }
    return response.json();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return [];
    }
    throw err;
  }
}

export async function generateSpeech(text: string, voice: string): Promise<Blob> {
  const response = await fetch(getApiUrl('/api/tts'), {
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

export async function uploadAudioSegment(audioBlob: Blob, projectId: string): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read blob as data URL.'));
    };
    reader.onerror = () => reject(new Error('Error reading blob.'));
    reader.readAsDataURL(audioBlob);
  });
  
  const response = await fetch(getApiUrl('/api/project/upload-audio'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, projectId }),
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload audio segment to S3.');
  }

  const { persistentAudioUrl } = await response.json();
  return persistentAudioUrl;
}