import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { v4 as uuidv4 } from 'uuid';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

interface TTSRequestItem {
  text: string;
  voice: string;
}

async function generateSingleSpeech(item: TTSRequestItem, apiKey: string, baseUrl: string): Promise<Buffer> {
  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: item.text,
      voice: item.voice,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate speech for: ${item.text}. Reason: ${errorText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  let tempDir: string | undefined;

  try {
    const items: TTSRequestItem[] = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.API_BASE_URL;

    if (!apiKey || !baseUrl) {
      return NextResponse.json({ error: 'API key or base URL is not configured' }, { status: 500 });
    }

    tempDir = path.join(os.tmpdir(), `tts-merge-${uuidv4()}`);
    const outputPath = path.join(tempDir, 'merged.mp3');
    const fileListPath = path.join(tempDir, 'filelist.txt');
    
    // --- DETAILED LOGGING ---
    console.log('[DEBUG] Temporary directory:', tempDir);

    await fs.mkdir(tempDir, { recursive: true });

    let fileListContent = '';
    for (const [i, item] of items.entries()) {
      if (!item.text.trim()) continue;
      try {
        const audioBuffer = await generateSingleSpeech(item, apiKey, baseUrl);
        if (audioBuffer.length > 0) {
          const filePath = path.join(tempDir, `audio-${i}.mp3`);
          await fs.writeFile(filePath, audioBuffer);
          const normalizedPath = filePath.replace(/\\/g, '/');
          fileListContent += `file '${normalizedPath}'\n`;
        } else {
          console.warn(`[WARN] Received empty audio buffer for item: ${JSON.stringify(item)}`);
        }
      } catch (err) {
        // --- DETAILED LOGGING ---
        console.error(`[DEBUG] Failed to generate speech for item: ${JSON.stringify(item)}`, err);
      }
    }

    if (!fileListContent) {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
      return NextResponse.json({ error: 'No valid audio could be generated from the provided text.' }, { status: 400 });
    }
    
    // --- DETAILED LOGGING ---
    console.log('[DEBUG] File list content:\n---\n' + fileListContent + '---');
    await fs.writeFile(fileListPath, fileListContent);
    console.log('[DEBUG] Output path:', outputPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(fileListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions('-c', 'copy')
        .on('start', (commandLine) => {
          console.log('[DEBUG] Spawning ffmpeg with command:', commandLine);
        })
        .on('stderr', (stderrLine) => {
            console.log('[DEBUG] ffmpeg stderr:', stderrLine);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('[ERROR] ffmpeg stdout:', stdout);
          console.error('[ERROR] ffmpeg stderr:', stderr);
          reject(err);
        })
        .on('end', () => {
          console.log('[DEBUG] ffmpeg processing finished.');
          resolve();
        })
        .save(outputPath);
    });

    const mergedAudioBuffer = await fs.readFile(outputPath);
    
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log('[DEBUG] Temporary directory cleaned up.');

    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');

    return new Response(mergedAudioBuffer, { headers });

  } catch (error) {
    console.error('[FATAL] Error during TTS merge process:', error);
    
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(err => {
          console.error(`[ERROR] Failed to cleanup temp directory ${tempDir} on error path:`, err);
      });
    }

    if (error instanceof SyntaxError && 'message' in error && error.message.includes('JSON')) {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
