'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, TTSCardData } from '@/lib/types';
import AudioPlayer from '@/components/AudioPlayer';
import SettingsSidebar from '@/components/SettingsSidebar';
import { LoaderCircle, Orbit, Plus } from 'lucide-react'; // تم إزالة Download لأنها موجودة في Navbar
import { AuthContext } from '@/contexts/AuthContext';
import SortableEditorBlock from '@/components/SortableEditorBlock';
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

export default function Home() {
  // ... (كل الأكواد والحالات السابقة تبقى كما هي)
  const [voices, setVoices] = useState<Voice[]>([]);
  const [cards, setCards] = useState<TTSCardData[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authContext = useContext(AuthContext);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeCard = cards.find(c => c.id === activeCardId);

  useEffect(() => {
    if (!authContext?.isLoading && !authContext?.user) {
      router.push('/login');
    }
  }, [authContext, router]);

  useEffect(() => {
    async function loadVoices() {
      try {
        const fetchedVoices = await fetchVoices();
        setVoices(fetchedVoices);
        if (fetchedVoices.length > 0) {
          const firstCardId = uuidv4();
          const initialData = {
              time: new Date().getTime(),
              blocks: [
                  {
                      id: uuidv4(),
                      type: 'paragraph',
                      data: { text: 'بنية تحتية سحابية تعيد تعريف الخصوصية والأداء والموثوقية الرقمية العربية، بدون تعقيد، بدون تنازلات.' },
                  },
              ],
          };
          setCards([{ id: firstCardId, voice: fetchedVoices[1].name, data: initialData }]);
          setActiveCardId(firstCardId);
        }
      } catch (err) {
        setError('Could not load voices.');
      }
    }
    if (authContext?.user) {
      loadVoices();
    }
  }, [authContext?.user]);

  const addCard = () => {
    if (voices.length > 0) {
      const newCardId = uuidv4();
      const newCard: TTSCardData = {
        id: newCardId,
        voice: voices[0].name,
        data: {
          time: new Date().getTime(),
          blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }],
        },
      };
      setCards([...cards, newCard]);
      setActiveCardId(newCardId);
    }
  };
  
  const updateCard = (id: string, data: Partial<TTSCardData>) => {
    setCards(cards.map(card => (card.id === id ? { ...card, ...data } : card)));
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };
  
  const handleApplyVoice = (voiceName: string) => {
    if (activeCardId) {
      updateCard(activeCardId, { voice: voiceName });
    }
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleGenerate = async () => {
    const itemsToGenerate = cards
      .map(card => ({
        id: card.id,
        text: card.data.blocks.map(block => block.data.text).join(' ').trim(),
        voice: card.voice,
      }))
      .filter(item => item.text.length > 0);

    if (itemsToGenerate.length === 0) {
      setError('Please enter some text before generating.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMergedAudioUrl(null);

    try {
      const response = await fetch('/api/tts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemsToGenerate),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
        throw new Error(errData.error || 'Failed to generate merged audio.');
      }
      const { audioUrl } = await response.json();
      setMergedAudioUrl(audioUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authContext?.isLoading || !authContext?.user) {
    return <div className="flex items-center justify-center min-h-screen"><Orbit className="w-12 h-12 animate-spin" /></div>;
  }
  
  // --- === التعديل الرئيسي هنا: تعديل الـ Layout === ---
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-100 font-sans"> {/* Navbar height is 4rem */}
      
      {/* --- 🛑 تم حذف الـ Header من هنا --- */}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r border-gray-200 flex-shrink-0">
          <SettingsSidebar voices={voices} onApplyVoice={handleApplyVoice} activeVoiceName={activeCard?.voice} />
        </aside>

        <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto">
          {/* --- Generate Button moved inside the main content area --- */}
          <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800">Untitled Project</h2>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex items-center justify-center px-6 py-2 bg-gray-800 text-white font-semibold rounded-md shadow-sm hover:bg-black disabled:bg-gray-400"
              >
              {isLoading ? <LoaderCircle className="animate-spin" /> : 'Generate'}
            </button>
          </div>

          <div className="w-full max-w-4xl mx-auto bg-white p-4 rounded-lg shadow-sm">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {cards.map((card) => (
                  <SortableEditorBlock
                    key={card.id}
                    cardData={card}
                    voices={voices}
                    onUpdate={updateCard}
                    onRemove={removeCard}
                    isActive={activeCardId === card.id}
                    onClick={setActiveCardId}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <div className="flex justify-center mt-4">
              <button onClick={addCard} className="p-2 text-gray-400 hover:text-blue-500"><Plus size={24} /></button>
            </div>
          </div>
           {error && (
            <div className="max-w-4xl mx-auto mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
              <span>{error}</span>
            </div>
          )}
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