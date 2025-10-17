// src/components/studio/ProjectHeader.tsx
'use client';

import { ArrowRight, Download, Play, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Subscription } from '@/lib/types';
import SubscriptionStatus from '@/components/SubscriptionStatus';

interface ProjectHeaderProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  projectDescription: string;
  setProjectDescription: (description: string) => void;
  isGenerating: boolean;
  isGenerateDisabled?: boolean;
  handleGenerate: () => void;
  handleDownloadAll: () => void;
  subscription: Subscription | null;
}

export default function ProjectHeader({ 
  projectTitle, setProjectTitle, projectDescription, setProjectDescription, isGenerating, isGenerateDisabled, handleGenerate, handleDownloadAll, subscription
}: ProjectHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 h-full w-full">
      <div className="flex items-center gap-4"> 
        <button onClick={() => router.push('/projects')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Back to projects">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex flex-col">
          <input 
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="text-md font-semibold text-gray-800 bg-transparent focus:outline-none focus:ring-0 border-0 p-0"
            placeholder="Project name"
          />
          <input 
            type="text"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="text-xs text-gray-500 bg-transparent focus:outline-none focus:ring-0 border-0 p-0"
            placeholder="Project description..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {subscription && <SubscriptionStatus subscription={subscription} />}
        <button onClick={handleGenerate} disabled={isGenerateDisabled ?? isGenerating} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-lg transition-colors disabled:bg-gray-400 flex items-center gap-2">
          {isGenerating ? 'Generating...' : 'Generate'}
          {isGenerating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 -scale-x-100" />}
        </button>
        
        <button onClick={handleDownloadAll} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Download All">
           <Download className="w-5 h-5 text-gray-700" />
        </button>
        
      </div>
    </div>
  );
}