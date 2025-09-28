// src/app/api/tts/merge-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Set ffmpeg path dynamically to support both local and Docker environments
if (fs.existsSync('/usr/bin/ffmpeg')) {
    // In a Docker container where ffmpeg is installed via a package manager
    ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
} else if (ffmpegStatic) {
    // In a local environment using the ffmpeg-static package
    ffmpeg.setFfmpegPath(ffmpegStatic.path);
}

export async function POST(request: NextRequest) {
    let tempDir: string | null = null;
    try {
        // --- (تعديل 1) استقبال أرقام التعريف بدلاً من الروابط ---
        const { jobIds } = await request.json();

        if (!Array.isArray(jobIds) || jobIds.length === 0) {
            return NextResponse.json({ error: 'Job IDs are required.' }, { status: 400 });
        }

        tempDir = path.join(os.tmpdir(), `tts-merge-${uuidv4()}`);
        await fs.promises.mkdir(tempDir, { recursive: true });

        const downloadedFiles: string[] = [];
        const baseUrl = process.env.APP_URL || new URL(request.url).origin;

        // --- (تعديل 2) جلب الملفات الصوتية باستخدام أرقام التعريف ---
        for (let i = 0; i < jobIds.length; i++) {
            const jobId = jobIds[i];
            const audioResultUrl = `${baseUrl}/api/tts/result/${jobId}`;
            
            console.log(`Fetching audio for job ID: ${jobId} from ${audioResultUrl}`);
            const response = await fetch(audioResultUrl);
            
            if (!response.ok) {
                console.error(`Failed to fetch audio for job ID ${jobId}. Status: ${response.status}`);
                continue;
            }
            const buffer = await response.arrayBuffer();
            const filePath = path.join(tempDir, `segment-${i}.mp3`);
            await fs.promises.writeFile(filePath, Buffer.from(buffer));
            downloadedFiles.push(filePath);
        }
        
        if (downloadedFiles.length === 0) {
            return NextResponse.json({ error: 'Could not download any audio files to merge.' }, { status: 500 });
        }
        
        const mergedFilePath = path.join(tempDir, 'merged.mp3');
        const fileListPath = path.join(tempDir, 'filelist.txt');
        
        const fileListContent = downloadedFiles.map(file => `file '${file}'`).join('\n');
        await fs.promises.writeFile(fileListPath, fileListContent);

        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input(fileListPath)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions('-c copy')
                .save(mergedFilePath)
                .on('error', (err) => {
                    console.error('FFMPEG Error:', err.message);
                    reject(new Error(`FFMPEG failed: ${err.message}`));
                })
                .on('end', () => {
                    console.log('FFMPEG merge finished successfully.');
                    resolve();
                });
        });

        if (!fs.existsSync(mergedFilePath)) {
            throw new Error('Merged file was not created by ffmpeg. The process likely failed.');
        }

        const mergedFileBuffer = await fs.promises.readFile(mergedFilePath);
        
        return new NextResponse(new Uint8Array(mergedFileBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'attachment; filename="project_audio.mp3"',
            },
        });

    } catch (error: any) {
        console.error('Error in merge-all API route:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred during audio merge.' }, { status: 500 });
    } finally {
        if (tempDir) {
            await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(err => {
                console.error(`Failed to clean up temp directory ${tempDir}:`, err);
            });
        }
    }
}