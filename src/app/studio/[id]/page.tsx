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
// استيراد المكونات
import ProjectHeader from '@/components/studio/ProjectHeader';
import EditorCanvas from '@/components/studio/EditorCanvas';
import RightSidebar from '@/components/studio/RightSidebar';
import Timeline from '@/components/Timeline';
import LoadingScreen from '@/components/LoadingScreen';

export default function StudioProjectPage() {
    const [projectTitle, setProjectTitle] = useState("Untitled Project");
    const [voices, setVoices] = useState<Voice[]>([]);
    const [cards, setCards] = useState<TTSCardData[]>([]);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pageMessage, setPageMessage] = useState<string | null>(null);
    
    // إضافة متغير لتتبع حالة التحميل الأولي
    const isInitialLoad = useRef(true);
    
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
        // لا تقم بالحفظ عند التحميل الأولي للصفحة
        if (isInitialLoad.current) {
            return;
        }

        // إعداد مؤقت لتأجيل الحفظ
        const handler = setTimeout(() => {
            console.log("Auto-saving project data...");
            updateProject(projectId, cards, projectTitle)
                .then(() => {
                    console.log("Project auto-saved successfully.");
                })
                .catch(err => {
                    console.error("Auto-save failed:", err);
                    setError("فشل حفظ المشروع تلقائيًا.");
                });
        }, 2000); // الحفظ بعد ثانيتين من آخر تعديل

        // إلغاء المؤقت السابق عند حدوث تغيير جديد
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
          try {
            const [fetchedVoices, projectData] = await Promise.all([
              fetchVoices(), 
              getProjectById(projectId)
            ]);
            
            setVoices(fetchedVoices);
            if (projectData) {
              setProjectTitle(projectData.comments || "Untitled Project");
              const initialCards = (projectData.blocks || []).map((card: any) => ({
                ...card,
                isGenerating: false,
                // تعيين isArabic إلى true افتراضياً إذا لم تكن موجودة
                isArabic: card.isArabic !== undefined ? card.isArabic : false
              }));
              setCards(initialCards);
              if (initialCards.length > 0) setActiveCardId(initialCards[0].id);
            } else {
              setError("Project not found.");
            }
          } catch (e: any) {
            setError(`Failed to load project data: ${e.message}`);
          } finally {
            setIsLoading(false);
            // تم انتهاء التحميل الأولي
            setTimeout(() => { isInitialLoad.current = false; }, 500);
          }
        }
      }
      loadProjectAndVoices();
    }, [authContext?.user?.id, projectId]);

    const addCard = () => {
        if (voices.length > 0) {
            const newCardId = uuidv4();
            const newCard: TTSCardData = {
                id: newCardId, 
                voice: "ar-EG-ShakirNeural",
                data: { 
                  time: Date.now(), 
                  blocks: [{ 
                    id: uuidv4(), 
                    type: 'paragraph', 
                    data: { text: '' } 
                  }] 
                },
                isGenerating: false,
                isArabic: false, // تعيين isArabic إلى true للبطاقة الجديدة
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
        updateCard(activeCardId, { voice: voiceName });
      }
    };
    
    const handleGenerate = async () => {
        const cardsToGenerate = cards.filter(card =>
            card.data.blocks.some(b => b.data.text && b.data.text.trim().length > 0) && 
            !card.isGenerating
        );
        
        if (cardsToGenerate.length === 0) {
            setError('Add text to generate, or wait for the current process to finish.');
            return;
        }
        
        setIsGenerating(true);
        setLoadingMessage('جاري توليد المقاطع الصوتية... قد يستغرق هذا بعض الوقت.');
        setError(null);
        
        const generationPromises = cardsToGenerate.map(card => 
            new Promise<void>(async (resolve, reject) => {
                updateCard(card.id, { 
                  isGenerating: true, 
                  audioUrl: undefined, 
                  duration: undefined 
                });
                
                try {
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
                                    // === كتلة try...catch لحساب المدة الآمن ===
                                    try {
                                        const buffer = await audioBlob.arrayBuffer();
                                        // استخدام Buffer.from يتطلب بيئة Node.js (وهي متاحة في Next.js)
                                        const duration = getMP3Duration(Buffer.from(buffer)); 
                                        durationInSeconds = duration / 1000;
                                    } catch (durationError) {
                                        console.error(`Could not calculate MP3 duration for job ${job_id}. This is non-fatal:`, durationError);
                                        // نترك المدة 0 أو قيمة افتراضية.
                                    }
                                    // =========================================
                                    
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
        } catch(err: any) {
            setError(err.message || "An error occurred during generation.");
        } finally {
            setIsGenerating(false);
            setLoadingMessage(null);
        }
    };
  
    const handleDownloadAll = async () => {
        const jobIds = cards
            .map(card => card.job_id)
            .filter((id): id is string => !!id);

        if (jobIds.length === 0) {
            setError("لم يتم توليد أي مقطع صوتي بعد للتحميل.");
            return;
        }

        const cardsWithAudio = cards.filter(c => c.audioUrl);
        if (jobIds.length !== cardsWithAudio.length) {
            setError("بعض المقاطع الصوتية لم يتم توليدها. يرجى إعادة المحاولة.");
            return;
        }

        setIsGenerating(true);
        setLoadingMessage('جاري دمج المقاطع الصوتية وتحميل الملف... قد يستغرق هذا قليلاً.');
        setError(null);

        try {
            const response = await fetch('/api/tts/merge-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds }),
            });

            if (!response.ok) {
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

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGenerating(false);
            setLoadingMessage(null);
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
          return langMatch && countryMatch && genderMatch;
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
      return <LoadingScreen message="جاري تحميل المشروع والمكتبة الصوتية..." />;
    }
  
    const hasContent = cards.length > 0;

    // if (error) {
    //     return (
    //         <div className="p-8 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300 h-screen min-h-screen flex items-center justify-center">
    //             <div className="text-center">
    //                 <h2 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-400">حدث خطأ</h2>
    //                 <p className="text-red-600 dark:text-red-300">{error}</p>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans relative transition-colors duration-200"> 
            
            {/* شاشة التحميل عند الضغط على Generate أو Download */}
            {isGenerating && loadingMessage && (
                <LoadingScreen 
                    message={loadingMessage}
                    fullScreen={true} 
                />
            )}
            
            {/* شريط العنوان (ProjectHeader Container) */}
            <div className={`flex-shrink-0 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
                <ProjectHeader 
                    projectTitle={projectTitle}
                    setProjectTitle={setProjectTitle}
                    isGenerating={isGenerating}
                    handleGenerate={handleGenerate}
                    handleDownloadAll={handleDownloadAll}
                />
            </div>

            <div className={`flex flex-1 overflow-hidden transition-opacity duration-200 ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        error={error}
                        pageMessage={pageMessage}
                    />
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
                    />
                </div>
            </div>

            {hasContent && (
                <div className={`flex-shrink-0 h-48 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-inner transition-all duration-200 ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="h-full flex flex-col">
                        <Timeline cards={cards} />
                    </div>
                </div>
            )}
        </div>
    );
}