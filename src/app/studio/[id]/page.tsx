// src/app/studio/[id]/page.tsx

'use client';

import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, StudioBlock } from '@/lib/types';
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

const proVoices: (Voice & { isPro?: boolean })[] = [
    { name: '0', characterName: 'كريم', gender: 'Male', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
    { name: '1', characterName: 'طارق', gender: 'Male', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
    { name: '2', characterName: 'ليلى', gender: 'Female', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
    { name: '3', characterName: 'نور', gender: 'Female', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
];

export default function StudioProjectPage() {
    const [projectTitle, setProjectTitle] = useState("Untitled Project");
    const [projectDescription, setProjectDescription] = useState("");
    const [voices, setVoices] = useState<(Voice & { isPro?: boolean })[]>([]);
    const [cards, setCards] = useState<StudioBlock[]>([]);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCriticalLoading, setIsCriticalLoading] = useState(true);
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
        if (isInitialLoad.current) return;
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
  
    // Main data loading effect
    const refetchBlocks = useCallback(async () => {
        if (!projectId) return;
        console.log("--- Refetching blocks ---");
        try {
            const res = await fetch(`/api/project/get-records?projectId=${projectId}`, { cache: 'no-store' });
            if (!res.ok) {
                throw new Error('Failed to fetch project records');
            }
            const data = await res.json();
            console.log("Fetched and setting cards:", data);
            setCards(data);
            return data;
        } catch (err: any) {
            console.error('Refetch records failed:', err);
            toast.error(err.message || 'فشل تحديث المقاطع الصوتية.');
            return [];
        }
    }, [projectId]);

    useEffect(() => {
      async function loadInitialData() {
        if (authContext?.user?.id && projectId) {
          setIsCriticalLoading(true);
          try {
            // Step 1: Fetch voices and project details in parallel
            const [fetchedVoices, projectData] = await Promise.all([
              fetchVoices().catch(e => { console.error("Voice fetch failed:", e); return []; }),
              getProjectById(projectId), 
            ]);

            if (!projectData || projectData.user_id !== authContext.user.id) {
              toast.error("Project not found or unauthorized.");
              router.push('/projects');
              return;
            }
            
            // Set project metadata
            const allVoices = [ ...proVoices, ...fetchedVoices.map(v => ({ ...v, isPro: false })) ];
            setVoices(allVoices);
            setProjectTitle(projectData.name || "Untitled Project");
            setProjectDescription(projectData.description || "");

            // Step 2: Fetch all block data from our new single source of truth
            const initialBlocks = await refetchBlocks();

            if (initialBlocks.length === 0) {
              addCard(allVoices); // Pass voices to addCard to select a default
            }

            if (initialBlocks.length > 0 && !initialBlocks.some((c: StudioBlock) => c.id === activeCardId)) {
                setActiveCardId(initialBlocks[0].id);
            }

          } catch (e: any) {
            toast.error(`Failed to load project data: ${e.message}`);
            setError(e.message);
          } finally {
            setIsCriticalLoading(false);
            isInitialLoad.current = false;
          }
        }
      }

      loadInitialData();
    }, [authContext?.user?.id, projectId, router, refetchBlocks]); 

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

    const addCard = (currentVoices = voices) => {
        const newCardId = uuidv4();
        const defaultVoice = currentVoices.find(v => !v.isPro)?.name || "ar-EG-ShakirNeural"; 

        const newCard: StudioBlock = {
            id: newCardId, 
            project_id: projectId,
            block_index: cards.length.toString(),
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

        setCards(prevCards => [...prevCards, newCard]);
        setActiveCardId(newCardId);
    };
    
    const updateCard = (id: string, data: Partial<StudioBlock>) => {
        setCards(currentCards => 
            currentCards.map(card => 
              card.id === id ? { ...card, ...data } : card
            )
        );
    };

    const removeCard = async (id: string) => {
        setCards(prev => prev.filter(card => card.id !== id));
        // The saveBlocks useEffect will handle persisting this change
    };
    
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
            !card.isGenerating
        );

        if (cardsToGenerate.length === 0) {
            toast.error('Add text to generate audio or wait for the current process to complete.');
            return;
        }

        setIsGenerating(true);
        const loadingToastId = toast.loading(`Starting generation for ${cardsToGenerate.length} blocks...`);

        try {
            const blocksPayload = cardsToGenerate.map(card => {
                const selectedVoice = voices.find(v => v.name === card.voice);
                return {
                    text: card.content.blocks.map(b => b.data.text).join(' ').trim(),
                    voice: card.voice,
                    provider: selectedVoice?.provider || 'ghaymah', 
                    block_id: card.id,
                };
            });

            const createResponse = await fetch(`/api/tts/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    project_id: projectId,
                    user_id: authContext.user.id,
                    blocks: blocksPayload
                }),
            });

            if (!createResponse.ok) {
                const errJson = await createResponse.json().catch(() => ({}));
                throw new Error(errJson.error || 'Failed to start TTS job.');
            }

            const { job_id } = await createResponse.json();
            if (!job_id) throw new Error('No job_id returned from create API.');

            let status = '';
            while (status !== 'completed') {
                await new Promise(res => setTimeout(res, 2000));
                const statusResponse = await fetch(`/api/tts/status/${job_id}`);
                if (!statusResponse.ok) throw new Error('Failed to poll generation status.');
                const statusData = await statusResponse.json();
                status = statusData.status;
                if (status === 'failed') throw new Error('Audio generation failed in the background.');
            }

            const audioResponse = await fetch(`/api/tts/result/${job_id}`);
            if (!audioResponse.ok) throw new Error('Failed to fetch audio result.');
            const audioBlob = await audioResponse.blob();

            const s3_url = await uploadAudioSegment(audioBlob, projectId);
            const durationSec = getMP3Duration(Buffer.from(await audioBlob.arrayBuffer())) / 1000;
            const presignedAudioUrl = URL.createObjectURL(audioBlob);

            setCards(currentCards => currentCards.map(card => {
                if (cardsToGenerate.some(c => c.id === card.id)) {
                    return {
                        ...card,
                        isGenerating: false,
                        s3_url: s3_url, // Persist the permanent URL
                        audioUrl: presignedAudioUrl, // Use temporary URL for immediate playback
                        duration: durationSec,
                    };
                }
                return card;
            }));

            toast.success('Generation complete!', { id: loadingToastId });

        } catch (err: any) {
            toast.error(err.message || "An unknown error occurred.", { id: loadingToastId });
        } finally {
            setIsGenerating(false);
        }
    };
  
    const handleDownloadAll = async () => {
        const audioCards = cards.filter(card => card.s3_url);
        if (audioCards.length === 0) {
            toast.error("No audio has been generated yet.");
            return;
        }

        // This is a simplified download-all. A real implementation might need a backend merge.
        // For now, we download the audio of the first available block.
        const firstCardWithAudio = audioCards[0];
        if (firstCardWithAudio.audioUrl) {
            const a = document.createElement('a');
            a.href = firstCardWithAudio.audioUrl;
            a.download = `${projectTitle.replace(/ /g, '_') || 'project'}.mp3`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            toast.error("Audio not loaded yet. Please wait a moment.");
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
                    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
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
                         />
                    </div>
                )}
            </div>

            {cards.length > 0 && (
                <div className="flex-shrink-0 h-48 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-inner">
                    <div className="h-full flex flex-col">
                        <Timeline 
                            cards={cards} 
                            onCardsUpdate={setCards} 
                            isBlocksProcessing={isCriticalLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}