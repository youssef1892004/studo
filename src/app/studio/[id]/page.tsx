// src/app/studio/[id]/page.tsx

import { Metadata, ResolvingMetadata } from 'next';
import { getProjectById } from '@/lib/graphql';
import { fetchVoices, getApiUrl } from '@/lib/tts';
import StudioPageClient from '@/components/studio/StudioPageClient';
import { notFound } from 'next/navigation';
import { Voice, StudioBlock } from '@/lib/types';






export async function generateMetadata(
  { params, searchParams }: any,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id;
  const project = await getProjectById(id);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  const title = project ? `${project.name} | Studo` : 'Studo Project';
  const description = project ? project.description || 'Create and share audio content with Studo.' : 'Create and share audio content with Studo.';
  const imageUrl = `https://ghaymah.systems/logos/logo.png`;

  return {
    title: title,
    description: description,
    keywords: ['arabic tts', 'text to speech', 'audio project', project?.name],
    openGraph: {
      title: title,
      description: description,
      url: `https://ghaymah.systems/studio/${id}`,
      siteName: 'Studo',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
        ...previousImages,
      ],
      locale: 'ar_EG',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function StudioProjectPage({ params }: any) {
    const projectId = (await params).id;

    const [project, voices, blocks] = await Promise.all([
        getProjectById(projectId),
        fetchVoices().catch(e => { console.error("Voice fetch failed:", e); return []; }),
        fetch(getApiUrl(`/api/project/get-records?projectId=${projectId}`), { cache: 'no-store' }).then(res => res.json()).catch(e => { console.error("Blocks fetch failed:", e); return []; })
    ]);

    if (!project) {
        notFound();
    }
    
    const PRO_VOICES_IDS = ['0', '1', '2', '3'];
    const allVoices = voices.map((v: Voice) => ({ 
        ...v, 
        isPro: v.provider === 'ghaymah' && PRO_VOICES_IDS.includes(v.name) 
    }));

    return (
        <StudioPageClient 
            initialProject={project}
            initialVoices={allVoices}
            initialBlocks={blocks}
        />
    );
}
