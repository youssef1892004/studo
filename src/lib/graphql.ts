// src/lib/graphql.ts
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { Project, StudioBlock } from "./types";

const HASURA_GRAPHQL_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// محتوى البلوك قد يكون نصًا عاديًا (مثل "السلام عليكم") أو JSON لسجل EditorJS.
// هذه الدالة تُعيده بصيغة OutputData آمنة دائمًا.
function normalizeBlockContent(raw: any) {
  if (!raw) {
    return { blocks: [] };
  }
  if (typeof raw === 'object') {
    return raw;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_) {
      const text = raw;
      return {
        time: Date.now(),
        blocks: [
          { id: 'plain-text', type: 'paragraph', data: { text } }
        ],
        version: '2.28.2'
      };
    }
  }
  return { blocks: [] };
}

async function fetchGraphQL<T>(query: string, variables: Record<string, any>): Promise<GraphQLResponse<T>> {
  if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
    throw new Error("Required Hasura environment variables (NEXT_PUBLIC_HASURA_GRAPHQL_URL, NEXT_PUBLIC_HASURA_ADMIN_SECRET) are not set. Please check your environment variable configuration (.env.local for local development, or your hosting provider settings for production).");
  }
  
  const response = await fetch(HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}



// --- Project Functions ---

export const getProjectsByUserId = async (userId: string): Promise<Project[]> => {
  const query = `
    query GetProjects($userId: uuid!) {
      Voice_Studio_projects(where: {user_id: {_eq: $userId}}, order_by: {crated_at: desc}) {
        id
        name
        description
        crated_at
        user_id
      }
    }
  `;
  const response = await fetchGraphQL<{ Voice_Studio_projects: Project[] }>(query, { userId });
  if (response.errors) throw new Error(response.errors[0].message);
  return response.data?.Voice_Studio_projects || [];
};

export const insertProject = async (userId: string, name: string, description: string): Promise<Project> => {
    const mutation = `
      mutation InsertProjects($description: String, $name: String, $user_id: uuid!, $crated_at: timestamptz!) {
        insert_Voice_Studio_projects(objects: {description: $description, name: $name, user_id: $user_id, crated_at: $crated_at}) {
          returning {
            id
            name
            description
            crated_at
            user_id
          }
        }
      }
    `;
    const variables = {
      user_id: userId,
      name: name,
      description: description,
      crated_at: new Date().toISOString(),
    };
    const response = await fetchGraphQL<{ insert_Voice_Studio_projects: { returning: Project[] } }>(mutation, variables);
    if (response.errors) throw new Error(response.errors[0].message);
    return response.data!.insert_Voice_Studio_projects.returning[0];
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
    const query = `
      query GetProjectById($id: uuid!) {
        Voice_Studio_projects_by_pk(id: $id) {
          id
          name
          description
          crated_at
          user_id
        }
      }
    `;
    const response = await fetchGraphQL<{ Voice_Studio_projects_by_pk: Project }>(query, { id: projectId });
    if (response.errors) throw new Error(response.errors[0].message);
    return response.data?.Voice_Studio_projects_by_pk || null;
}

export const updateProject = async (projectId: string, name: string, description: string) => {
    const mutation = `
        mutation UpdateProject($id: uuid!, $name: String, $description: String) {
            update_Voice_Studio_projects_by_pk(pk_columns: {id: $id}, _set: {name: $name, description: $description}) {
                id
            }
        }
    `;
    const variables = { 
        id: projectId, 
        name: name,
        description: description,
    };
    const response = await fetchGraphQL(mutation, variables);
    if (response.errors) throw new Error(response.errors[0].message);
    return response.data;
}

export const deleteProject = async (projectId: string): Promise<{ id: string }> => {
    const mutation = `
        mutation DeleteProject($id: uuid!) {
            delete_Voice_Studio_projects_by_pk(id: $id) {
                id
            }
        }
    `;
    const variables = { id: projectId };
    const response = await fetchGraphQL<{ delete_Voice_Studio_projects_by_pk: { id: string } }>(mutation, variables);
    if (response.errors) throw new Error(response.errors[0].message);
    if (!response.data?.delete_Voice_Studio_projects_by_pk) throw new Error("Project not found or could not be deleted.");
    return response.data.delete_Voice_Studio_projects_by_pk;
};

// --- Block Functions ---

export const getAllBlocks = async (): Promise<StudioBlock[]> => {
  const query = `
    query GetBlocks {
      Voice_Studio_blocks(order_by: { block_index: asc }) {
        id
        project_id
        block_index
        content
        s3_url
        created_at
      }
    }
  `;

  try {
    const response = await fetchGraphQL<{ Voice_Studio_blocks: any[] }>(query, {});
    
    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      throw new Error(response.errors[0]?.message || 'Unknown GraphQL error');
    }

    if (!response.data) {
      throw new Error('No data received from GraphQL');
    }

    return response.data.Voice_Studio_blocks.map((block: any) => ({
      ...block,
      content: normalizeBlockContent(block.content),
    }));
  } catch (error) {
    console.error('Error fetching all blocks:', error);
    throw error;
  }
};

