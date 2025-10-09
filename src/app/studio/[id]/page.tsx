// src/app/studio/[id]/page.tsx

'use client';

import { useContext, useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, StudioBlock } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import { getProjectById, updateProject, getBlocksByProjectId, upsertBlock, deleteBlock } from '@/lib/graphql';
import getMP3Duration from 'get-mp3-duration';
import { uploadAudioSegment } from '@/lib/tts';
import toast from 'react-hot-toast';
import ProjectHeader from '@/components/studio/ProjectHeader';
import EditorCanvas from '@/components/studio/EditorCanvas';
import RightSidebar from '@/components/studio/RightSidebar';
import Timeline from '@/components/Timeline';
import GeneratedLinks from '@/components/GeneratedLinks';

const PRO_VOICES_IDS = ['0', '1', '2', '3'];

export default function StudioProjectPage() {
    const [projectTitle, setProjectTitle] = useState("Untitled Project");
    const [projectDescription, setProjectDescription] = useState("");
    const [voices, setVoices] = useState<(Voice & { isPro?: boolean })[]>([]);
    const [cards, setCards] = useState<StudioBlock[]>([]);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const isInitialLoad = useRef(true);
    
    const [voiceMode, setVoiceMode] = useState<'Free' | 'Pro'>('Free'); 

    const [languageFilter, setLanguageFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});
    const authContext = useContext(AuthContext);
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const activeCard = cards.find(c => c.id === activeCardId);

    if (!authContext) {
        throw new Error('AuthContext must be used within an AuthProvider');
    }

    // Auto-save for project name and description
    useEffect(() => {
        if (isInitialLoad.current) return;
        const handler = setTimeout(() => {
            console.log("Auto-saving project metadata...");
            updateProject(projectId, projectTitle, projectDescription)
                .then(() => toast.success("تم حفظ المشروع تلقائيًا!"))
                .catch(err => {
                    console.error("Auto-save failed:", err);
                    toast.error("فشل حفظ المشروع تلقائيًا.");
                });
        }, 2000);
        return () => clearTimeout(handler);
    }, [projectTitle, projectDescription, projectId]);

    useEffect(() => {
        const intervals = pollingIntervals.current;
        return () => { Object.values(intervals).forEach(clearInterval); };
    }, []);

    useEffect(() => {
      if (!authContext?.isLoading && !authContext?.user) router.push('/login');
    }, [authContext, router]);
  
    // Main data loading effect
    useEffect(() => {
      async function loadProjectAndVoices() {
        if (authContext?.user?.id && projectId) {
          setIsLoading(true);
          try {
            const [fetchedVoices, projectData, fetchedBlocks] = await Promise.all([
              fetchVoices(), 
              getProjectById(projectId),
              getBlocksByProjectId(projectId)
            ]);
            
            if (!projectData || projectData.user_id !== authContext.user.id) {
                toast.error("Project not found or unauthorized.");
                router.push('/projects'); 
                return;
            }
            
            setVoices(fetchedVoices.map(v => ({ ...v, isPro: PRO_VOICES_IDS.includes(v.name) })));
            setProjectTitle(projectData.name || "Untitled Project");
            setProjectDescription(projectData.description || "");

            const initialCards = fetchedBlocks.map(block => ({
                ...block,
                voice: 'ar-SA-HamedNeural', // Default voice, can be stored in block later
                isGenerating: false,
                isArabic: true, // Default, can be stored in block later
            }));

            setCards(initialCards);

            if (initialCards.length > 0) {
              setActiveCardId(initialCards[0].id);
            } else {
              addCard(); // Add a default card if project is empty
            }

          } catch (e: any) {
            toast.error(`Failed to load project data: ${e.message}`);
            setError(e.message);
          } finally {
            setIsLoading(false);
            setTimeout(() => { isInitialLoad.current = false; }, 500);
          }
        }
      }
      loadProjectAndVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authContext?.user?.id, projectId]); 

    const addCard = async () => {
        const newCardId = uuidv4();
        const isProMode = voiceMode === 'Pro';
        const defaultVoice = isProMode 
            ? (voices.find(v => v.isPro)?.name || "0") 
            : (voices.find(v => !v.isPro)?.name || "ar-EG-ShakirNeural"); 

        const newCard: StudioBlock = {
            id: newCardId, 
            project_id: projectId,
            block_index: String(cards.length),
            content: { 
                time: Date.now(), 
                blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }],
                version: "2.28.2"
            },
            s3_url: '', // FIX: Provide a default value for the non-nullable column
            created_at: new Date().toISOString(),
            voice: defaultVoice,
            isGenerating: false,
            isArabic: isProMode, 
        };

        try {
            await upsertBlock(newCard);
            setCards(prevCards => [...prevCards, newCard]);
            setActiveCardId(newCardId);
            toast.success("New block added!");
        } catch (error: any) {
            toast.error(`Failed to add block: ${error.message}`);
        }
    };
    
    const updateCard = (id: string, data: Partial<StudioBlock>) => {
        setCards(currentCards => 
            currentCards.map(card => 
              card.id === id ? { ...card, ...data } : card
            )
        );
    };

    const removeCard = async (id: string) => {
        try {
            await deleteBlock(id);
            setCards(prev => prev.filter(card => card.id !== id));
            if (pollingIntervals.current[id]) {
                clearInterval(pollingIntervals.current[id]);
                delete pollingIntervals.current[id];
            }
            toast.success("Block deleted.");
        } catch (error: any) {
            toast.error(`Failed to delete block: ${error.message}`);
        }
    };
    
    const handleApplyVoice = (voiceName: string) => {
      if (activeCardId) {
        const selectedVoice = voices.find(v => v.name === voiceName);
        const isProVoice = selectedVoice?.isPro ?? false;
        updateCard(activeCardId, { voice: voiceName, isArabic: isProVoice });
        toast.success(`Voice applied.`);
      }
    };
    
    const handleGenerate = async () => {
        const cardsToGenerate = cards.filter(card =>
            card.content.blocks.some(b => b.data.text && b.data.text.trim().length > 0) && 
            !card.isGenerating
        );
        
        if (cardsToGenerate.length === 0) {
            toast.error('Add text to generate audio, or wait for the current process to finish.');
            return;
        }
        
        setIsGenerating(true);
        setError(null);
        
        const loadingToastId = toast.loading(`Starting generation for ${cardsToGenerate.length} blocks...`);

        for (const card of cardsToGenerate) {
            try {
                // 1. Save block content before generating
                toast.loading(`Saving and generating block ${card.block_index + 1}...`, { id: loadingToastId });
                await upsertBlock(card);

                updateCard(card.id, { isGenerating: true, audioUrl: undefined, duration: undefined });
                
                const text = card.content.blocks.map(b => b.data.text).join(' ').trim();

                // 2. Start generation job
                const createResponse = await fetch('/api/tts/generate-segment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text, 
                        voice: card.voice, 
                        isArabic: card.isArabic,
                        project_id: projectId,
                        user_id: authContext.user.id
                    }),
                });
                
                if (!createResponse.ok) throw new Error((await createResponse.json()).error || 'Failed to start job.');
                
                const { job_id } = await createResponse.json();
                updateCard(card.id, { job_id: job_id });

                // 3. Poll for result
                pollingIntervals.current[card.id] = setInterval(async () => {
                    try {
                        const statusResponse = await fetch(`/api/tts/status/${job_id}`);
                        if (!statusResponse.ok) throw new Error(`Status check failed`);
                        
                        const statusData = await statusResponse.json();
                        
                        if (statusData.status === 'completed') {
                            clearInterval(pollingIntervals.current[card.id]);
                            delete pollingIntervals.current[card.id];
                            
                            const audioResponse = await fetch(`/api/tts/result/${job_id}`);
                            const audioBlob = await audioResponse.blob();
                            const audioUrl = URL.createObjectURL(audioBlob);
                            const s3_url = await uploadAudioSegment(audioBlob, card.id); 
                            const duration = getMP3Duration(Buffer.from(await audioBlob.arrayBuffer())) / 1000;
                            
                            const updatedCard = { ...card, isGenerating: false, audioUrl, s3_url, duration };
                            updateCard(card.id, updatedCard);

                            // 4. Save the final s3_url to the database
                            await upsertBlock(updatedCard);
                            toast.success(`Block ${card.block_index + 1} finished!`);

                        } else if (statusData.status === 'failed') {
                            throw new Error('Audio generation failed on backend.');
                        }
                    } catch (pollError: any) {
                        clearInterval(pollingIntervals.current[card.id]);
                        delete pollingIntervals.current[card.id];
                        updateCard(card.id, { isGenerating: false });
                        toast.error(`Block ${card.block_index + 1} failed: ${pollError.message}`);
                    }
                }, 3000);
            } catch (err: any) {
                updateCard(card.id, { isGenerating: false });
                toast.error(`Failed to generate block ${card.block_index + 1}: ${err.message}`);
            }
        }
        toast.dismiss(loadingToastId);
        setIsGenerating(false);
    };
  
    // ... (handleDownloadAll and render logic remains largely the same) ...
    const handleDownloadAll = async () => {
        const jobIds = cards
            .map(card => card.job_id)
            .filter((id): id is string => !!id);

        if (jobIds.length === 0) {
            toast.error("No audio has been generated yet.");
            return;
        }

        setIsGenerating(true);
        const downloadToastId = toast.loading('Merging audio... this may take a moment.');

        try {
            const response = await fetch('/api/tts/merge-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to merge audio.');
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
            
            toast.success('Audio successfully merged and downloaded!', { id: downloadToastId });

        } catch (err: any) {
            toast.error(err.message || "An error occurred during merge and download.", { id: downloadToastId });
        } finally {
            setIsGenerating(false);
        }
    };
  
    const languages = Array.from(new Map(voices.map(v => [v.languageCode, { code: v.languageCode, name: v.languageName }])).values());
    const countries = Array.from(new Map(voices.map(v => [v.countryCode, { code: v.countryCode, name: v.countryName }])).values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  
    const filteredVoices = voices
      .filter(voice => (languageFilter === 'all' || voice.languageCode === languageFilter))
      .filter(voice => (countryFilter === 'all' || voice.countryCode === countryFilter))
      .filter(voice => (genderFilter === 'all' || voice.gender === genderFilter))
      .filter(voice => (voiceMode === 'Pro' ? voice.isPro : !voice.isPro))
      .filter(voice => {
          if (searchTerm.trim() === '') return true;
          const lowerSearchTerm = searchTerm.toLowerCase();
          return (voice.characterName.toLowerCase().includes(lowerSearchTerm) || voice.countryName.toLowerCase().includes(lowerSearchTerm));
      });
  
    if (isLoading || authContext?.isLoading || !authContext?.user) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
            <LoaderCircle className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <h2 className="text-xl font-semibold">Loading Studio...</h2>
            <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your project.</p>
        </div>
      );
    }
  
    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans relative">
            <div className="flex-shrink-0 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <ProjectHeader 
                    projectTitle={projectTitle}
                    setProjectTitle={setProjectTitle}
                    projectDescription={projectDescription}
                    setProjectDescription={setProjectDescription}
                    isGenerating={isGenerating}
                    handleGenerate={handleGenerate}
                    handleDownloadAll={handleDownloadAll}
                />
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
                        addCard={addCard}
                        error={error} 
                    />
                    <div className="p-4">
                        <GeneratedLinks projectId={projectId} />
                    </div>
                </main>
                
                <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
                     <RightSidebar
                        voices={filteredVoices}
                        onApplyVoice={handleApplyVoice}
                        activeVoiceName={activeCard?.voice}
                        languages={languages}
                        countries={countries}
                        languageFilter={languageFilter}
                        setLanguageFilter={setLanguageFilter}
                        countryFilter={countryFilter}
                        setCountryFilter={setCountryFilter}
                        genderFilter={genderFilter}
                        setGenderFilter={setGenderFilter}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        voiceMode={voiceMode}
                        setVoiceMode={setVoiceMode}
                    />
                </div>
            </div>

            {cards.length > 0 && (
                <div className="flex-shrink-0 h-48 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-inner">
                    <div className="h-full flex flex-col">
                        <Timeline cards={cards} />
                    </div>
                </div>
            )}
        </div>
    );
}