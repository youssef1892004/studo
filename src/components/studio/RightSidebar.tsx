// src/components/studio/RightSidebar.tsx
'use client';

import { Voice } from '@/lib/types';
import { Check, ChevronDown, Play, Search } from 'lucide-react';

// Props Interface
interface RightSidebarProps {
  voices: Voice[];
  onApplyVoice: (voiceName: string) => void;
  activeVoiceName?: string;
  
  // Props for filtering
  languages: { code: string; name: string }[];
  countries: { code: string; name: string }[];
  genderFilter: string;
  setGenderFilter: (gender: string) => void;
  countryFilter: string;
  setCountryFilter: (countryCode: string) => void;
  languageFilter: string;
  setLanguageFilter: (langCode: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const GenderButton = ({ 
  value, 
  label, 
  currentFilter, 
  setFilter 
}: { 
  value: string; 
  label: string; 
  currentFilter: string; 
  setFilter: (value: string) => void; 
}) => (
  <button
    onClick={() => setFilter(value)}
    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors duration-200 ${
      currentFilter === value 
        ? 'bg-gray-900 text-white shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700' 
        : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
    }`}
  >
    {label}
  </button>
);

export default function RightSidebar({
  voices, 
  onApplyVoice, 
  activeVoiceName, 
  languages, 
  countries,
  genderFilter, 
  setGenderFilter, 
  countryFilter, 
  setCountryFilter, 
  languageFilter, 
  setLanguageFilter,
  searchTerm, 
  setSearchTerm
}: RightSidebarProps) {
  return (
   <aside 
     // === تطبيق الوضع الداكن على الشريط الجانبي الأساسي ===
     className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-col h-full overflow-hidden hidden md:flex transition-colors duration-200"
   >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Voice Library</h2>
        </div>

        {/* Filters Section */}
        {/* هذا القسم كان أبيض، والآن الخلفية ستكون رمادية داكنة */}
        <div className="flex-shrink-0 p-3 space-y-3 border-b border-gray-100 dark:border-gray-700">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search voice or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // === تطبيق الوضع الداكن على حقل البحث ===
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-2 pl-9 pr-3 text-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
            {/* تطبيق الوضع الداكن على مجموعة الأزرار */}
            <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded-md gap-0.5">
              <GenderButton value="all" label="All" currentFilter={genderFilter} setFilter={setGenderFilter} />
              <GenderButton value="Male" label="Male" currentFilter={genderFilter} setFilter={setGenderFilter} />
              <GenderButton value="Female" label="Female" currentFilter={genderFilter} setFilter={setGenderFilter} />
            </div>
          </div>
          
          {/* Language Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Language</label>
            <div className="relative">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                 // === تطبيق الوضع الداكن على حقل الاختيار ===
                className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 pr-8 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
            <div className="relative">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                 // === تطبيق الوضع الداكن على حقل الاختيار ===
                className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-2 px-3 pr-8 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Countries</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {/* Voices List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Voices ({voices.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {voices.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  No voices match your filters
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {voices.map((voice) => (
                  <button
                    key={voice.name}
                    onClick={() => onApplyVoice(voice.name)}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all duration-200 group 
                      ${activeVoiceName === voice.name 
                        ? 'bg-blue-50 border border-blue-200 shadow-sm dark:bg-blue-900/40 dark:border-blue-800' 
                        : 'hover:bg-gray-50 border border-transparent dark:hover:bg-gray-700'
                      }`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      voice.gender === 'Male' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-white' 
                        : 'bg-pink-100 text-pink-700 dark:bg-pink-700 dark:text-white'
                    }`}>
                      {voice.characterName.charAt(0)}
                    </div>
                    
                    {/* Voice Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${
                        activeVoiceName === voice.name 
                          ? 'text-blue-900 dark:text-white' 
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {voice.characterName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {voice.countryName}
                      </p>
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {activeVoiceName === voice.name ? (
                        <Check size={16} className="text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Play size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}