export const getBlocksByProjectId = async (projectId: string): Promise<StudioBlock[]> => {
  const query = `
    query GetBlocks($projectId: uuid!) {
      Voice_Studio_blocks(where: { project_id: { _eq: $projectId } }, order_by: { block_index: asc }) {
        id
        project_id
        block_index
        content
        s3_url
        created_at
      }
    }
  `;

  try {
    const response = await fetchGraphQL<{ Voice_Studio_blocks: any[] }>(query, { projectId });
    
    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      throw new Error(response.errors[0]?.message || 'Unknown GraphQL error');
    }

    if (!response.data) {
      throw new Error('No data received from GraphQL');
    }

    return response.data.Voice_Studio_blocks.map((block: any) => ({
      ...block,
      content: normalizeBlockContent(block.content),
    }));
  } catch (error) {
    console.error('Error fetching blocks by project ID:', error);
    throw error;
  }
};

export const upsertBlock = async (block: StudioBlock) => {
  // Extract plain text from the content object
  const plainText = block.content?.blocks?.map((b: any) => b.data.text || '').join('\n') || '';

  // Prepare data for the local TTS segment creation API
  const localTtsPayload = {
    project_id: block.project_id,
    user_id: "7ac72fd8-0127-451d-b177-128c0f55e7e7", // Default user ID as specified
    text: plainText,
    voice: block.voice || "ar-TN-ReemNeural",
  };

  try {
    // Send to local Next.js API which forwards to external TTS service
    try {
      const ttsResponse = await fetch('/api/tts/generate-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localTtsPayload),
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text().catch(() => '');
        console.warn(`TTS job creation warning: ${ttsResponse.status} ${ttsResponse.statusText} ${errText}`);
      } else {
        console.log('TTS job created via local API');
      }
    } catch (ttsError) {
      console.warn('Local TTS API call failed or was blocked:', ttsError);
    }
    // Do not perform manual GraphQL save; backend handles persistence
    return { success: true };
  } catch (error) {
    console.error('Error in upsertBlock:', error);
    throw error;
  }
};


export const deleteBlock = async (blockId: string): Promise<{ id: string }> => {
  const mutation = `
    mutation DeleteBlock($id: uuid!) {
      delete_Voice_Studio_blocks_by_pk(id: $id) {
        id
      }
    }
  `;
  const variables = { id: blockId };
  const response = await fetchGraphQL<{ delete_Voice_Studio_blocks_by_pk: { id: string } }>(mutation, variables);
  if (response.errors) throw new Error(response.errors[0].message);
  if (!response.data?.delete_Voice_Studio_blocks_by_pk) throw new Error("Block not found or could not be deleted.");
  return response.data.delete_Voice_Studio_blocks_by_pk;
};

// Safer deletion by project_id + block_index (handles local/remote ID mismatch)
export const deleteBlockByIndex = async (projectId: string, blockIndex: string): Promise<number> => {
  const mutation = `
    mutation DeleteBlockByIndex($projectId: uuid!, $blockIndex: String!) {
      delete_Voice_Studio_blocks(where: { project_id: { _eq: $projectId }, block_index: { _eq: $blockIndex } }) {
        affected_rows
      }
    }
  `;
  const variables = { projectId, blockIndex };
  const response = await fetchGraphQL<{ delete_Voice_Studio_blocks: { affected_rows: number } }>(mutation, variables);
  if (response.errors) throw new Error(response.errors[0].message);
  const affected = response.data?.delete_Voice_Studio_blocks?.affected_rows ?? 0;
  if (affected === 0) throw new Error("Block not found or could not be deleted.");
  return affected;
};

// --- Subscription Function ---

export const subscribeToBlocks = (projectId: string, callback: (blocks: StudioBlock[]) => void) => {
  if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
    throw new Error("Hasura environment variables are not configured");
  }

  const wsUrl = HASURA_GRAPHQL_URL.replace('http', 'ws');
  
  const subscriptionClient = new SubscriptionClient(wsUrl, {
    reconnect: true,
    connectionParams: {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
    },
  });

    const subscriptionQuery = `
        subscription GetBlocks($projectId: uuid!) {
            Voice_Studio_blocks(where: {project_id: {_eq: $projectId}}, order_by: {block_index: asc}) {
                block_index
                content
                s3_url
                created_at
                id
                project_id
            }
        }
    `;

    return subscriptionClient.request({
        query: subscriptionQuery,
        variables: { projectId },
    });
};

