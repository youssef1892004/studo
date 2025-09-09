
'use client';

import React, { useState, useEffect } from 'react';
import { getVoices, generateSpeech } from '@/lib/tts';
import Button from './ui/button';
import Select from './ui/select';
import Card from './ui/card';
import AudioPlayer from './AudioPlayer';

interface Voice {
  value: string;
  label: string;
}

interface TTSCardProps {
  onGenerationComplete: (audioUrl: string) => void;
}

const TTSCard = ({ onGenerationComplete }: TTSCardProps) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      const fetchedVoices = await getVoices();
      setVoices(fetchedVoices);
      if (fetchedVoices.length > 0) {
        setVoice(fetchedVoices[0].value);
      }
    };
    fetchVoices();
  }, []);

  const handleGenerate = async () => {
    if (!text) return;
    setIsLoading(true);
    setError(null);
    try {
      const audioBlob = await generateSpeech(text, voice);
      const audioUrl = URL.createObjectURL(audioBlob);
      onGenerationComplete(audioUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-col space-y-4">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-lg"
          rows={4}
          placeholder="Enter text to generate speech..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center space-x-4">
          <Select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={voices.length === 0}
          >
            {voices.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </Select>
          <Button onClick={handleGenerate} disabled={isLoading || !text}>
            {isLoading ? 'Generating...' : 'Generate'}
          </Button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </Card>
  );
};

export default TTSCard;
