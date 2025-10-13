// src/lib/tts.ts (Modified uploadAudioSegment function)
import { Voice } from './types';

// A robust function to get the correct API path
const getApiUrl = (path: string) => {
  // For server-side rendering or if an absolute URL is explicitly defined, use it.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
  }
  // For client-side rendering, relative paths are always safe and correct.
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