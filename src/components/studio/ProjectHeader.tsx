// src/components/studio/ProjectHeader.tsx
'use client';

import { ArrowLeft, Download, Play, LoaderCircle } from 'lucide-react'; // تم حذف RotateCcw, RotateCw, Clock, Share, MoreHorizontal
import { useRouter } from 'next/navigation';

interface ProjectHeaderProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
  handleDownloadAll: () => void;
}

export default function ProjectHeader({ 
  projectTitle, setProjectTitle, isGenerating, handleGenerate, handleDownloadAll
}: ProjectHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 h-full">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/projects')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Back to projects">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <input 
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="text-lg font-semibold text-gray-800 bg-transparent focus:outline-none focus:ring-0 border-0"
          placeholder="Project name"
        />
        {/* تم حذف أزرار التراجع والإعادة */}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleGenerate} disabled={isGenerating} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-gray-400 flex items-center gap-2">
          {isGenerating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
        
        {/* تم حذف أزرار السجل والمشاركة والمزيد */}
        
        <button onClick={handleDownloadAll} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Download All">
           <Download className="w-5 h-5 text-gray-700" />
        </button>
        
      </div>
    </div>
  );
}