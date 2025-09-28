'use client';
import { Play, Pause, RotateCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const setAudioData = () => {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
      }
      const setAudioTime = () => setCurrentTime(audio.currentTime);
      const onEnded = () => setIsPlaying(false);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', onEnded);
      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex items-center gap-4 p-2 bg-gray-100 rounded-lg">
      <audio ref={audioRef} src={audioUrl} preload="metadata"></audio>
      <button onClick={togglePlayPause} className="p-2 bg-black text-white rounded-full">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <div className="text-sm font-mono text-gray-600">{formatTime(currentTime)}</div>
      <div className="w-full bg-gray-300 h-1 rounded-full overflow-hidden">
        <div
          className="bg-black h-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      <div className="text-sm font-mono text-gray-600">{formatTime(duration)}</div>
    </div>
  );
};
export default AudioPlayer;