
import React from 'react';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  return (
    <audio controls src={audioUrl} className="w-full" />
  );
};

export default AudioPlayer;
