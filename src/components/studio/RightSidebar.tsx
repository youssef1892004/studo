import { Voice } from '@/lib/types';
import { Check, CheckCircle, ChevronDown, Play, Search, ThumbsUp, X, User, Users } from 'lucide-react';

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
}

const GenderButton = ({ label, value, currentFilter, onClick, icon: Icon }: {
  label: string;
  value: string;
  currentFilter: string;
  onClick: (value: string) => void;
  icon: React.ElementType;
}) => (
  <button
    onClick={() => onClick(value)}
    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
      currentFilter === value
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);

export default function RightSidebar({
  voices,
  onApplyVoice,
  activeVoiceName,
  isOpen,
  onToggle,
  languages,
  countries,
  providers,
  genderFilter,
  setGenderFilter,
  countryFilter,
  setCountryFilter,
  languageFilter,
  setLanguageFilter,
  providerFilter,
  setProviderFilter,
  enableTashkeel,
  setEnableTashkeel,
  searchTerm,
  setSearchTerm,
}: RightSidebarProps) {

  return (
    <aside 
      className={`w-full sm:w-[500px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-col h-full overflow-hidden transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} fixed right-0 top-0 bottom-0 z-30 md:relative md:flex md:translate-x-0`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Voice Library</h2>
          <button 
              onClick={onToggle}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Close Sidebar"
          >
              <X size={20} />
          </button>
        </div>

        {/* Filters Section */}
        <div className="flex-shrink-0 p-4 space-y-4 border-b border-gray-100 dark:border-gray-700">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search voice or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 text-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Provider Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
              <div className="relative">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 capitalize"
                >
                  <option value="all">All Providers</option>
                  {providers.map((provider) => (
                    <option key={provider} value={provider} className="capitalize">
                      {provider}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Enable Tashkeel Switch */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50">
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">تفعيل التشكيل</label>
              <button
                onClick={() => setEnableTashkeel(!enableTashkeel)}
                className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors duration-300 focus:outline-none ${enableTashkeel ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ${enableTashkeel ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Gender Filter */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl space-x-1">
                <GenderButton label="All" value="all" currentFilter={genderFilter} onClick={setGenderFilter} icon={Users} />
                <GenderButton label="Male" value="Male" currentFilter={genderFilter} onClick={setGenderFilter} icon={User} />
                <GenderButton label="Female" value="Female" currentFilter={genderFilter} onClick={setGenderFilter} icon={User} />
              </div>
            </div>
            
            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
              <div className="relative">
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Languages</option>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Countries</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>
        </div>

        {/* Voices List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {Object.entries(voices.reduce((acc, voice) => {
            const provider = voice.provider || 'Unknown';
            if (!acc[provider]) {
              acc[provider] = [];
            }
            acc[provider].push(voice);
            return acc;
          }, {} as Record<string, Voice[]>)).map(([provider, providerVoices]) => (
            <div key={provider}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700 z-10 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {provider} ({providerVoices.length})
                </h3>
              </div>
              <div className="px-1 space-y-1 pb-4">
                {providerVoices.length > 0 ? (
                  providerVoices.map((voice: Voice) => (
                    <div 
                      key={voice.name} 
                      onClick={() => onApplyVoice(voice.name)}
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors duration-150 
                        ${activeVoiceName === voice.name 
                          ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <div className="flex items-center space-x-4 text-right">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 font-bold rounded-full text-lg flex-shrink-0">
                          {voice.characterName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2"> 
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{voice.characterName}</p>
                                {voice.isPro && (
                                    <CheckCircle 
                                        className="text-blue-600 dark:text-blue-400 flex-shrink-0" 
                                        size={14} 
                                    />
                                )}
                                {voice.languageCode === 'ar' && (
                                    <ThumbsUp 
                                        className="text-green-600 dark:text-green-400 flex-shrink-0" 
                                        size={14} 
                                    />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {voice.provider} &middot; {voice.countryName} ({voice.gender})
                            </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Preview"
                        >
                            <Play size={16} />
                        </button>
                        {activeVoiceName === voice.name && (
                          <Check className="text-blue-600 dark:text-blue-400" size={20} />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No voices found for this provider.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}