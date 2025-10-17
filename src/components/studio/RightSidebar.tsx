// src/components/studio/RightSidebar.tsx

import { Voice } from '@/lib/types';
import { Check, ChevronDown, Play, Search, ThumbsUp, X, Users, LoaderCircle, Star, Sparkles, ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

// Props Interface
interface RightSidebarProps {
  voices: Voice[];
  onApplyVoice: (voiceName: string) => void;
  activeVoiceName?: string;
  isOpen: boolean;
  onToggle: () => void;
  languages: { code: string; name: string }[];
  countries: { code: string; name: string }[];
  providers: string[];
  genderFilter: string;
  setGenderFilter: (gender: string) => void;
  countryFilter: string;
  setCountryFilter: (countryCode: string) => void;
  languageFilter: string;
  setLanguageFilter: (langCode: string) => void;
  providerFilter: string;
  setProviderFilter: (provider: string) => void;
  enableTashkeel: boolean;
  setEnableTashkeel: (value: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  maintenanceVoices: string[];
}

// === Voice Card Component ===
const VoiceCardItem: React.FC<{
    voice: Voice;
    activeVoiceName: string | undefined;
    onApply: (name: string) => void;
    onToggleFavorite: (name: string) => void;
    isFavorite: boolean;
    isUnderMaintenance: boolean;
}> = ({ voice, activeVoiceName, onApply, onToggleFavorite, isFavorite, isUnderMaintenance }) => {
    const isSelected = activeVoiceName === voice.name;
    const [isPreviewing, setIsPreviewing] = useState(false);

    const handlePreviewClick = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPreviewing) return;

        setIsPreviewing(true);
        
        try {
            const response = await fetch('/api/tts/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voice: voice.name, text: 'أهلاً بك، يمكنك الآن الاستماع إلى صوتي لتجربته.' }),
            });

            if (!response.ok) {
                throw new Error('Preview request failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.play();
            
            audio.onended = () => {
                setIsPreviewing(false);
                URL.revokeObjectURL(audioUrl); 
            };
            audio.onerror = () => {
                 setIsPreviewing(false);
                 URL.revokeObjectURL(audioUrl); 
                 console.error("Audio playback error.");
            }
        } catch (error) {
            console.error("Preview failed:", error);
            setIsPreviewing(false);
        }
    }, [isPreviewing, voice.name]);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite(voice.name);
    };

    return (
        <div
            onClick={isUnderMaintenance ? undefined : () => onApply(voice.name)}
            title={isUnderMaintenance ? "This voice is under maintenance" : `Select ${voice.characterName}`}
            className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 
                ${isUnderMaintenance 
                    ? 'opacity-60 cursor-not-allowed' 
                    : isSelected 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
                        : 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md border border-gray-100 dark:border-gray-700/50'
                }
            `}
        >
            {isUnderMaintenance && (
               <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-10 rounded-xl">
                   <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Under Maintenance</span>
               </div>
            )}
            {/* Avatar */}
            <div className={`relative w-11 h-11 flex items-center justify-center font-bold rounded-xl text-sm flex-shrink-0 shadow-sm ${
                voice.isPro 
                    ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white' 
                    : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-200'
            }`}>
                {voice.characterName.charAt(0).toUpperCase()}
                {voice.isPro && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                        <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                )}
            </div>
            
            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={voice.characterName}>
                        {voice.characterName}
                    </p>
                    {voice.languageCode === 'ar' && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-[10px] font-medium text-green-700 dark:text-green-400">
                            AR
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={`${voice.provider} · ${voice.countryName} (${voice.gender})`}>
                    {voice.provider} · {voice.countryName}
                </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                    onClick={handleFavoriteClick}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-pink-100 dark:hover:bg-pink-900/40"
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Heart
                        size={16}
                        className={`transition-colors ${isFavorite ? 'text-pink-500 fill-current' : 'text-gray-600 dark:text-gray-300'}`}
                    />
                </button>
                <button
                    onClick={handlePreviewClick}
                    disabled={isPreviewing}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                        isPreviewing 
                            ? 'bg-blue-100 dark:bg-blue-900/40' 
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Preview Voice"
                >
                    {isPreviewing ? 
                        <LoaderCircle size={16} className="animate-spin text-blue-600 dark:text-blue-400" /> 
                        : 
                        <Play size={16} className="text-gray-600 dark:text-gray-300 -scale-x-100" />
                    }
                </button>
                {isSelected && (
                    <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg shadow-md">
                        <Check className="text-white" size={16} />
                    </div>
                )}
            </div>
        </div>
    );
};
// === END Voice Card Component ===

export default function RightSidebar({
  voices,
  onApplyVoice,
  activeVoiceName,
  isOpen,
  onToggle,
  languages,
  countries,
  providers,
  countryFilter,
  setCountryFilter,
  languageFilter,
  setLanguageFilter,
  providerFilter,
  setProviderFilter,
  searchTerm,
  setSearchTerm,
  maintenanceVoices,
  enableTashkeel,
  setEnableTashkeel,
}: RightSidebarProps) {
    const [showVoiceLibrary, setShowVoiceLibrary] = useState(false);
    const [recentVoices, setRecentVoices] = useState<Voice[]>([]);
    const [favoriteVoices, setFavoriteVoices] = useState<string[]>([]);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

    useEffect(() => {
        const storedRecent = localStorage.getItem('recentVoices');
        if (storedRecent) {
            try {
                const recentVoiceNames = JSON.parse(storedRecent) as string[];
                const recentVoiceObjects = recentVoiceNames
                    .map(name => voices.find(v => v.name === name))
                    .filter((v): v is Voice => !!v);
                setRecentVoices(recentVoiceObjects);
            } catch (error) {
                console.error("Failed to parse recent voices from localStorage", error);
                localStorage.removeItem('recentVoices');
            }
        }

        const storedFavorites = localStorage.getItem('favoriteVoices');
        if (storedFavorites) {
            try {
                setFavoriteVoices(JSON.parse(storedFavorites));
            } catch (e) {
                localStorage.removeItem('favoriteVoices');
            }
        }
    }, [voices]);

    const handleToggleFavorite = (voiceName: string) => {
        const newFavorites = favoriteVoices.includes(voiceName)
            ? favoriteVoices.filter(name => name !== voiceName)
            : [...favoriteVoices, voiceName];
        
        setFavoriteVoices(newFavorites);
        localStorage.setItem('favoriteVoices', JSON.stringify(newFavorites));
    };

    const handleApplyVoice = (voiceName: string) => {
        const storedRecent = localStorage.getItem('recentVoices');
        let recentVoiceNames: string[] = [];
        if (storedRecent) {
            try {
                recentVoiceNames = JSON.parse(storedRecent) as string[];
            } catch (error) {
                console.error("Failed to parse recent voices from localStorage", error);
                recentVoiceNames = [];
            }
        }

        recentVoiceNames = recentVoiceNames.filter(name => name !== voiceName);
        recentVoiceNames.unshift(voiceName);
        const recentNamesToStore = recentVoiceNames.slice(0, 10);
        localStorage.setItem('recentVoices', JSON.stringify(recentNamesToStore));

        const recentVoiceObjects = recentNamesToStore
            .map(name => voices.find(v => v.name === name))
            .filter((v): v is Voice => !!v);
        setRecentVoices(recentVoiceObjects);

        onApplyVoice(voiceName);
    };
    
    const voicesToDisplay = showOnlyFavorites
        ? voices.filter(v => favoriteVoices.includes(v.name))
        : voices;

    const groupedVoices = voicesToDisplay.reduce((acc, voice) => {
        const provider = voice.provider || 'AI Voice Studio';
        if (!acc[provider]) {
            acc[provider] = [];
        }
        acc[provider].push(voice);
        return acc;
    }, {} as Record<string, Voice[]>);

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase() !== 'unknown' && lang.name.toLowerCase() !== 'global'
    );

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase() !== 'unknown' && country.name.toLowerCase() !== 'global'
    );


  return (
    <aside 
      className={`w-full sm:w-[420px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-l border-gray-200 dark:border-gray-700 flex-col h-full overflow-hidden transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} fixed right-0 top-0 bottom-0 z-30 md:relative md:flex md:translate-x-0 shadow-2xl md:shadow-none`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {showVoiceLibrary && (
                <button
                  onClick={() => setShowVoiceLibrary(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowRight size={18} className="text-gray-700 dark:text-gray-300" />
                </button>
              )}
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                <Sparkles size={18} className="text-white" />
              </div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {showVoiceLibrary ? 'Select a Voice' : 'Edit Speech'}
              </h2>
            </div>
            <button 
              onClick={onToggle}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
              title="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {!showVoiceLibrary ? (
          /* Main View */
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Current Voice Selection */}
            <div>
              <div 
                onClick={() => setShowVoiceLibrary(true)}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {voices.find(v => v.name === activeVoiceName)?.characterName.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {voices.find(v => v.name === activeVoiceName)?.characterName || activeVoiceName || 'Chris'}
                  </span>
                </div>
                <ChevronDown size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
              
                          {/* Tashkeel Toggle */}
                          <div>
                                              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Enable Tashkeel (Arabic Vowels)</h3>
                                                  <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={enableTashkeel} onChange={() => setEnableTashkeel(!enableTashkeel)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                                  </label>
                                              </div>                          </div>
              
                          {/* Select Used Voice */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Select used voice</h3>
              </div>
              <div className="space-y-2">
                {recentVoices.slice(0, 2).map((voice) => (
                  <div 
                    key={voice.name}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                        {voice.characterName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{voice.characterName}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => handleToggleFavorite(voice.name)}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-pink-100 dark:hover:bg-pink-900/40"
                            title={favoriteVoices.includes(voice.name) ? "Remove from favorites" : "Add to favorites"}
                        >
                            <Heart
                                size={16}
                                className={`transition-colors ${favoriteVoices.includes(voice.name) ? 'text-pink-500 fill-current' : 'text-gray-600 dark:text-gray-300'}`}
                            />
                        </button>
                        <button
                          onClick={() => handleApplyVoice(voice.name)}
                          className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Apply
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Tools */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Tools</h3>
                <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div className="space-y-2 opacity-50 cursor-not-allowed">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Remove background audio</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Use voice isolator to clean up audio.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Use voice changer</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Modify voice in existing audio.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Voice Library View */
          <>
            {/* Filters Section */}
            <div className="flex-shrink-0 p-4 space-y-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Search voices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                  />
                </div>

                {/* All Saved Voices Button */}
                <button 
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm hover:shadow-md group ${showOnlyFavorites ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500'}`}>
                  <div className="flex items-center gap-3">
                    <Heart size={18} className={`transition-colors ${showOnlyFavorites ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'}`} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">All saved voices</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
                </button>

                {/* Language & Dialect */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative group">
                      <select
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="block w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm capitalize cursor-pointer transition-all"
                      >
                        <option value="all">All Languages</option>
                        {filteredLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code} className="capitalize">
                            {lang.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={16} />
                    </div>

                    <div className="relative group">
                      <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="block w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-8 pr-3 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm cursor-pointer transition-all"
                      >
                        <option value="all">All Dialects</option>
                        {filteredCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={16} />
                    </div>
                </div>
                
                {/* Provider */}
                <div className="relative group">
                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="block w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm capitalize cursor-pointer transition-all"
                  >
                    <option value="all">All Providers</option>
                    {providers.map((provider) => (
                      <option key={provider} value={provider} className="capitalize">
                        {provider}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={16} />
                </div>
            </div>

            {/* Voice List */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {Object.entries(groupedVoices).map(([provider, providerVoices]) => (
                <div key={provider}>
                  <div className="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/80 backdrop-blur-md px-4 py-3 border-b border-gray-200 dark:border-gray-700 z-10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        {provider}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        View all
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    {providerVoices.length > 0 ? (
                      providerVoices.map((voice: Voice) => (
                        <VoiceCardItem
                            key={voice.name} 
                            voice={voice}
                            activeVoiceName={activeVoiceName}
                            onApply={(name) => {
                              handleApplyVoice(name);
                              setShowVoiceLibrary(false);
                            }}
                            onToggleFavorite={handleToggleFavorite}
                            isFavorite={favoriteVoices.includes(voice.name)}
                            isUnderMaintenance={voice.provider === 'ghaymah' && maintenanceVoices.includes(voice.name)}
                        />
                      ))
                    ) : (
                      <div className="p-6 text-center">
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                            {showOnlyFavorites ? "You haven't saved any voices yet." : "No voices found for these filters."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {!showVoiceLibrary && (
          /* Footer - Only show in main view */
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <button 
              onClick={() => setShowVoiceLibrary(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                  <Users size={18} className="text-gray-600 dark:text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">All saved voices</p>
              </div>
              <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}