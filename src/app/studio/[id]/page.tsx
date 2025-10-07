// src/app/studio/[id]/page.tsx

'use client';

import { useContext, useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, TTSCardData } from '@/lib/types';
import { Orbit, Play, LoaderCircle } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import { getProjectById, updateProject } from '@/lib/graphql';
import getMP3Duration from 'get-mp3-duration';
import { uploadAudioSegment } from '@/lib/tts';
import toast from 'react-hot-toast';
import ProjectHeader from '@/components/studio/ProjectHeader';
import EditorCanvas from '@/components/studio/EditorCanvas';
import RightSidebar from '@/components/studio/RightSidebar';
import Timeline from '@/components/Timeline';
import GeneratedLinks from '@/components/GeneratedLinks';

const PRO_VOICES_IDS = ['0', '1', '2', '3'];

export default function StudioProjectPage() {
    const [projectTitle, setProjectTitle] = useState("Untitled Project");
    const [voices, setVoices] = useState<(Voice & { isPro?: boolean })[]>([]);
    const [cards, setCards] = useState<TTSCardData[]>([]);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageMessage, setPageMessage] = useState<string | null>(null);
    
    const isInitialLoad = useRef(true);
    
    const [voiceMode, setVoiceMode] = useState<'Free' | 'Pro'>('Free'); 

    const [languageFilter, setLanguageFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    const pollingIntervals = useRef<Record<string, NodeJS.Timeout>>({});
    const authContext = useContext(AuthContext);
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const activeCard = cards.find(c => c.id === activeCardId);

    if (!authContext) {
        throw new Error('AuthContext must be used within an AuthProvider');
    }

    // إضافة ميزة الحفظ التلقائي
    useEffect(() => {
        if (isInitialLoad.current) {
            return;
        }

        const handler = setTimeout(() => {
            console.log("Auto-saving project data...");
            updateProject(projectId, cards, projectTitle)
                .then(() => {
                    toast.success("تم حفظ المشروع تلقائيًا!");
                })
                .catch(err => {
                    console.error("Auto-save failed:", err);
                    toast.error("فشل حفظ المشروع تلقائيًا.");
                });
        }, 2000); 

        return () => {
            clearTimeout(handler);
        };
    }, [cards, projectTitle, projectId]);

    useEffect(() => {
        const intervals = pollingIntervals.current;
        return () => { Object.values(intervals).forEach(clearInterval); };
    }, []);

    useEffect(() => {
      if (!authContext?.isLoading && !authContext?.user) router.push('/login');
    }, [authContext, router]);
  
    useEffect(() => {
      async function loadProjectAndVoices() {
        if (authContext?.user?.id && projectId) {
          setIsLoading(true);
          
          const userId = authContext.user.id; 
          
          try {
            const [fetchedVoices, projectData] = await Promise.all([
              fetchVoices(), 
              getProjectById(projectId) 
            ]);
            
            // التحقق من ملكية المشروع (MODIFIED LOGIC)
            if (!projectData || projectData.userid !== userId) {
                toast.error("خطأ: المشروع غير موجود أو ليس لديك صلاحية الوصول إليه.");
                setError("Project not found or unauthorized access.");
                setIsLoading(false);
                router.push('/projects'); 
                return;
            }
            
            const voicesWithMode = fetchedVoices.map(v => ({
                ...v,
                isPro: PRO_VOICES_IDS.includes(v.name)
            }));

            setVoices(voicesWithMode);

            setProjectTitle(projectData.comments || "Untitled Project");
            const initialCards = (projectData.blocks || []).map((card: any) => ({
                ...card,
                audioUrl: card.persistentAudioUrl, // Use the persistent URL for the waveform
                isGenerating: false,
                isArabic: card.provider === 'ghaymah_pro' || card.arabic === true || PRO_VOICES_IDS.includes(card.voice)
            }));
            setCards(initialCards);
            if (initialCards.length > 0) setActiveCardId(initialCards[0].id);

          } catch (e: any) {
            toast.error(`فشل تحميل بيانات المشروع: ${e.message}`);
            setError(`Failed to load project data: ${e.message}`);
          } finally {
            setIsLoading(false);
            setTimeout(() => { isInitialLoad.current = false; }, 500);
          }
        }
      }
      loadProjectAndVoices();
    }, [authContext?.user?.id, projectId, router]); 

    const addCard = () => {
        if (voices.length > 0) {
            const newCardId = uuidv4();
            
            const isProMode = voiceMode === 'Pro';
            
            const defaultVoice = isProMode 
                ? (voices.find(v => v.isPro)?.name || "0") 
                : (voices.find(v => !v.isPro)?.name || "ar-EG-ShakirNeural"); 

            const newCard: TTSCardData = {
                id: newCardId, 
                voice: defaultVoice,
                data: { 
                  time: Date.now(), 
                  blocks: [{ 
                    id: uuidv4(), 
                    type: 'paragraph', 
                    data: { text: '' } 
                  }] 
                },
                isGenerating: false,
                isArabic: isProMode, 
            };
            setCards([...cards, newCard]);
            setActiveCardId(newCardId);
        }
    };
    
    const updateCard = (id: string, data: Partial<TTSCardData>) => {
        setCards(currentCards => 
            currentCards.map(card => 
              card.id === id ? { ...card, ...data } : card
            )
        );
    };

    const removeCard = (id: string) => {
        setCards(prev => prev.filter(card => card.id !== id));
        if (pollingIntervals.current[id]) {
            clearInterval(pollingIntervals.current[id]);
            delete pollingIntervals.current[id];
        }
    };
    
    const handleApplyVoice = (voiceName: string) => {
      if (activeCardId) {
        const selectedVoice = voices.find(v => v.name === voiceName);
        const isProVoice = selectedVoice?.isPro ?? false;
        
        updateCard(activeCardId, { voice: voiceName, isArabic: isProVoice });
        toast.success(`تم تطبيق الصوت بنجاح.`);
      }
    };
    
    const handleGenerate = async () => {
        const cardsToGenerate = cards.filter(card =>
            card.data.blocks.some(b => b.data.text && b.data.text.trim().length > 0) && 
            !card.isGenerating
        );
        
        if (cardsToGenerate.length === 0) {
            toast.error('أضف نصاً للتوليد، أو انتظر انتهاء العملية الحالية.');
            return;
        }
        
        setIsGenerating(true);
        setError(null);
        
        // [MODIFIED] استخدام toast.loading
        const loadingToastId = toast.loading(`جاري بدء توليد ${cardsToGenerate.length} مقطع صوتي...`);

        const generationPromises = cardsToGenerate.map(card => 
            new Promise<void>(async (resolve, reject) => {
                updateCard(card.id, { 
                  isGenerating: true, 
                  audioUrl: undefined, 
                  duration: undefined 
                });
                
                try {
                    // ... (API call logic remains the same) ...
                    const text = card.data.blocks
                      .map(b => b.data.text)
                      .join(' ')
                      .trim();
                      
                    const isArabic = card.isArabic;

                    const createResponse = await fetch('/api/tts/generate-segment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, voice: card.voice, isArabic }),
                    });
                    
                    if (!createResponse.ok) {
                        const errorData = await createResponse.json();
                        throw new Error(errorData.error || 'Failed to start job.');
                    }
                    
                    const { job_id } = await createResponse.json();
                    
                    updateCard(card.id, { job_id: job_id });

                    pollingIntervals.current[card.id] = setInterval(async () => {
                        try {
                            const statusResponse = await fetch(`/api/tts/status/${job_id}`);
                            if (!statusResponse.ok) {
                              throw new Error(`Status check failed for job ${job_id}`);
                            }
                            
                            const statusData = await statusResponse.json();
                            
                            if (statusData.status === 'completed') {
                                clearInterval(pollingIntervals.current[card.id]);
                                delete pollingIntervals.current[card.id];
                                
                                try {
                                    const audioResponse = await fetch(`/api/tts/result/${job_id}`);
                                    const audioBlob = await audioResponse.blob();
                                    const audioUrl = URL.createObjectURL(audioBlob);
                                    const persistentUrl = await uploadAudioSegment(audioBlob, card.id); 
                                    let durationInSeconds = 0;
                                    try {
                                        const buffer = await audioBlob.arrayBuffer();
                                        const duration = getMP3Duration(Buffer.from(buffer)); 
                                        durationInSeconds = duration / 1000;
                                    } catch (durationError) {
                                        console.error(`Could not calculate MP3 duration for job ${job_id}. This is non-fatal:`, durationError);
                                    }
                                    
                                    updateCard(card.id, { 
                                      isGenerating: false, 
                                      audioUrl, 
                                      persistentAudioUrl: persistentUrl,
                                      duration: durationInSeconds 
                                    });
                                    resolve();
                                } catch (resultError) {
                                    console.error(`Error processing audio result for job ${job_id}:`, resultError);
                                    reject(new Error(`Failed to process audio for job ${job_id}`));
                                }

                            } else if (statusData.status === 'failed') {
                                throw new Error('Audio generation failed on backend.');
                            }
                        } catch (pollError: any) {
                            clearInterval(pollingIntervals.current[card.id]);
                            delete pollingIntervals.current[card.id];
                            // [MODIFIED] استخدام toast.error لإشعار فشل مقطع معين
                            toast.error(`فشل توليد مقطع: ${card.id.substring(0, 4)}. ${pollError.message}`);
                            reject(pollError);
                        }
                    }, 3000);
                } catch (initialError) {
                    updateCard(card.id, { isGenerating: false });
                    reject(initialError);
                }
            })
        );
        
        try {
            await Promise.all(generationPromises);
            // [MODIFIED] تحديث الـ Toast الرئيسي بالنجاح
            toast.success('🎉 تم توليد جميع المقاطع المحددة بنجاح!', { id: loadingToastId });
        } catch(err: any) {
            // [MODIFIED] تحديث الـ Toast الرئيسي بالفشل
            toast.error(err.message || "حدث خطأ أثناء التوليد.", { id: loadingToastId });
            setError(err.message || "An error occurred during generation.");
        } finally {
            setIsGenerating(false);
        }
    };
  
    const handleDownloadAll = async () => {
        const jobIds = cards
            .map(card => card.job_id)
            .filter((id): id is string => !!id);

        if (jobIds.length === 0) {
            toast.error("لم يتم توليد أي مقطع صوتي بعد للتحميل.");
            return;
        }

        const cardsWithAudio = cards.filter(c => c.audioUrl);
        if (jobIds.length !== cardsWithAudio.length) {
            toast.error("بعض المقاطع الصوتية لم يتم توليدها. يرجى إعادة المحاولة.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        
        // [MODIFIED] استخدام toast.loading لعملية الدمج
        const downloadToastId = toast.loading('جاري دمج المقاطع الصوتية وتحميل الملف... قد يستغرق هذا قليلاً.');

        try {
            const response = await fetch('/api/tts/merge-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds }),
            });

            if (!response.ok) {
                // ... (Error handling remains the same) ...
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'فشل دمج الملفات الصوتية.');
                } else {
                    const errorText = await response.text();
                    console.error("Server returned non-JSON error:", errorText);
                    throw new Error('حدث خطأ في الخادم أثناء دمج الصوت.');
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle.replace(/ /g, '_') || 'project'}.mp3`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            // [MODIFIED] تحديث الـ Toast بالنجاح
            toast.success('✅ تم دمج وتنزيل الملف الصوتي بنجاح!', { id: downloadToastId });

        } catch (err: any) {
            // [MODIFIED] تحديث الـ Toast بالفشل
            toast.error(err.message || "حدث خطأ في عملية الدمج والتنزيل.", { id: downloadToastId });
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };
  
    const languages = Array.from(new Map(
      voices.map(v => [v.languageCode, { 
        code: v.languageCode, 
        name: v.languageName 
      }])
    ).values());
    
    const countries = Array.from(new Map(
      voices.map(v => [v.countryCode, { 
        code: v.countryCode, 
        name: v.countryName 
      }])
    ).values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  
    const filteredVoices = voices
      .filter(voice => {
          const langMatch = languageFilter === 'all' || voice.languageCode === languageFilter;
          const countryMatch = countryFilter === 'all' || voice.countryCode === countryFilter;
          const genderMatch = genderFilter === 'all' || voice.gender === genderFilter;
          
          const modeMatch = voiceMode === 'Pro' ? voice.isPro : !voice.isPro;

          return langMatch && countryMatch && genderMatch && modeMatch;
      })
      .filter(voice => {
          if (searchTerm.trim() === '') return true;
          const lowerSearchTerm = searchTerm.toLowerCase();
          return (
              voice.characterName.toLowerCase().includes(lowerSearchTerm) ||
              voice.countryName.toLowerCase().includes(lowerSearchTerm)
          );
      });
  
    if (isLoading || authContext?.isLoading || !authContext?.user) {
      // [MODIFIED] شاشة تحميل مخصصة
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
            <LoaderCircle className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mb-6" />
            <h2 className="text-xl font-semibold">جاري تحميل استوديو الصوت...</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">يُرجى الانتظار بينما نقوم بتحضير مشروعك والأصوات.</p>
        </div>
      );
    }
  
    const hasContent = cards.length > 0;

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans relative transition-colors duration-200"> 
            
            {/* شريط العنوان (ProjectHeader Container) */}
            <div className={`flex-shrink-0 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200`}>
                <ProjectHeader 
                    projectTitle={projectTitle}
                    setProjectTitle={setProjectTitle}
                    isGenerating={isGenerating}
                    handleGenerate={handleGenerate}
                    handleDownloadAll={handleDownloadAll}
                />
            </div>

             <div className={`flex flex-1 overflow-hidden transition-opacity duration-200`}>
                <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                     <EditorCanvas 
                        cards={cards}
                        setCards={setCards}
                        voices={voices}
                        activeCardId={activeCardId}
                        setActiveCardId={setActiveCardId}
                        updateCard={updateCard}
                        removeCard={removeCard}
                        addCard={addCard}
                        error={null} 
                        pageMessage={pageMessage}
                    />
                    <div className="p-4">
                        <GeneratedLinks projectId={projectId} />
                    </div>
                </main>
                
                <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-colors duration-200">
                     <RightSidebar
                        voices={filteredVoices}
                        onApplyVoice={handleApplyVoice}
                        activeVoiceName={activeCard?.voice}
                        languages={languages}
                        countries={countries}
                        languageFilter={languageFilter}
                        setLanguageFilter={setLanguageFilter}
                        countryFilter={countryFilter}
                        setCountryFilter={setCountryFilter}
                        genderFilter={genderFilter}
                        setGenderFilter={setGenderFilter}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        voiceMode={voiceMode}
                        setVoiceMode={setVoiceMode}
                    />
                </div>
            </div>

            {hasContent && (
                    <div className={`flex-shrink-0 h-48 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-inner transition-all duration-200`}>
                    <div className="h-full flex flex-col">
                        <Timeline cards={cards} />
                    </div>
                </div>
            )}
        </div>
    );
}