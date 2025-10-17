'use client';

import { Voice } from '@/lib/types';
import { Check, ChevronDown, Play, Search } from 'lucide-react';

interface SettingsSidebarProps {
  voices: Voice[];
  onApplyVoice: (voiceName: string) => void;
  activeVoiceName?: string;
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

const GenderButton = ({ value, label, currentFilter, setFilter }: { value: string; label: string; currentFilter: string; setFilter: (value: string) => void; }) => (
  <button
    onClick={() => setFilter(value)}
    className={`w-full px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${
      currentFilter === value ? 'bg-gray-900 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

export default function SettingsSidebar({
  voices, onApplyVoice, activeVoiceName, languages, countries,
  genderFilter, setGenderFilter, countryFilter, setCountryFilter, languageFilter, setLanguageFilter,
  searchTerm, setSearchTerm
}: SettingsSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white p-4 space-y-6 font-sans">
      <h2 className="text-xl font-bold text-gray-900 px-1">Voice Library</h2>

      {/* --- قسم البحث والفلاتر --- */}
      <div className="space-y-4 px-1">
        <div className="relative">
          <label htmlFor="voice-search" className="sr-only">Search Voices</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            id="voice-search"
            type="text"
            placeholder="Search voice or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-lg py-2.5 pl-10 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
            <div className="flex w-full bg-gray-100 p-1 rounded-lg space-x-1 rtl:space-x-reverse">
                <GenderButton value="all" label="All" currentFilter={genderFilter} setFilter={setGenderFilter} />
                <GenderButton value="Male" label="Male" currentFilter={genderFilter} setFilter={setGenderFilter} />
                <GenderButton value="Female" label="Female" currentFilter={genderFilter} setFilter={setGenderFilter} />
            </div>
        </div>
        
        <div>
            <label htmlFor="language-filter" className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <div className="relative">
                <select
                    id="language-filter"
                    value={languageFilter}
                    onChange={(e) => setLanguageFilter(e.target.value)}
                    className="w-full appearance-none bg-gray-100 border-none rounded-lg py-2.5 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Languages</option>
                    {languages.map((lang) => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><ChevronDown size={18} /></div>
            </div>
        </div>

        <div>
            <label htmlFor="country-filter" className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
            <div className="relative">
                <select
                    id="country-filter"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full appearance-none bg-gray-100 border-none rounded-lg py-2.5 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Countries</option>
                    {countries.map((country) => (<option key={country.code} value={country.code}>{country.name}</option>))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><ChevronDown size={18} /></div>
            </div>
        </div>
      </div>

      {/* --- قائمة الأصوات --- */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 px-1">
          Voices ({voices.length})
        </h3>
        <ul className="space-y-1 overflow-y-auto pr-1">
          {voices.map((voice) => (
            <li key={voice.name}>
              <button
                onClick={() => onApplyVoice(voice.name)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors duration-200 group ${
                  activeVoiceName === voice.name ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full text-base font-bold ${
                      voice.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                    {voice.characterName.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-semibold transition-colors ${activeVoiceName === voice.name ? 'text-blue-900' : 'text-gray-800'}`}>
                      {voice.characterName}
                    </p>
                    <p className="text-xs text-gray-500">{voice.countryName}</p>
                  </div>
                </div>

                <div className="transition-opacity">
                  {activeVoiceName === voice.name ? (
                    <Check size={18} className="text-blue-600" />
                  ) : (
                    <Play size={18} className="text-gray-400 opacity-0 group-hover:opacity-100 -scale-x-100" />
                  )}
                </div>
              </button>
            </li>
          ))}
          {voices.length === 0 && (
            <p className="text-center text-sm text-gray-500 p-4">
              No voices match your filters.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}