// src/app/api/tts/merge-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// (تعديل) توحيد منطق تعيين المسار وزيادة التسجيل لتشخيص المشكلة
const setFfmpegPath = () => {
    // 1. مسار Docker/Linux القياسي
    const dockerPath = '/usr/bin/ffmpeg';
    // 2. المسار الذي يوفره ffmpeg-static (يجب أن يكون متاحًا في بيئات Next.js)
    const staticPath = ffmpegStatic || '';
    
    let finalPath = '';
    let isStaticPath = false;

    if (fs.existsSync(dockerPath)) {
        finalPath = dockerPath;
        console.log(`FFMPEG Path: Found at Docker path: ${dockerPath}`);
    } else if (staticPath) {
        finalPath = staticPath;
        isStaticPath = true;
        console.log(`FFMPEG Path: Using ffmpeg-static path: ${staticPath}`);
    } else {
        console.error("FFMPEG Path: Neither Docker path nor ffmpeg-static path is available.");
    }
    
    if (finalPath) {
        // If using the path from ffmpeg-static, ensure it has execute permissions.
        // This is often necessary in non-Docker environments or after package installations.
        if (isStaticPath && process.platform !== 'win32') { // chmod is not for windows
            try {
                fs.chmodSync(finalPath, '755');
                console.log(`FFMPEG Path: Set execute permissions on ${finalPath}`);
            } catch (err) {
                console.error(`FFMPEG Path: Failed to set execute permissions on ${finalPath}:`, err);
            }
        }

        ffmpeg.setFfmpegPath(finalPath);
        
        if (!fs.existsSync(finalPath)) {
             console.error(`FFMPEG Path Error: Configured path does not exist: ${finalPath}`);
        }
    }
}

// تنفيذ دالة تعيين المسار عند التحميل
setFfmpegPath();


export async function POST(request: NextRequest) {
    let tempDir: string | null = null;
    try {
        // --- (تعديل 1) استقبال أرقام التعريف بدلاً من الروابط ---\n
        const { jobIds } = await request.json();

        if (!Array.isArray(jobIds) || jobIds.length === 0) {
            return NextResponse.json({ error: 'Job IDs are required.' }, { status: 400 });
        }

        tempDir = path.join(os.tmpdir(), `tts-merge-${uuidv4()}`);
        await fs.promises.mkdir(tempDir, { recursive: true });

        const downloadedFiles: string[] = [];
        
        let baseUrl;
        // In production (Docker), use http://localhost for internal API calls to avoid SSL errors.
        if (process.env.NODE_ENV === 'production') {
            baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`;
        } else {
            // In development, use the original request's origin.
            baseUrl = process.env.APP_URL || new URL(request.url).origin;
        }

        // --- (تعديل 2) جلب الملفات الصوتية باستخدام أرقام التعريف ---\n
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