import { NextRequest, NextResponse } from 'next/server';

// --- Hasura Configuration for upserting single project record ---
const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET!;

async function getAccessToken() {
    if (!process.env.TTS_API_BASE_URL || !process.env.TTS_API_USERNAME || !process.env.TTS_API_PASSWORD) {
        throw new Error("TTS Service environment variables are not configured in .env.local");
    }
    const response = await fetch(`${process.env.TTS_API_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            username: process.env.TTS_API_USERNAME,
            password: process.env.TTS_API_PASSWORD,
        }),
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error('Could not validate credentials with TTS service');
    }
    const data = await response.json();
    return data.access_token;
}

// Next.js 15 typed routes expect params to be a Promise in the context
export async function GET(request: NextRequest, context: { params: Promise<{ job_id: string }> }) {
    const { job_id } = await context.params;
    if (!job_id) {
        return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    try {
        const token = await getAccessToken();
        const origin = new URL(request.url).origin;
        const urlObj = new URL(request.url);
        const projectId = urlObj.searchParams.get('projectId');
        
        // --- Fetch JSON result (contains result_url and block_urls) ---
        let result_url: string | null = null;
        let block_urls: string[] = [];
        try {
            const jsonResultResponse = await fetch(`${process.env.TTS_API_BASE_URL}/result/${job_id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
            });
            if (jsonResultResponse.ok) {
                const jsonData = await jsonResultResponse.json();
                result_url = jsonData.result_url || null;
                block_urls = Array.isArray(jsonData.block_urls) ? jsonData.block_urls : [];
            }
        } catch (e) {
            // Non-blocking: continue to return audio even if JSON fetch fails
            console.warn('Failed to fetch JSON result for job:', job_id, e);
        }
        
        // --- Upsert single record per project_id if provided ---
        if (projectId && HASURA_GRAPHQL_URL && HASURA_ADMIN_SECRET) {
            try {
                // 1) Read existing record for this project (block_index = 'record')
                const existingQuery = `query GetProjectRecord($projectId: uuid!) {
                  Voice_Studio_blocks(where: { project_id: { _eq: $projectId }, block_index: { _eq: "record" } }, limit: 1) {
                    id
                    content
                    created_at
                  }
                }`;
                const existingRes = await fetch(HASURA_GRAPHQL_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                    },
                    body: JSON.stringify({ query: existingQuery, variables: { projectId } }),
                });
                const existingData = await existingRes.json();
                if (existingData.errors) {
                    console.error('Hasura read error:', existingData.errors);
                }

                const existing = existingData?.data?.Voice_Studio_blocks?.[0] || null;
                // Merge block_urls (avoid duplicates). If none returned, keep existing.
                let mergedBlockUrls: string[] = [];
                try {
                    const prevContent = existing?.content;
                    const prevObj = typeof prevContent === 'string' ? JSON.parse(prevContent) : prevContent;
                    const prevUrls: string[] = Array.isArray(prevObj?.block_urls) ? prevObj.block_urls : [];
                    const incomingUrls: string[] = Array.isArray(block_urls) ? block_urls : [];
                    mergedBlockUrls = Array.from(new Set([ ...prevUrls, ...incomingUrls ]));
                } catch (_) {
                    mergedBlockUrls = Array.isArray(block_urls) ? Array.from(new Set(block_urls)) : [];
                }
                
                const contentPayload = JSON.stringify({
                    result_url,
                    block_urls: mergedBlockUrls,
                    updated_at: new Date().toISOString(),
                });

                if (existing?.id) {
                    // 2) Update existing
                    const updateMutation = `mutation UpdateProjectRecord($id: uuid!, $content: jsonb!) {
                      update_Voice_Studio_blocks_by_pk(pk_columns: { id: $id }, _set: { content: $content }) { id }
                    }`;
                    const updateRes = await fetch(HASURA_GRAPHQL_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                        },
                        body: JSON.stringify({ query: updateMutation, variables: { id: existing.id, content: contentPayload } }),
                    });
                    const updateData = await updateRes.json();
                    if (updateData.errors) {
                        console.error('Hasura update error:', updateData.errors);
                    }
                } else {
                    // 3) Insert new
                    const insertMutation = `mutation InsertProjectRecord($projectId: uuid!, $content: jsonb!) {
                      insert_Voice_Studio_blocks_one(object: { project_id: $projectId, block_index: "record", content: $content }) { id }
                    }`;
                    const insertRes = await fetch(HASURA_GRAPHQL_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
                        },
                        body: JSON.stringify({ query: insertMutation, variables: { projectId, content: contentPayload } }),
                    });
                    const insertData = await insertRes.json();
                    if (insertData.errors) {
                        console.error('Hasura insert error:', insertData.errors);
                    }
                }
            } catch (dbErr) {
                console.error('Upsert project record failed:', dbErr);
            }
        }
        
        // --- === جلب الملف الصوتي مباشرة === ---
        const audioResponse = await fetch(`${process.env.TTS_API_BASE_URL}/result/${job_id}/audio`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!audioResponse.ok) {
            const errorData = await audioResponse.json();
            return NextResponse.json({ error: errorData.detail || 'Failed to fetch audio file' }, { status: audioResponse.status });
        }
        
        // --- === إرجاع الملف الصوتي للمتصفح === ---
        const audioBlob = await audioResponse.blob();
        return new NextResponse(audioBlob, {
            status: 200,
            headers: { 'Content-Type': 'audio/mpeg' },
        });

    } catch (error: any) {
        console.error("Error in /api/tts/result route:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}