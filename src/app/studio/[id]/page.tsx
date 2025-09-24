'use client';

import { useContext, useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, TTSCardData } from '@/lib/types';
import SettingsSidebar from '@/components/SettingsSidebar';
import { LoaderCircle, Orbit, Plus, Save, Share } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { getProjectById, updateProject } from '@/lib/graphql';
import Timeline from '@/components/Timeline';
import getMP3Duration from 'get-mp3-duration';

const SortableEditorBlock = dynamic(() => import('@/components/SortableEditorBlock'), {
  ssr: false, 
  loading: () => <div className="text-center p-10 text-gray-500">Loading Editor...</div>,
});


export default function StudioProjectPage() {
    const [projectTitle, setProjectTitle] = useState("Untitled Project");
    const [voices, setVoices] = useState<Voice[]>([]);
    const [cards, setCards] = useState<TTSCardData[]>([]);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageMessage, setPageMessage] = useState<string | null>(null);
    
    const [languageFilter, setLanguageFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});

    const authContext = useContext(AuthContext);
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const activeCard = cards.find(c => c.id === activeCardId);

    useEffect(() => {
        const intervals = pollingIntervals.current;
        return () => {
            Object.values(intervals).forEach(clearInterval);
        };
    }, []);

    useEffect(() => {
      if (!authContext?.isLoading && !authContext?.user) {
        router.push('/login');
      }
    }, [authContext, router]);
  
    useEffect(() => {
      async function loadProjectAndVoices() {
        if (authContext?.user?.id && projectId) {
          setIsLoading(true);
          try {
            const [fetchedVoices, projectData] = await Promise.all([
              fetchVoices(),
              getProjectById(projectId)
            ]);
            setVoices(fetchedVoices);
            if (projectData) {
              setProjectTitle(projectData.comments || "Untitled Project");
              const initialCards = (projectData.blocks || []).map((card: any) => ({
                ...card,
                isGenerating: false,
              }));
              setCards(initialCards);
              if (initialCards.length > 0) {
                setActiveCardId(initialCards[0].id);
              }
            } else {
              setError("Project not found.");
            }
          } catch (e: any) {
            setError(`Failed to load project data: ${e.message}`);
          } finally {
            setIsLoading(false);
          }
        }
      }
      loadProjectAndVoices();
    }, [authContext?.user?.id, projectId]);

    const addCard = () => {
        if (voices.length > 0) {
        const newCardId = uuidv4();
        const newCard: TTSCardData = {
            id: newCardId, 
            voice: voices[0].name,
            data: { time: Date.now(), blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }] },
            isGenerating: false,
        };
        setCards([...cards, newCard]);
        setActiveCardId(newCardId);
        }
    };
    
    const updateCard = (id: string, data: Partial<TTSCardData>) => {
        setCards(currentCards => 
        currentCards.map(card => (card.id === id ? { ...card, ...data } : card))
        );
    };

    const removeCard = (id: string) => {
        setCards(prev => prev.filter(card => card.id !== id));
        if (pollingIntervals.current[id]) {
            clearInterval(pollingIntervals.current[id]);
            delete pollingIntervals.current[id];
        }
    };
    const handleApplyVoice = (voiceName: string) => activeCardId && updateCard(activeCardId, { voice: voiceName });

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (over && active.id !== over.id) {
        const oldIndex = cards.findIndex(item => item.id === active.id);
        const newIndex = cards.findIndex(item => item.id === over.id);
        setCards(arrayMove(cards, oldIndex, newIndex));
        }
    }

    const handleGenerate = async () => {
        const cardsToGenerate = cards.filter(card =>
            card.data.blocks.some(b => b.data.text && b.data.text.trim().length > 0) && !card.isGenerating
        );

        if (cardsToGenerate.length === 0) {
            setError('Add text to generate, or wait for the current process to finish.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        
        const generationPromises = cardsToGenerate.map(card => 
            new Promise<void>(async (resolve, reject) => {
                updateCard(card.id, { isGenerating: true, audioUrl: undefined, duration: undefined });
                
                try {
                    const text = card.data.blocks.map(b => b.data.text).join(' ').trim();
                    
                    const createResponse = await fetch('/api/tts/generate-segment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, voice: card.voice }),
                    });

                    if (!createResponse.ok) {
                        const errorData = await createResponse.json();
                        throw new Error(errorData.error || 'Failed to start job.');
                    }
                    
                    const { job_id } = await createResponse.json();

                    pollingIntervals.current[card.id] = setInterval(async () => {
                        try {
                            const statusResponse = await fetch(`/api/tts/status/${job_id}`);
                            if (!statusResponse.ok) throw new Error(`Status check failed for job ${job_id}`);
                            const statusData = await statusResponse.json();

                            if (statusData.status === 'completed') {
                                clearInterval(pollingIntervals.current[card.id]);
                                delete pollingIntervals.current[card.id];

                                const audioResponse = await fetch(`/api/tts/result/${job_id}`);
                                const audioBlob = await audioResponse.blob();
                                const audioUrl = URL.createObjectURL(audioBlob);
                                const buffer = await audioBlob.arrayBuffer();
                                const duration = getMP3Duration(Buffer.from(buffer));
                                
                                updateCard(card.id, { isGenerating: false, audioUrl, duration: duration / 1000 });
                                resolve();
                            } else if (statusData.status === 'failed') {
                                clearInterval(pollingIntervals.current[card.id]);
                                delete pollingIntervals.current[card.id];
                                throw new Error('Audio generation failed on backend.');
                            }
                        } catch (pollError) {
                            clearInterval(pollingIntervals.current[card.id]);
                            delete pollingIntervals.current[card.id];
                            reject(pollError);
                        }
                    }, 3000);

                } catch (initialError) {
                    updateCard(card.id, { isGenerating: false });
                    reject(initialError);
                }
            })
        );

        try {
            await Promise.all(generationPromises);
        } catch(err: any) {
            setError(err.message || "An error occurred during generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveProject = async () => {
        if (!authContext?.user?.id || !projectId) return setError("Cannot save. No user or project ID found.");
        setIsSaving(true);
        setError(null);
        setPageMessage(null);
        try {
            const cardsToSave = cards.map(({ audioUrl, duration, isGenerating, ...rest }) => rest);
            await updateProject(projectId, cardsToSave, projectTitle);
            setPageMessage("Project saved successfully!");
            setTimeout(() => setPageMessage(null), 3000);
        } catch (e: any) {
            setError(`Failed to save project: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };
  
    const languages = Array.from(new Map(voices.map(v => [v.languageCode, { code: v.languageCode, name: v.languageName }])).values());
    const countries = Array.from(new Map(voices.map(v => [v.countryCode, { code: v.countryCode, name: v.countryName }])).values())
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  
    const filteredVoices = voices
      .filter(voice => {
          const langMatch = languageFilter === 'all' || voice.languageCode === languageFilter;
          const countryMatch = countryFilter === 'all' || voice.countryCode === countryFilter;
          const genderMatch = genderFilter === 'all' || voice.gender === genderFilter;
          return langMatch && countryMatch && genderMatch;
      })
      .filter(voice => {
          if (searchTerm.trim() === '') return true;
          const lowerSearchTerm = searchTerm.toLowerCase();
          return (
              voice.characterName.toLowerCase().includes(lowerSearchTerm) ||
              voice.countryName.toLowerCase().includes(lowerSearchTerm)
          );
      });
  
    if (isLoading || authContext?.isLoading || !authContext?.user) {
      return <div className="flex items-center justify-center min-h-screen"><Orbit className="w-12 h-12 animate-spin text-gray-800" /></div>;
    }
  
    const hasContent = cards.length > 0;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-100 font-sans">
          <header className="flex items-center justify-between p-3 bg-white border-b border-gray-200 flex-shrink-0">
            <input 
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="text-lg font-bold text-gray-800 bg-transparent focus:outline-none focus:ring-0 border-0"
            />
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"><Share size={20} /></button>
              <button onClick={handleSaveProject} disabled={isSaving} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:text-gray-300">
                {isSaving ? <LoaderCircle className="animate-spin" size={20} /> : <Save size={20} />}
              </button>
              <button onClick={handleGenerate} disabled={isGenerating} className="px-5 py-2 bg-black text-white font-semibold rounded-md hover:bg-gray-800 disabled:bg-gray-400">
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </header>
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
              <SettingsSidebar 
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
              />
            </aside>
            <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto">
              {(error || pageMessage) && (
                <div className={`max-w-4xl mx-auto w-full mb-4 p-3 rounded-lg text-center text-sm font-medium ${error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {error || pageMessage}
                </div>
              )}
              <div className="w-full max-w-4xl mx-auto bg-white p-2 rounded-lg shadow-sm flex-1">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                      <SortableEditorBlock key={card.id} cardData={card} voices={voices} onUpdate={updateCard} onRemove={removeCard} isActive={activeCardId === card.id} onClick={setActiveCardId} />
                    ))}
                  </SortableContext>
                </DndContext>
                <div className="flex justify-center mt-4">
                  <button onClick={addCard} className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"><Plus size={24} /></button>
                </div>
              </div>
            </main>
          </div>
          {hasContent && (
            <footer className="bg-white border-t p-4 shadow-inner flex-shrink-0">
              <div className="max-w-6xl mx-auto">
                <Timeline cards={cards} />
              </div>
            </footer>
          )}
        </div>
      );
} 