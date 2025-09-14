// File path: src/app/page.tsx
'use client';

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, TTSCardData, Segment } from '@/lib/types';
import AudioPlayer from '@/components/AudioPlayer';
import Timeline from '@/components/Timeline';
import { Plus, LoaderCircle, Play, Orbit } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableVoiceCard from '@/components/SortableVoiceCard';


export default function Home() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [cards, setCards] = useState<TTSCardData[]>([]);
  
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

  // Page Protection Logic
  useEffect(() => {
    if (!authContext) return;
    
    if (!authContext.isLoading && !authContext.user) {
      router.push('/login');
    }
  }, [authContext, router]);


  useEffect(() => {
    async function loadVoices() {
      try {
        const fetchedVoices = await fetchVoices();
        setVoices(fetchedVoices);
        if (fetchedVoices.length > 0) {
          setCards([{ id: uuidv4(), text: 'مرحبًا بك في محرر الصوت.', voice: fetchedVoices[0].name, duration: 0 }]);
        }
      } catch (err) {
        setError('Could not load voices. Please try refreshing the page.');
      }
    }
    if (authContext?.user) {
        loadVoices();
    }
  }, [authContext?.user]);

  const addCard = () => {
    if (voices.length > 0) {
      setCards([...cards, { id: uuidv4(), text: '', voice: voices[0].name, duration: 0 }]);
    }
  };

  const updateCard = (id: string, data: Partial<TTSCardData>) => {
    setCards(cards.map(card => card.id === id ? { ...card, ...data } : card));
  };

  const removeCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleGenerateAll = async () => {
    const itemsToGenerate = cards.filter(card => card.text.trim() !== '');
    if (itemsToGenerate.length === 0) {
      setError('Please enter some text in at least one card.');
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
        const errData = await response.json().catch(() => ({ error: 'An unknown error occurred on the server.' }));
        throw new Error(errData.error || 'Failed to generate merged audio.');
      }

      const { audioUrl, segments } = await response.json();

      setMergedAudioUrl(audioUrl);

      const durationMap = new Map<string, number>(segments.map((segment: Segment) => [segment.id, segment.duration]));

      // Update the cards with the duration
      setCards(prevCards =>
        prevCards.map(card => {
          const newDuration = durationMap.get(card.id);
          return {
            ...card,
            duration: typeof newDuration === 'number' ? newDuration : card.duration || 0,
          };
        })
      );

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const totalDuration = cards.reduce((acc, card) => acc + (card.duration || 0), 0);

  // Loading screen while checking auth
  if (!authContext || authContext.isLoading || !authContext.user) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Orbit className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800">
            Arabic TTS Merger
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Combine multiple text blocks into a single audio file.
          </p>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {voices.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cards}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {cards.map((card) => (
                  <SortableVoiceCard
                    key={card.id}
                    cardData={card}
                    voices={voices}
                    onUpdate={updateCard}
                    onRemove={removeCard}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : !error && (
          <div className="text-center text-gray-500">Loading voices...</div>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={addCard}
            className="flex items-center justify-center w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded-full text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all duration-300"
            aria-label="Add new text-to-speech card"
          >
            <Plus size={32} />
          </button>
        </div>

        <div className="mt-8 flex justify-center">
            <button
                onClick={handleGenerateAll}
                disabled={isLoading || cards.length === 0}
                className="flex items-center justify-center px-8 py-4 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 text-lg"
            >
                {isLoading ? (
                    <><LoaderCircle className="animate-spin mr-3" /> Generating...</>
                ) : (
                    <><Play className="mr-3" /> Generate All</>
                )}
            </button>
        </div>

        {mergedAudioUrl && (
          <section className="mt-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Merged Audio Result</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 space-y-4">
              <Timeline cards={cards} totalDuration={totalDuration} />
              <AudioPlayer audioUrl={mergedAudioUrl} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

