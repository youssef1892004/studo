// src/lib/graphql.ts

import { Project, TTSCardData as StudioBlock } from "./types";

const HASURA_GRAPHQL_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function fetchGraphQL<T>(query: string, variables: Record<string, any>): Promise<GraphQLResponse<T>> {
  if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
    throw new Error("Hasura environment variables (NEXT_PUBLIC_...) are not configured in .env.local. Please check the file and restart the server.");
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

export const getBlocksByProjectId = async (projectId: string): Promise<StudioBlock[]> => {
  const query = `
    query GetBlocks($projectId: uuid!) {
      Voice_Studio_blocks(where: {project_id: {_eq: $projectId}}, order_by: {block_index: asc}) {
        id
        project_id
        block_index
        content
        s3_url
        created_at
      }
    }
  `;
  const response = await fetchGraphQL<{ Voice_Studio_blocks: StudioBlock[] }>(query, { projectId });
  if (response.errors) throw new Error(response.errors[0].message);
  return response.data?.Voice_Studio_blocks || [];
};

export const upsertBlock = async (block: Omit<StudioBlock, 'created_at'>) => {
  const mutation = `
    mutation UpsertBlock($block: Voice_Studio_blocks_insert_input!) {
      insert_Voice_Studio_blocks_one(object: $block, on_conflict: {constraint: Voice_Studio_blocks_pkey, update_columns: [content, block_index, s3_url]}) {
        id
      }
    }
  `;
  const response = await fetchGraphQL(mutation, { block });
  if (response.errors) throw new Error(response.errors[0].message);
  return response.data;
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
