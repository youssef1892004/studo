// src/components/studio/StudioPageClient.tsx
'use client';

import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, StudioBlock, Project } from '@/lib/types';
import { LoaderCircle, List } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import { getProjectById, updateProject, deleteBlockByIndex, deleteBlock } from '@/lib/graphql';
import getMP3Duration from 'get-mp3-duration';
import { uploadAudioSegment } from '@/lib/tts';
import toast from 'react-hot-toast';
import ProjectHeader from '@/components/studio/ProjectHeader';
import EditorCanvas from '@/components/studio/EditorCanvas';
import RightSidebar from '@/components/studio/RightSidebar';
import Timeline from '@/components/Timeline';
import CenteredLoader from '@/components/CenteredLoader';

const PRO_VOICES_IDS = ['0', '1', '2', '3'];

const MAINTENANCE_VOICES = ['0', '1', '2', '3'];



interface StudioPageClientProps {

    initialProject: Project;

    initialVoices: (Voice & { isPro?: boolean })[];
    initialBlocks: StudioBlock[];
}

export default function StudioPageClient({ initialProject, initialVoices, initialBlocks }: StudioPageClientProps) {
    const [projectTitle, setProjectTitle] = useState(initialProject.name || "Untitled Project");
    const [projectDescription, setProjectDescription] = useState(initialProject.description || "");
    const [voices, setVoices] = useState(initialVoices);
    const [cards, setCards] = useState<StudioBlock[]>(initialBlocks);
    const [activeCardId, setActiveCardId] = useState<string | null>(initialBlocks.length > 0 ? initialBlocks[0].id : null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCriticalLoading, setIsCriticalLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const isInitialLoad = useRef(true);

    const [languageFilter, setLanguageFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [providerFilter, setProviderFilter] = useState('all');
    const [enableTashkeel, setEnableTashkeel] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const authContext = useContext(AuthContext);
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const activeCard = cards.find(c => c.id === activeCardId);

    if (!authContext) {
        throw new Error('AuthContext must be used within an AuthProvider');
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Auto-save for project name and description
    useEffect(() => {
        if (isInitialLoad.current) return;
        const handler = setTimeout(() => {
            updateProject(projectId, projectTitle, projectDescription)
                .catch(err => {
                    console.error("Auto-save for metadata failed:", err);
                });
        }, 2000);
        return () => clearTimeout(handler);
    }, [projectTitle, projectDescription, projectId]);

    // Main save function for blocks
    const saveBlocks = useCallback(async (blocksToSave: StudioBlock[]) => {
        console.log("Saving blocks...", blocksToSave);
        try {
            await fetch(`/api/project/save-editor-blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    blocksJson: blocksToSave, // Send the raw data
                }),
            });
        } catch (err) {
            console.error("Blocks save failed:", err);
        }
    }, [projectId]);

    // Effect to trigger save when cards change
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        };
        // Debounce saving to avoid excessive requests
        const handler = setTimeout(() => {
            if (cards.length > 0) {
                saveBlocks(cards);
            }
        }, 1000); // Wait 1 second after last change to save
        return () => clearTimeout(handler);
    }, [cards, saveBlocks]);

    // Redirect if not logged in
    useEffect(() => {
      if (!authContext?.isLoading && !authContext?.user) {
        router.replace('/login');
      }
    }, [authContext?.isLoading, authContext?.user, router]);
  
    const addCard = useCallback((currentVoices = voices) => {
        const newCardId = uuidv4();
        const defaultVoice = "ar-EG-ShakirNeural";

        setCards(prevCards => {
            const newCard: StudioBlock = {
                id: newCardId,
                project_id: projectId,
                block_index: prevCards.length.toString(),
                content: {
                    time: Date.now(),
                    blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }],
                    version: "2.28.2"
                },
                s3_url: '',
                created_at: new Date().toISOString(),
                voice: defaultVoice,
                isGenerating: false,
                isArabic: enableTashkeel,
                voiceSelected: false,
            };
            return [...prevCards, newCard];
        });
        setActiveCardId(newCardId);
    }, [voices, projectId, enableTashkeel]);

    // Effect to calculate audio durations when audioUrl is present
    useEffect(() => {
        const calculateMissingDurations = async () => {
            const cardsToUpdate = cards.filter(card => card.audioUrl && !card.duration);
            if (cardsToUpdate.length === 0) return;

            let hasUpdates = false;
            const updatedCards = await Promise.all(
                cards.map(async (card) => {
                    if (card.audioUrl && !card.duration) {
                        try {
                            const audio = new Audio(card.audioUrl);
                            const duration = await new Promise<number>((resolve, reject) => {
                                audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
                                audio.addEventListener('error', (e) => reject(e));
                            });
                            hasUpdates = true;
                            return { ...card, duration };
                        } catch (error) {
                            console.warn(`Could not calculate duration for block ${card.id}:`, error);
                        }
                    }
                    return card;
                })
            );

            if (hasUpdates) {
                setCards(updatedCards);
            }
        };
        calculateMissingDurations();
    }, [cards]);
    
    const updateCard = useCallback((id: string, data: Partial<StudioBlock>) => {
        setCards(currentCards => 
            currentCards.map(card => 
              card.id === id ? { ...card, ...data } : card
            )
        );
    }, []);

    const removeCard = useCallback(async (id: string) => {
        setCards(prev => prev.filter(card => card.id !== id));
        // The saveBlocks useEffect will handle persisting this change
    }, []);
    
    const handleApplyVoice = (voiceName: string) => {
      if (activeCardId) {
        const selectedVoice = voices.find(v => v.name === voiceName);
        const isProVoice = selectedVoice?.isPro ?? false;
        updateCard(activeCardId, { voice: voiceName, isArabic: isProVoice, voiceSelected: true });
        toast.success(`Voice applied.`);
      }
    };
    
    const handleGenerate = async () => {
        if (isGenerating) return;
        if (!authContext.user) return;

            const cardsToGenerate = cards.filter(card =>
                card.content.blocks.some(b => b.data.text && b.data.text.trim().length > 0) &&
                !card.audioUrl &&
                !card.isGenerating
            );
        if (cardsToGenerate.length === 0) {
            toast.error('Add text to generate audio or wait for the current process to complete.');
            return;
        }

        setIsGenerating(true);
        const generationToastId = toast.loading(`Generating audio for ${cardsToGenerate.length} block(s)...`);

                            const generationPromises = cardsToGenerate.map(async (card) => {
                                // Maintenance Check
                                if (MAINTENANCE_VOICES.includes(card.voice)) {
                                    const voiceName = voices.find(v => v.name === card.voice)?.characterName || card.voice;
                                    const errorMsg = `Voice "${voiceName}" is currently under maintenance.`;
                                    toast.error(errorMsg);
                                    return { id: card.id, error: errorMsg };
                                }
                    
                                const selectedVoice = voices.find(v => v.name === card.voice);
                    
                                // Voice Not Found Check
                                if (!selectedVoice) {
                                    const errorMsg = `Voice for block with text "${card.content.blocks[0].data.text.substring(0, 20)}..." not found. Please re-select a voice.`;
                                    toast.error(errorMsg);
                                    return { id: card.id, error: errorMsg };
                                }
                    
                                try {
                                    updateCard(card.id, { isGenerating: true });
                    
                                    const provider = selectedVoice.provider; // No more fallback!
                    
                                    const res = await fetch(`/api/tts/generate-segment`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            text: card.content.blocks.map(b => b.data.text).join(' \n'),
                                            voice: card.voice,
                                            provider: provider,
                                            project_id: projectId,
                                            user_id: authContext.user?.id,
                                            arabic: card.isArabic,
                                        }),
                                    });                const job = await res.json();
                if (!res.ok) {
                    throw new Error(job.error || 'Failed to start generation job.');
                }

                updateCard(card.id, { job_id: job.job_id });

                let status = '';
                while (status !== 'completed' && status !== 'failed') {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const statusRes = await fetch(`/api/tts/status/${job.job_id}`);
                    const statusData = await statusRes.json();
                    status = statusData.status;
                }

                if (status === 'failed') {
                    throw new Error(`Generation failed for block: ${card.id}`);
                }

                const audioRes = await fetch(`/api/tts/result/${job.job_id}`);
                if (!audioRes.ok) {
                    throw new Error(`Failed to fetch audio result for job: ${job.job_id}`);
                }

                const audioBlob = await audioRes.blob();
                const s3_url = await uploadAudioSegment(audioBlob, projectId);
                const duration = getMP3Duration(Buffer.from(await audioBlob.arrayBuffer())) / 1000;
                const audioUrl = URL.createObjectURL(audioBlob);

                return { id: card.id, s3_url, audioUrl, duration, job_id: job.job_id };

            } catch (error: any) {
                console.error(`Error generating audio for card ${card.id}:`, error);
                // Return an error state for this specific card
                return { id: card.id, error: error.message };
            }
        });

        try {
            const results = await Promise.all(generationPromises);
            const errorMessages: string[] = [];

            setCards(currentCards => {
                const newCards = [...currentCards];
                results.forEach(result => {
                    const cardIndex = newCards.findIndex(c => c.id === result.id);
                    if (cardIndex !== -1) {
                        if (result.error) {
                            newCards[cardIndex] = { ...newCards[cardIndex], isGenerating: false };
                            errorMessages.push(`Failed: ${result.error}`);
                        } else {
                            newCards[cardIndex] = {
                                ...newCards[cardIndex],
                                isGenerating: false,
                                s3_url: result.s3_url,
                                audioUrl: result.audioUrl,
                                duration: result.duration,
                                job_id: result.job_id,
                            };
                        }
                    }
                });
                return newCards;
            });

            errorMessages.forEach(msg => toast.error(msg));

            const successCount = results.filter(r => !r.error).length;
            if (successCount > 0) {
                toast.success(`Successfully generated audio for ${successCount} block(s).`, { id: generationToastId });
            } else {
                toast.error('Audio generation failed for all blocks.', { id: generationToastId });
            }

        } catch (e) {
            // This catch block is for errors in Promise.all itself, which is unlikely.
            toast.error('An unexpected error occurred during generation.', { id: generationToastId });
        } finally {
            setIsGenerating(false);
        }
    };
  
    const handleDownloadAll = async () => {
        const audioCards = cards.filter(card => card.s3_url && card.job_id);
        if (audioCards.length === 0) {
            toast.error("No audio has been generated and saved yet.");
            return;
        }

        const jobIds = audioCards.map(card => card.job_id).filter((id): id is string => !!id);

        if (jobIds.length === 0) {
            toast.error("Could not find job IDs for generated audio.");
            return;
        }

        const downloadToastId = toast.loading("Merging audio... this may take a moment.");

        try {
            const response = await fetch('/api/tts/merge-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Merge request failed.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle.replace(/ /g, '_') || 'project'}.mp3`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Download complete!", { id: downloadToastId });

        } catch (error: any) {
            console.error("Failed to download merged audio:", error);
            toast.error(`Download failed: ${error.message}`, { id: downloadToastId });
        }
    };
  
    const languages = Array.from(new Map(voices.map(v => [v.languageCode, { code: v.languageCode, name: v.languageName }])).values());
    const countries = Array.from(new Map(voices.map(v => [v.countryCode, { code: v.countryCode, name: v.countryName }])).values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    const providers = Array.from(new Set(voices.map(v => v.provider))).filter(p => p);

    const filteredVoices = voices
      .filter(voice => (languageFilter === 'all' || voice.languageCode === languageFilter))
      .filter(voice => (countryFilter === 'all' || voice.countryCode === countryFilter))
      .filter(voice => (genderFilter === 'all' || voice.gender === genderFilter))
      .filter(voice => (providerFilter === 'all' || voice.provider === providerFilter))
      .filter(voice => {
          if (searchTerm.trim() === '') return true;
          const lowerSearchTerm = searchTerm.toLowerCase();
          return (voice.characterName.toLowerCase().includes(lowerSearchTerm) || voice.countryName.toLowerCase().includes(lowerSearchTerm));
      });
  
    if (authContext?.isLoading || isCriticalLoading) {
      return <CenteredLoader message="Loading Project..." />;
    }

    if (!authContext?.user) {
      return null; // Redirect is handled by effect
    }
  
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'CreativeWork',
                    name: projectTitle,
                    description: projectDescription,
                    author: {
                        '@type': 'Organization',
                        name: 'Studo',
                    },
                }) }}
            />
            <div className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans relative">
                <div className="flex-shrink-0 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-4">
                <ProjectHeader 
                    projectTitle={projectTitle}
                    setProjectTitle={setProjectTitle}
                    projectDescription={projectDescription}
                    setProjectDescription={setProjectDescription}
                    isGenerating={isGenerating}
                    isGenerateDisabled={isGenerating}
                    handleGenerate={handleGenerate}
                    handleDownloadAll={handleDownloadAll}
                />
                <button onClick={toggleSidebar} className="p-2 text-gray-600 dark:text-gray-300">
                    <List size={20} />
                </button>
                </div>

                 <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
                         <EditorCanvas 
                            cards={cards}
                            setCards={setCards}
                            voices={voices}
                            activeCardId={activeCardId}
                            setActiveCardId={setActiveCardId}
                            updateCard={updateCard}
                            removeCard={removeCard}
                            addCard={() => addCard()}
                            error={error}
                            pageMessage={null}
                            projectId={projectId}
                            isBlocksProcessing={isCriticalLoading}
                        />
                    </main>
                    
                    {isSidebarOpen && (
                        <div className="w-[420px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
                            <RightSidebar
                                voices={filteredVoices}
                                onApplyVoice={handleApplyVoice}
                                activeVoiceName={activeCard?.voice}
                                isOpen={isSidebarOpen}
                                onToggle={toggleSidebar}
                                languages={languages}
                                countries={countries}
                                languageFilter={languageFilter}
                                setLanguageFilter={setLanguageFilter}
                                countryFilter={countryFilter}
                                setCountryFilter={setCountryFilter}
                                genderFilter={genderFilter}
                                setGenderFilter={setGenderFilter}
                                providerFilter={providerFilter}
                                setProviderFilter={setProviderFilter}
                                providers={providers as string[]}
                                enableTashkeel={enableTashkeel}
                                setEnableTashkeel={setEnableTashkeel}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                maintenanceVoices={MAINTENANCE_VOICES}
                             />
                        </div>
                    )}
                </div>

                {cards.length > 0 && (
                    <div className="flex-shrink-0 h-48 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-inner">
                        <div className="h-full flex flex-col">
                            <Timeline 
                                cards={cards} 
                                voices={voices}
                                onCardsUpdate={setCards} 
                                isBlocksProcessing={isCriticalLoading}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
