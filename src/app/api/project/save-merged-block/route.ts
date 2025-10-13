import { NextRequest, NextResponse } from 'next/server';

const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { projectId, s3Url } = await request.json();
    if (!projectId || !s3Url) {
      return NextResponse.json({ error: 'Missing required parameters: projectId and s3Url.' }, { status: 400 });
    }

    if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
      return NextResponse.json({ error: 'Hasura environment variables are not configured.' }, { status: 500 });
    }

    // 1) تحقّق من وجود سجل لنفس project_id + block_index = 'merged_blocks'
    const existingQuery = `
      query GetMergedBlock($projectId: uuid!, $blockIndex: String!) {
        Voice_Studio_blocks(where: { project_id: { _eq: $projectId }, block_index: { _eq: $blockIndex } }, limit: 1) {
          id
          s3_url
          content
        }
      }
    `;
    const existingRes = await fetch(HASURA_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({ query: existingQuery, variables: { projectId, blockIndex: 'merged_blocks' } }),
    });
    const existingJson = await existingRes.json();
    if (existingJson.errors) {
      console.error('Hasura read error:', existingJson.errors);
    }

    const existing = existingJson?.data?.Voice_Studio_blocks?.[0] || null;

    // 2) حدّث إذا كان موجودًا، وإلا قم بإدراج سجل جديد
    const contentPayload = { label: 'merged_blocks', status: existing ? 'updated' : 'created', updated_at: new Date().toISOString() };

    if (existing?.id) {
      const updateMutation = `
        mutation UpdateMergedBlock($id: uuid!, $s3Url: String!, $content: jsonb!) {
          update_Voice_Studio_blocks_by_pk(pk_columns: { id: $id }, _set: { s3_url: $s3Url, content: $content }) {
            id
            project_id
            block_index
            s3_url
            content
          }
        }
      `;
      const updateRes = await fetch(HASURA_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        },
        body: JSON.stringify({ query: updateMutation, variables: { id: existing.id, s3Url, content: contentPayload } }),
      });
      const updateJson = await updateRes.json();
      if (updateJson.errors) {
        console.error('Hasura update error:', updateJson.errors);
        return NextResponse.json({ error: updateJson.errors[0]?.message || 'Failed to update merged_blocks.' }, { status: 500 });
      }
      return NextResponse.json({ mergedBlock: updateJson.data.update_Voice_Studio_blocks_by_pk }, { status: 200 });
    } else {
      const insertMutation = `
        mutation InsertMergedBlock($projectId: uuid!, $s3Url: String!, $content: jsonb!, $blockIndex: String!) {
          insert_Voice_Studio_blocks_one(object: { project_id: $projectId, s3_url: $s3Url, content: $content, block_index: $blockIndex }) {
            id
            project_id
            block_index
            s3_url
            content
          }
        }
      `;
      const insertRes = await fetch(HASURA_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        },
        body: JSON.stringify({ query: insertMutation, variables: { projectId, s3Url, content: contentPayload, blockIndex: 'merged_blocks' } }),
      });
      const insertJson = await insertRes.json();
      if (insertJson.errors) {
        console.error('Hasura insert error:', insertJson.errors);
        return NextResponse.json({ error: insertJson.errors[0]?.message || 'Failed to insert merged_blocks.' }, { status: 500 });
      }
      return NextResponse.json({ mergedBlock: insertJson.data.insert_Voice_Studio_blocks_one }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in save-merged-block route:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}