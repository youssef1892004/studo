'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, TTSCardData } from '@/lib/types';
import VoiceCard from '@/components/VoiceCard';
import AudioPlayer from '@/components/AudioPlayer';
import { Plus, LoaderCircle, Play } from 'lucide-react';

export default function Home() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [cards, setCards] = useState<TTSCardData[]>([]);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVoices() {
      try {
        const fetchedVoices = await fetchVoices();
        setVoices(fetchedVoices);
        // Initialize with one card
        if (fetchedVoices.length > 0) {
          setCards([{ id: uuidv4(), text: '', voice: fetchedVoices[0].name }]);
        }
      } catch (err) {
        setError('Could not load voices. Please try refreshing the page.');
      }
    }
    loadVoices();
  }, []);

  const addCard = () => {
    if (voices.length > 0) {
      setCards([...cards, { id: uuidv4(), text: '', voice: voices[0].name }]);
    }
  };

  const updateCard = (id: string, data: Partial<TTSCardData>) => {
    setCards(cards.map(card => card.id === id ? { ...card, ...data } : card));
  };

  const removeCard = (id: string) => {
    setCards(cards.filter(card => card.id !== id));
  };

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
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate merged audio.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMergedAudioUrl(url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="space-y-6">
            {cards.map((card) => (
              <VoiceCard
                key={card.id}
                cardData={card}
                voices={voices}
                onUpdate={updateCard}
                onRemove={removeCard}
              />
            ))}
            <div className="flex justify-center">
              <button
                onClick={addCard}
                className="flex items-center justify-center w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded-full text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all duration-300"
                aria-label="Add new text-to-speech card"
              >
                <Plus size={32} />
              </button>
            </div>
          </div>
        ) : !error && (
          <div className="text-center text-gray-500">Loading voices...</div>
        )}

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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <AudioPlayer audioUrl={mergedAudioUrl} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
