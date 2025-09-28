import { TTSCardData as AudioResultType } from '@/lib/types';
import { Download } from 'lucide-react';

interface AudioResultProps {
  result: AudioResultType;
}

export default function AudioResult({ result }: AudioResultProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex-grow">
        <p className="font-semibold text-gray-800 truncate" title={result.text}>
          {result.text}
        </p>
        <p className="text-sm text-gray-500">
          {result.voice}
          {result.createdAt && ` - ${new Date(result.createdAt).toLocaleString()}`}
        </p>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <audio controls src={result.audioUrl} className="w-full sm:w-64" />
        <a
          href={result.audioUrl}
          download={`tts-audio-${result.id}.mp3`}
          className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Download audio"
        >
          <Download />
        </a>
      </div>
    </div>
  );
}
