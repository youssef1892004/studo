'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, TTSCardData } from '@/lib/types';
import AudioPlayer from '@/components/AudioPlayer';
import SettingsSidebar from '@/components/SettingsSidebar';
import { LoaderCircle, Orbit, Plus, Save, Share } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic'; // <-- استيراد دالة التحميل الديناميكي
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

// --- === تم التعديل هنا: تحميل المكون ديناميكيًا === ---
// هذا يخبر Next.js بأن لا يقوم بتحميل هذا المكون على الخادم
const SortableEditorBlock = dynamic(() => import('@/components/SortableEditorBlock'), {
  ssr: false, // الأهم: منع التحميل على الخادم
  loading: () => <div className="text-center p-10 text-gray-500">Loading Editor...</div>,
});
// --- ================================================ ---


export default function StudioProjectPage() {
  // ... باقي الكود يبقى كما هو تمامًا ...
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
        data: { 
          time: Date.now(), 
          blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }] 
        },
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

  // ... (داخل مكون StudioProjectPage)

  const handleGenerate = async () => {
    const blocksForApi = cards
      .map(card => ({
        text: card.data.blocks.map(b => b.data.text).join(' ').trim(),
        provider: "ghaymah",
        voice: card.voice,
      }))
      .filter(item => item.text.length > 0);

    if (blocksForApi.length === 0) return setError('Please enter some text.');
    
    setIsGenerating(true);
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
      const { job_id } = await createJobResponse.json();
      setJobId(job_id);

      const intervalId = setInterval(async () => {
        try {
            const statusResponse = await fetch(`/api/tts/status/${job_id}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
                // --- === تم التعديل هنا === ---
                // نحن الآن نستخدم المسار الجديد الذي قمنا بإنشائه
                setMergedAudioUrl(`/api/tts/result/${job_id}`); 
                
                setIsGenerating(false);
                clearInterval(intervalId);
                setPollingIntervalId(null);

            } else if (statusData.status === 'failed') {
                 setError('Audio generation failed. Please try again.');
                 setIsGenerating(false);
                 clearInterval(intervalId);
                 setPollingIntervalId(null);
            }
        } catch (err) {
            setError('Error checking job status.');
            setIsGenerating(false);
            clearInterval(intervalId);
            setPollingIntervalId(null);
        }
      }, 3000);
      setPollingIntervalId(intervalId);

    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

// ... (باقي الكود)

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

  if (isLoading || authContext?.isLoading || !authContext?.user) {
    return <div className="flex items-center justify-center min-h-screen"><Orbit className="w-12 h-12 animate-spin text-gray-800" /></div>;
  }

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
        <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0">
          <SettingsSidebar voices={voices} onApplyVoice={handleApplyVoice} activeVoiceName={activeCard?.voice} />
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