'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, TTSCardData } from '@/lib/types';
import AudioPlayer from '@/components/AudioPlayer';
import SettingsSidebar from '@/components/SettingsSidebar';
import { LoaderCircle, Orbit, Plus, Save, Share, CheckCircle2, XCircle } from 'lucide-react';
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

const SortableEditorBlock = dynamic(() => import('@/components/SortableEditorBlock'), {
  ssr: false, 
  loading: () => <div className="text-center p-10 text-gray-500">Loading Editor...</div>,
});

// --- نوع جديد لتتبع حالة التوليد ---
type GenerationStatus = 'idle' | 'creating' | 'polling' | 'completed' | 'failed';

// --- تم نقل المكون هنا (خارج المكون الرئيسي) لحل مشكلة الشاشة البيضاء ---
const GenerationStatusIndicator = ({ status }: { status: GenerationStatus }) => {
    if (status === 'idle') return null;

    const messages: Record<GenerationStatus, { icon: React.ReactNode; text: string; }> = {
      idle: { icon: null, text: '' },
      creating: { icon: <LoaderCircle className="animate-spin" />, text: 'جاري إنشاء المهمة...' },
      polling: { icon: <LoaderCircle className="animate-spin" />, text: 'جاري معالجة الصوت...' },
      completed: { icon: <CheckCircle2 className="text-green-500" />, text: 'اكتمل بنجاح!' },
      failed: { icon: <XCircle className="text-red-500" />, text: 'فشلت العملية. حاول مرة أخرى.' },
    };

    const currentStatus = messages[status];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 flex items-center space-x-4 rtl:space-x-reverse min-w-[250px]">
                <div className="text-2xl">{currentStatus.icon}</div>
                <p className="text-lg font-semibold text-gray-800">{currentStatus.text}</p>
            </div>
        </div>
    );
};


export default function StudioProjectPage() {
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [cards, setCards] = useState<TTSCardData[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  
  const [languageFilter, setLanguageFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');

  const [jobId, setJobId] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

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
            setCards(projectData.blocks || []);
            if (projectData.blocks && projectData.blocks.length > 0) {
              setActiveCardId(projectData.blocks[0].id);
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

  useEffect(() => {
    return () => {
      if (pollingIntervalId) clearInterval(pollingIntervalId);
    };
  }, [pollingIntervalId]);

  const addCard = () => {
    if (voices.length > 0) {
      const newCardId = uuidv4();
      const newCard: TTSCardData = {
        id: newCardId, 
        voice: voices[0].name,
        data: { time: Date.now(), blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }] },
      };
      setCards([...cards, newCard]);
      setActiveCardId(newCardId);
    }
  };
  
  const updateCard = (id: string, data: Partial<TTSCardData>) => setCards(c => c.map(card => (card.id === id ? { ...card, ...data } : card)));
  const removeCard = (id: string) => setCards(prev => prev.filter(card => card.id !== id));
  const handleApplyVoice = (voiceName: string) => activeCardId && updateCard(activeCardId, { voice: voiceName });

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex(item => item.id === active.id);
      const newIndex = cards.findIndex(item => item.id === over.id);
      setCards(arrayMove(cards, oldIndex, newIndex));
    }
  }

  const handleGenerate = async () => {
    const blocksForApi = cards
      .map(card => ({
        text: card.data.blocks.map(b => b.data.text).join(' ').trim(),
        provider: "ghaymah",
        voice: card.voice,
      }))
      .filter(item => item.text.length > 0);

    if (blocksForApi.length === 0) {
      setError('Please enter some text.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStatus('creating');
    setError(null);
    setMergedAudioUrl(null);
    if (pollingIntervalId) clearInterval(pollingIntervalId);

    try {
      const createJobResponse = await fetch('/api/tts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blocksForApi),
      });

      if (!createJobResponse.ok) throw new Error((await createJobResponse.json()).error || "Failed to start job.");
      
      setGenerationStatus('polling');
      const { job_id } = await createJobResponse.json();
      setJobId(job_id);

      const intervalId = setInterval(async () => {
        try {
            const statusResponse = await fetch(`/api/tts/status/${job_id}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
                setMergedAudioUrl(`/api/tts/result/${job_id}`); 
                setGenerationStatus('completed');
                setIsGenerating(false);
                clearInterval(intervalId);
                setPollingIntervalId(null);
                setTimeout(() => setGenerationStatus('idle'), 2000);
            } else if (statusData.status === 'failed') {
                 setError('Audio generation failed. Please try again.');
                 setGenerationStatus('failed');
                 setIsGenerating(false);
                 clearInterval(intervalId);
                 setPollingIntervalId(null);
                 setTimeout(() => setGenerationStatus('idle'), 3000);
            }
        } catch (err) {
            setError('Error checking job status.');
            setGenerationStatus('failed');
            setIsGenerating(false);
            clearInterval(intervalId);
            setPollingIntervalId(null);
            setTimeout(() => setGenerationStatus('idle'), 3000);
        }
      }, 3000);
      setPollingIntervalId(intervalId);

    } catch (err: any) {
      setError(err.message);
      setGenerationStatus('failed');
      setIsGenerating(false);
      setTimeout(() => setGenerationStatus('idle'), 3000);
    }
  };

  const handleSaveProject = async () => {
    if (!authContext?.user?.id || !projectId) return setError("Cannot save. No user or project ID found.");
    setIsSaving(true);
    setError(null);
    setPageMessage(null);
    try {
      await updateProject(projectId, cards, projectTitle);
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-100 font-sans">
      <GenerationStatusIndicator status={generationStatus} />
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
      {mergedAudioUrl && (
        <footer className="bg-white border-t p-4 shadow-inner flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <AudioPlayer audioUrl={mergedAudioUrl} />
          </div>
        </footer>
      )}
    </div>
  );
}