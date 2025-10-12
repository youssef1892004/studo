// src/app/studio/[id]/page.tsx

'use client';

// تعريف متغير التحكم بطلبات السجلات قبل أي import أو دالة
let recordsController: AbortController | null = null;

import { useContext, useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, StudioBlock } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';
import { getProjectById, updateProject, getBlocksByProjectId, upsertBlock, deleteBlockByIndex, deleteBlock, subscribeToBlocks } from '@/lib/graphql';
import getMP3Duration from 'get-mp3-duration';
import { uploadAudioSegment } from '@/lib/tts';
import toast from 'react-hot-toast';
import ProjectHeader from '@/components/studio/ProjectHeader';
import EditorCanvas from '@/components/studio/EditorCanvas';
import RightSidebar from '@/components/studio/RightSidebar';
import Timeline from '@/components/Timeline';
import CenteredLoader from '@/components/CenteredLoader';

const PRO_VOICES_IDS = ['0', '1', '2', '3'];

const proVoices: (Voice & { isPro?: boolean })[] = [
    { name: '0', characterName: 'كريم', gender: 'Male', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
    { name: '1', characterName: 'طارق', gender: 'Male', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
    { name: '2', characterName: 'ليلى', gender: 'Female', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
    { name: '3', characterName: 'نور', gender: 'Female', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO', isPro: true, provider: 'ghaymah' },
];

export default function StudioProjectPage() {
    const [projectTitle, setProjectTitle] = useState("Untitled Project");
    const [projectDescription, setProjectDescription] = useState("");
    const [voices, setVoices] = useState<(Voice & { isPro?: boolean })[]>([]);
    const [cards, setCards] = useState<StudioBlock[]>([]);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCriticalLoading, setIsCriticalLoading] = useState(true);
    const [isBlocksProcessing, setIsBlocksProcessing] = useState(true);
    // مفتاح لإجبار إعادة الرسم بعد تحديث البيانات الصوتية
    const [renderKey, setRenderKey] = useState(0);
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
    // مخزن مرجعي لسجلات الروابط ليستعمل داخل الاشتراك أيضًا
    const recordsWithLinksRef = useRef<any[]>([]);

    const activeCard = cards.find(c => c.id === activeCardId);

    if (!authContext) {
        throw new Error('AuthContext must be used within an AuthProvider');
    }

    // Auto-save for project name and description
    useEffect(() => {
        if (isInitialLoad.current) return;
        const handler = setTimeout(() => {
            console.log("Auto-saving project metadata...");
            updateProject(projectId, projectTitle, projectDescription)
                .then(() => toast.success("تم حفظ المشروع تلقائيًا!"))
                .catch(err => {
                    console.error("Auto-save failed:", err);
                    toast.error("فشل حفظ المشروع تلقائيًا.");
                });
        }, 2000);
        return () => clearTimeout(handler);
    }, [projectTitle, projectDescription, projectId]);

    useEffect(() => {
        const intervals = pollingIntervals.current;
        return () => { Object.values(intervals).forEach(clearInterval); };
    }, []);

    // Prevent redirect loops when user is not logged in
    const hasRedirectedToLogin = useRef(false);
    useEffect(() => {
      if (!authContext?.isLoading && !authContext?.user && !hasRedirectedToLogin.current) {
        hasRedirectedToLogin.current = true;
        router.replace('/login');
      }
    }, [authContext?.isLoading, authContext?.user, router]);
  
    // Main data loading effect
    useEffect(() => {
      let blockSubscription: { unsubscribe: () => void } | null = null;
      // Controllers to gracefully handle navigations/HMR without noisy aborted errors
      const voicesController = new AbortController();
      let recordsController: AbortController | null = null;

      async function loadInitialDataAndSubscribe() {
        if (authContext?.user?.id && projectId) {
          setIsCriticalLoading(true);
          setIsBlocksProcessing(true);
          try {
            // 1. Fetch non-real-time data once
            const voicesPromise = fetchVoices(voicesController.signal).catch((e: any) => {
              if (e?.name === 'AbortError') {
                // Navigation or HMR aborted voices fetch; continue with empty voices.
                return [];
              }
              throw e;
            });
            const projectPromise = getProjectById(projectId);
            const [fetchedVoices, projectData] = await Promise.all([
              voicesPromise,
              projectPromise,
            ]);

            if (!projectData || projectData.user_id !== authContext.user.id) {
              toast.error("Project not found or unauthorized.");
              // Prevent indefinite loading spinner before navigation
              setIsCriticalLoading(false);
              setIsBlocksProcessing(false);
              router.push('/projects');
              return;
            }
            
            setIsCriticalLoading(false);

            const allVoices = [
                ...proVoices,
                ...fetchedVoices.map(v => ({ ...v, isPro: false }))
            ];
            setVoices(allVoices);
            setProjectTitle(projectData.name || "Untitled Project");
            setProjectDescription(projectData.description || "");

            // 2. Preload blocks once so the UI doesn't hang waiting for WS
            try {
              const fetchedOnce = await getBlocksByProjectId(projectId);

              // Apply same filtering/merge logic used in subscription callback
              const filteredBlocks = fetchedOnce
                .filter((block: any) => block.content !== 'merged_blocks')
                .reduce((acc: any[], current: any) => {
                  const existingIndex = acc.findIndex((item: any) => 
                    item.block_index === current.block_index && 
                    item.block_index !== 'merged_blocks'
                  );
                  if (existingIndex !== -1) {
                    const existingDate = new Date(acc[existingIndex].created_at);
                    const currentDate = new Date(current.created_at);
                    if (currentDate > existingDate) {
                      acc[existingIndex] = current;
                    }
                  } else {
                    acc.push(current);
                  }
                  return acc;
                }, []);

              // Abort any in-flight records request and start a fresh one for latest data
              if (recordsController) {
                try { recordsController.abort(); } catch {}
              }
              recordsController = new AbortController();
              let recordsWithLinks: any[] = [];
              try {
                const recordsWithLinksRes = await fetch(`/api/project/get-records?projectId=${projectId}` , { cache: 'no-store', signal: recordsController.signal });
                recordsWithLinks = recordsWithLinksRes.ok ? await recordsWithLinksRes.json() : [];
                // خزّن للرجوع إليه لاحقًا داخل الاشتراك
                recordsWithLinksRef.current = recordsWithLinks;
              } catch (err: any) {
                if (err?.name !== 'AbortError') throw err;
              }

              const finalCards = await Promise.all(filteredBlocks.map(async (block: any) => {
                // حافظ على محتوى EditorJS إن كان مخزنًا ككائن، وحاول تحويل النصوص إلى EditorJS عند الحاجة
                let parsedContent: any;
                if (typeof block.content === 'object' && block.content && Array.isArray(block.content.blocks)) {
                  parsedContent = block.content;
                } else if (typeof block.content === 'string') {
                  try {
                    const obj = JSON.parse(block.content);
                    parsedContent = (obj && Array.isArray(obj.blocks)) ? obj : {
                      time: new Date(block.created_at).getTime() || Date.now(),
                      blocks: [{ id: block.id, type: 'paragraph', data: { text: block.content } }],
                      version: "2.28.2",
                    };
                  } catch (_) {
                    parsedContent = {
                      time: new Date(block.created_at).getTime() || Date.now(),
                      blocks: [{ id: block.id, type: 'paragraph', data: { text: block.content } }],
                      version: "2.28.2",
                    };
                  }
                } else {
                  parsedContent = {
                    time: new Date(block.created_at).getTime() || Date.now(),
                    blocks: [{ id: block.id, type: 'paragraph', data: { text: '' } }],
                    version: "2.28.2",
                  };
                }

                const recordWithLink = recordsWithLinksRef.current.find((r: any) => r.id === block.id);
                let duration = undefined;
                let audioUrl = undefined;

                if (recordWithLink?.s3_url && !recordWithLink.error) {
                  try {
                    new URL(recordWithLink.s3_url);
                    audioUrl = recordWithLink.s3_url;
                    // Duration is intentionally left undefined here to be calculated later.
                  } catch (urlError) {
                    console.warn(`Invalid URL for block ${block.id}:`, recordWithLink.s3_url);
                    audioUrl = undefined;
                  }
                } else if (recordWithLink?.error) {
                  console.warn(`Error with audio file for block ${block.id}:`, recordWithLink.error);
                }

                return {
                  ...block,
                  content: parsedContent,
                  voice: 'ar-SA-HamedNeural',
                  isGenerating: false,
                  isArabic: true,
                  audioUrl,
                  duration,
                };
              }));

              // تحديث كامل للحالة بالقيم القادمة من الخادم لتفادي التكرار أو الأشباح
              setCards([...finalCards]);

              if (isInitialLoad.current && finalCards.length === 0) {
                isInitialLoad.current = false;
                addCard();
              }

              if (finalCards.length > 0 && !finalCards.some((c: StudioBlock) => c.id === activeCardId)) {
                setActiveCardId(finalCards[0].id);
              } else if (finalCards.length === 0) {
                setActiveCardId(null);
              }

              // Mark initial load as complete even before WS pushes an event
              if (isInitialLoad.current) {
                isInitialLoad.current = false;
              }
              setIsBlocksProcessing(false); // تم جلب الكتل
            } catch (preloadErr: any) {
              console.warn('Initial blocks preload failed:', preloadErr);
              // Even if preload fails, don't block the UI; let subscription take over
              if (isInitialLoad.current) {
                isInitialLoad.current = false;
              }
              setIsBlocksProcessing(false); // تم جلب الكتل
            }

            // 3. Set up the real-time subscription for blocks
            const subscriptionRequest = subscribeToBlocks(projectId, async (fetchedBlocks) => {
              // This callback is not used with the current implementation
            });
            
            blockSubscription = subscriptionRequest.subscribe({
              next: async (result) => {
                try {
                  const fetchedBlocks = Array.isArray(result.data?.Voice_Studio_blocks) ? result.data.Voice_Studio_blocks : [];

                // CRITICAL FIX: تطبيق منطق التصفية وإزالة التكرار (Deduplication)
                // بدلاً من استخدام: const filteredBlocks = fetchedBlocks;
                const filteredBlocks = fetchedBlocks
                    .filter((block: any) => block.content !== 'merged_blocks')
                    .reduce((acc: any[], current: any) => {
                      const existingIndex = acc.findIndex((item: any) => 
                        item.block_index === current.block_index && 
                        item.block_index !== 'merged_blocks'
                      );
                      if (existingIndex !== -1) {
                        const existingDate = new Date(acc[existingIndex].created_at);
                        const currentDate = new Date(current.created_at);
                        if (currentDate > existingDate) {
                          acc[existingIndex] = current;
                        }
                      } else {
                        acc.push(current);
                      }
                      return acc;
                    }, []);

                // اجلب أحدث سجلات الصوت قبل بناء البطاقات لضمان وجود روابط محدثة
                await refetchBlocks();

                // 3. Process the received blocks (parse content, adopt s3_url directly)

                const finalCards = await Promise.all(filteredBlocks.map(async (block: any) => {
                  // حافظ على محتوى EditorJS إن كان مخزنًا ككائن، وتجاهل نص "merged_blocks" كعرض عادي
                  let parsedContent: any;
                  if (typeof block.content === 'object' && block.content && Array.isArray(block.content.blocks)) {
                    parsedContent = block.content;
                  } else if (typeof block.content === 'string' && block.content !== 'merged_blocks') {
                    try {
                      const obj = JSON.parse(block.content);
                      parsedContent = (obj && Array.isArray(obj.blocks)) ? obj : {
                        time: new Date(block.created_at).getTime() || Date.now(),
                        blocks: [{ id: block.id, type: 'paragraph', data: { text: block.content } }],
                        version: "2.28.2",
                      };
                    } catch (_) {
                      parsedContent = {
                        time: new Date(block.created_at).getTime() || Date.now(),
                        blocks: [{ id: block.id, type: 'paragraph', data: { text: block.content } }],
                        version: "2.28.2",
                      };
                    }
                  } else {
                    // حالة merged_blocks أو عدم وجود محتوى نصي
                    parsedContent = {
                      time: new Date(block.created_at).getTime() || Date.now(),
                      blocks: [{ id: block.id, type: 'paragraph', data: { text: '' } }],
                      version: "2.28.2",
                    };
                  }

                  const recordWithLink = recordsWithLinksRef.current.find((r: any) => r.id === block.id);
                  // التعديل: إعادة استخدام المدة المخزنة سابقًا
                  const existingCard = cards.find(c => c.id === block.id);
                  let duration = existingCard?.duration; 
                  let audioUrl = undefined;

                  // التحقق من صحة s3_url قبل استخدامه
                  if (recordWithLink?.s3_url && !recordWithLink.error) {
                    // التحقق من أن الرابط صالح
                    try {
                      new URL(recordWithLink.s3_url);
                      audioUrl = recordWithLink.s3_url;

                      // التعديل: إذا تغير الرابط الصوتي، يجب مسح المدة المخزنة
                      if (existingCard?.audioUrl !== audioUrl) {
                        duration = undefined; 
                      }

                    } catch (urlError) {
                      console.warn(`Invalid URL for block ${block.id}:`, recordWithLink.s3_url);
                      audioUrl = undefined;
                      duration = undefined; // reset duration on invalid URL/error
                    }
                  } else if (recordWithLink?.error) {
                    console.warn(`Error with audio file for block ${block.id}:`, recordWithLink.error);
                    duration = undefined; // reset duration on record error
                  }

                  return {
                    ...block,
                    content: parsedContent,
                    voice: 'ar-SA-HamedNeural',
                    isGenerating: false,
                    isArabic: true,
                    audioUrl: audioUrl,
                    duration: duration,
                  };
                }));

                // استبدال الحالة بالكامل بالقيم القادمة من الاشتراك لضمان تزامن فوري
                setCards([...finalCards]);
                // إجبار إعادة الرسم لضمان إعادة تحميل عناصر الصوت عند تغير الروابط
                setRenderKey(prev => prev + 1);

                // لا تقم بإضافة بلوك فارغ تلقائيًا عند عدم وجود بيانات من الخادم
                if (isInitialLoad.current) {
                  isInitialLoad.current = false;
                }

                if (finalCards.length > 0 && !finalCards.some((c: StudioBlock) => c.id === activeCardId)) {
                  setActiveCardId(finalCards[0].id);
                } else if (finalCards.length === 0) {
                  setActiveCardId(null);
                }
                
                // Mark initial load as complete after first data receive
                if (isInitialLoad.current) {
                    isInitialLoad.current = false;
                }
                setIsBlocksProcessing(false); 
                } catch (error: any) {
                  console.error('Subscription callback error:', error);
                  toast.error(`Subscription failed: ${error.message}`);
                }
              },
              error: (err) => {
                console.error('Subscription error:', err);
                toast.error(`Subscription failed: ${err.message}`);
              }
            });

          } catch (e: any) {
            toast.error(`Failed to load project data: ${e.message}`);
            setError(e.message);
            setIsCriticalLoading(false);
            setIsBlocksProcessing(false);
          }
        }
      }

      loadInitialDataAndSubscribe();

      // Cleanup function to unsubscribe and abort pending fetches
      return () => {
        if (blockSubscription) {
          blockSubscription.unsubscribe();
        }
        try { voicesController.abort(); } catch {}
        if (recordsController) {
          try { recordsController.abort(); } catch {}
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authContext?.user?.id, projectId]); 

    useEffect(() => {
        // Don't run if blocks are still being processed or if there are no cards
        if (isBlocksProcessing || cards.length === 0) {
            return;
        }

        const calculateMissingDurations = async () => {
            const cardsToUpdate = cards.filter(card => card.audioUrl && !card.duration);

            if (cardsToUpdate.length === 0) {
                return;
            }

            let hasUpdates = false;
            const updatedCards = await Promise.all(
                cards.map(async (card) => {
                    if (card.audioUrl && !card.duration) {
                        try {
                            const audio = new Audio();
                            audio.crossOrigin = "anonymous";
                            audio.src = card.audioUrl;
                            
                            const duration = await new Promise<number | null>((resolve) => {
                                const timeout = setTimeout(() => {
                                    console.warn(`Timeout calculating duration for ${card.id}`);
                                    resolve(null);
                                }, 7000);

                                audio.addEventListener('loadedmetadata', () => {
                                    clearTimeout(timeout);
                                    resolve(audio.duration);
                                });

                                audio.addEventListener('error', (e) => {
                                    clearTimeout(timeout);
                                    console.warn(`Audio metadata load error for block ${card.id}:`, e);
                                    resolve(null);
                                });
                            });

                            if (duration) {
                                hasUpdates = true;
                                return { ...card, duration };
                            }
                        } catch (error) {
                            console.warn(`Could not calculate duration for block ${card.id}:`, error);
                        }
                    }
                    return card;
                })
            );

            if (hasUpdates) {
                setCards(updatedCards);
            }
        };

        calculateMissingDurations();

    }, [cards, isBlocksProcessing]);

    const addCard = async () => {
        const newCardId = uuidv4();
        const isProMode = voiceMode === 'Pro';
        const defaultVoice = isProMode 
            ? (voices.find(v => v.isPro)?.name || "0") 
            : (voices.find(v => !v.isPro)?.name || "ar-EG-ShakirNeural"); 

        const newCard: StudioBlock = {
            id: newCardId, 
            project_id: projectId,
            block_index: cards.length.toString(), // Convert to string for database compatibility
            content: { 
                time: Date.now(), 
                blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }],
                version: "2.28.2"
            },
            s3_url: '', // FIX: Provide a default value for the non-nullable column
            created_at: new Date().toISOString(),
            voice: defaultVoice, // Frontend-only field, will be filtered out in upsertBlock
            isGenerating: false,
            isArabic: isProMode, 
            voiceSelected: false,
        };

        try {
            // بدء مهمة TTS يتم عبر زر التوليد أو الاستدعاء الصريح لاحقًا
            setCards(prevCards => [...prevCards, newCard]);
            setActiveCardId(newCardId);
            toast.success("New block added!");
        } catch (error: any) {
            toast.error(`Failed to add block: ${error.message}`);
        }
    };
    
    const updateCard = (id: string, data: Partial<StudioBlock>) => {
        setCards(currentCards => 
            currentCards.map(card => 
              card.id === id ? { ...card, ...data } : card
            )
        );
    };

    const removeCard = async (id: string) => {
        const originalCards = [...cards];
        const cardToRemove = originalCards.find(c => c.id === id);

        if (!cardToRemove) return;

        // Optimistically remove the card from the UI
        setCards(prev => prev.filter(card => card.id !== id));
        if (pollingIntervals.current[id]) {
            clearInterval(pollingIntervals.current[id]);
            delete pollingIntervals.current[id];
        }

        try {
            // حاول الحذف بالمعرّف أولًا، ثم بالفهارس كخطة بديلة
            let deleted = false;
            try {
                const byId = await deleteBlock(cardToRemove.id);
                deleted = !!byId?.id;
            } catch (err: any) {
                // إذا لم يُعثر عليه، جرّب الحذف بواسطة project_id + block_index
                if (!/not found/i.test(err?.message || '')) {
                    throw err;
                }
            }

            if (!deleted) {
                try {
                    const affected = await deleteBlockByIndex(projectId, cardToRemove.block_index);
                    deleted = affected > 0;
                } catch (err: any) {
                    if (/not found/i.test(err?.message || '')) {
                        // بلوك محلي غير محفوظ في الخادم؛ اعتبر الحذف ناجحًا محليًا
                        deleted = true;
                    } else {
                        throw err;
                    }
                }
            }

            if (deleted) {
                toast.success("Block deleted.");
            } else {
                // في حال لم تؤثر أي عملية حذف ولم تكن هناك أخطاء، اعتبره محذوفًا محليًا
                toast.success("Local block removed.");
            }
        } catch (error: any) {
            toast.error(`Failed to delete block: ${error.message}`);
            // If the delete fails due to unexpected error, revert the state
            setCards(originalCards);
        }
    };
    
    const handleApplyVoice = (voiceName: string) => {
      if (activeCardId) {
        const selectedVoice = voices.find(v => v.name === voiceName);
        const isProVoice = selectedVoice?.isPro ?? false;
        updateCard(activeCardId, { voice: voiceName, isArabic: isProVoice, voiceSelected: true });
        toast.success(`Voice applied.`);
      }
    };
    
    // حالة مخزنة للروابط المحدثة (لتفادي الخطأ وللاستخدام لاحقًا)
    const [records, setRecords] = useState<any[]>([]);

    // دالة لإعادة جلب الروابط الصوتية المرتبطة بالكتل فقط
    const refetchBlocks = async () => {
        if (!projectId) return;
        try {
            if (recordsController) { try { recordsController.abort(); } catch {} }
            recordsController = new AbortController();
            const res = await fetch(`/api/project/get-records?projectId=${projectId}`, { cache: 'no-store', signal: recordsController.signal });
            const data = await res.json();
            setRecords(data);
            // حافظ على نسخة مرجعية للاشتراك لتحديث audioUrl دون تكرار
            recordsWithLinksRef.current = data;
        } catch (err: any) {
            if (err?.name !== 'AbortError') {
                console.error('Refetch records failed:', err);
                toast.error(err.message || 'فشل تحديث المقاطع الصوتية.');
            }
        }
    };
    
    const handleGenerate = async () => {
        if (!authContext.user) return;
        // تحقق أولاً أن كل block لديه صوت محدد قبل أي استدعاء API
        const hasMissingVoiceGlobal = cards.some(b => !b.voice || b.voice.trim() === "");
        if (hasMissingVoiceGlobal) {
            toast.error("من فضلك اختر صوت لكل مقطع قبل التوليد.");
            return;
        }
        const cardsToGenerate = cards.filter(card =>
            card.content.blocks.some(b => b.data.text && b.data.text.trim().length > 0) && 
            !card.isGenerating
        );

        if (cardsToGenerate.length === 0) {
            toast.error('أضف نصًا لتوليد الصوت أو انتظر اكتمال العملية الحالية.');
            return;
        }

        setIsGenerating(true);
        setError(null);

        // CRITICAL FIX 1: ضمان حفظ جميع الكتل (Upsert) قبل البدء
        // هذا يحل مشكلة الكتل الجديدة/التي لم تُحفظ بعد وتكرارها أو اختلاطها لاحقًا
        try {
             const persistenceToastId = toast.loading("جاري تأمين وحفظ الكتل...");
             for (const card of cardsToGenerate) {
                // Upsert the block to ensure it exists in Hasura with the latest content/voice
                await upsertBlock(card); 
             }
             toast.success("تم تأمين الكتل بنجاح.", { id: persistenceToastId });
        } catch (err) {
             console.error("Failed to upsert blocks before generation:", err);
             toast.error("فشل تأمين الكتل. يرجى المحاولة مرة أخرى.");
             setIsGenerating(false);
             return;
        }

        // علّم كل البطاقات قيد التوليد بدون إنشاء وظائف منفصلة لكل واحدة
        for (const card of cardsToGenerate) {
            updateCard(card.id, { isGenerating: true, audioUrl: undefined, duration: undefined });
        }

        const loadingToastId = toast.loading(`بدء التوليد لمجموع ${cardsToGenerate.length} كتل...`);

        try {
            // اجمع كل الكتل في مصفوفة واحدة blocks
            const blocksPayload = cardsToGenerate.map(card => {
                // CRITICAL FIX 2: استخلاص Provider Name ديناميكياً
                const selectedVoice = voices.find(v => v.name === card.voice);
                const providerName = selectedVoice?.provider || 'ghaymah'; // Fallback to ghaymah

                return {
                    text: card.content.blocks.map(b => b.data.text).join(' ').trim(),
                    wait_after_ms: 500,
                    // CRITICAL FIX 3: استخدام Provider الديناميكي بدلاً من الثابت
                    provider: providerName, 
                    voice: card.voice,
                    arabic: !!card.isArabic,
                    // CRITICAL FIX 4: تمرير block_id للربط في الخلفية 
                    block_id: card.id, 
                }
            });

            // أرسل طلب HTTP واحد فقط إلى /api/tts/create (نفس الأصل)
            // استخدم مسار نسبي لتجنب مشاكل المنافذ أو الأصل أثناء التطوير
            const createResponse = await fetch(`/api/tts/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    project_id: projectId,
                    user_id: authContext.user.id,
                    blocks: blocksPayload
                }),
            });

            if (!createResponse.ok) {
                // حاول قراءة الاستجابة كـ JSON، وإن فشلت اقرأها كنصّ لمزيد من التشخيص
                let errMessage = 'فشل بدء مهمة TTS الموحدة.';
                try {
                    const errJson = await createResponse.json();
                    errMessage = errJson?.error || errMessage;
                } catch {
                    const errText = await createResponse.text().catch(() => '');
                    errMessage = errText || errMessage;
                }
                throw new Error(errMessage);
            }

            // قراءة آمنة لنتيجة الإنشاء
            let job_id: string | undefined;
            try {
                const jobData = await createResponse.json();
                job_id = jobData?.job_id;
            } catch (parseErr) {
                throw new Error('استجابة غير صالحة من /api/tts/create (JSON)');
            }
            if (!job_id) {
                throw new Error('لم يتم إرجاع job_id من /api/tts/create');
            }

            // لا تستدعِ إعادة الجلب هنا لتجنب التكرار؛ سيتم الاستدعاء بعد اكتمال الحفظ لاحقًا

            // الاستعلام عن حالة المهمة الموحدة حتى الاكتمال
            let status = '' as string;
            while (status !== 'completed') {
                await new Promise(res => setTimeout(res, 2000));
                const statusResponse = await fetch(`/api/tts/status/${job_id}`);
                if (!statusResponse.ok) throw new Error('فشل الاستعلام عن حالة التوليد');
                const statusData = await statusResponse.json();
                status = statusData.status;
                if (status === 'failed') throw new Error('فشل توليد الصوت في الخلفية.');
            }

            // اجلب الملف النهائي المدمج للمهمة
            const audioResponse = await fetch(`/api/tts/result/${job_id}`);
            if (!audioResponse.ok) throw new Error('فشل جلب نتيجة الصوت');
            const audioBlob = await audioResponse.blob();
            const objectUrl = URL.createObjectURL(audioBlob);

            // ارفع النتيجة المدمجة إلى التخزين الثابت (Wasabi/S3)
            const s3_url = await uploadAudioSegment(audioBlob, projectId);
            const durationSec = getMP3Duration(Buffer.from(await audioBlob.arrayBuffer())) / 1000;

            // حدّث كل البطاقات: نفس الرابط المؤقت والمدة للعرض فقط
            for (const card of cardsToGenerate) {
                updateCard(card.id, { isGenerating: false, audioUrl: objectUrl, duration: durationSec });
            }

            // احفظ سجلًا واحدًا فقط باسم merged_blocks وتجنّب التكرار
            try {
                // احذف أي سجل سابق يحمل block_index = 'merged_blocks' لهذا المشروع لتجنّب التكرار
                await deleteBlockByIndex(projectId, 'merged_blocks').catch(() => {});
            } catch {}

            // أنشئ سجلًا جديدًا عبر مسار API ليتم حفظه في Voice_Studio_blocks بدون تكرار
            const saveRes = await fetch('/api/project/save-merged-block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, s3Url: s3_url })
            });
            if (!saveRes.ok) {
                const errJson = await saveRes.json().catch(() => ({} as any));
                console.warn('Failed to persist merged_blocks:', errJson?.error || saveRes.statusText);
            }

            // بعد الحفظ، جدّد السجلات الصوتية ثم أجبر إعادة الرسم لضمان إعادة تحميل الصوت
            await refetchBlocks();
            setRenderKey(prev => prev + 1);
            toast.success('اكتمل الدمج وتم تحديث المقاطع الصوتية تلقائيًا.', { id: loadingToastId });
        } catch (err: any) {
            for (const card of cardsToGenerate) {
                updateCard(card.id, { isGenerating: false });
            }
            toast.error(err.message || 'حدث خطأ أثناء التوليد والدمج.');
        } finally {
            setIsGenerating(false);
        }
    };
  
    // ... (handleDownloadAll and render logic remains largely the same) ...
    const handleDownloadAll = async () => {
        const jobIds = cards
            .map(card => card.job_id)
            .filter((id): id is string => !!id);

        if (jobIds.length === 0) {
            toast.error("No audio has been generated yet.");
            return;
        }

        setIsGenerating(true);
        const downloadToastId = toast.loading('Merging audio... this may take a moment.');

        try {
            const response = await fetch('/api/tts/merge-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to merge audio.');
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
            
            toast.success('Audio successfully merged and downloaded!', { id: downloadToastId });

        } catch (err: any) {
            toast.error(err.message || "An error occurred during merge and download.", { id: downloadToastId });
        } finally {
            setIsGenerating(false);
        }
    };
  
    const languages = Array.from(new Map(voices.map(v => [v.languageCode, { code: v.languageCode, name: v.languageName }])).values());
    const countries = Array.from(new Map(voices.map(v => [v.countryCode, { code: v.countryCode, name: v.countryName }])).values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  
    const filteredVoices = voices
      .filter(voice => (languageFilter === 'all' || voice.languageCode === languageFilter))
      .filter(voice => (countryFilter === 'all' || voice.countryCode === countryFilter))
      .filter(voice => (genderFilter === 'all' || voice.gender === genderFilter))
      .filter(voice => (voiceMode === 'Pro' ? voice.isPro : !voice.isPro))
      .filter(voice => {
          if (searchTerm.trim() === '') return true;
          const lowerSearchTerm = searchTerm.toLowerCase();
          return (voice.characterName.toLowerCase().includes(lowerSearchTerm) || voice.countryName.toLowerCase().includes(lowerSearchTerm));
      });
  
    // Avoid infinite spinner: only show auth spinner while auth is resolving.
    // If there's no user after auth resolves, let the redirect effect handle navigation.
    if (authContext?.isLoading) {
      return <CenteredLoader message="Authenticating..." />;
    }

    if (!authContext?.user) {
      // Redirect handled by useEffect (router.replace('/login')).
      return null;
    }

    if (isCriticalLoading) {
        return <CenteredLoader message="جاري تحميل إعدادات المشروع والأصوات..." />;
    }

    // لا تحجب الصفحة أثناء تحميل البيانات؛ اعرض الواجهة مباشرة
  
    return (
        <div key={renderKey} className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans relative">
            <div className="flex-shrink-0 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <ProjectHeader 
                projectTitle={projectTitle}
                setProjectTitle={setProjectTitle}
                projectDescription={projectDescription}
                setProjectDescription={setProjectDescription}
                isGenerating={isGenerating}
                isGenerateDisabled={isGenerating || cards.some(b => !b.voice || b.voice.trim() === "")}
                handleGenerate={handleGenerate}
                handleDownloadAll={handleDownloadAll}
            />
            </div>

             <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
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
                        projectId={projectId}
                        isBlocksProcessing={isBlocksProcessing}
                    />

                </main>
                
                <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
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

            {cards.length > 0 && (
                <div className="flex-shrink-0 h-48 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-inner">
                    <div className="h-full flex flex-col">
                        <Timeline 
                            cards={cards} 
                            onCardsUpdate={setCards} 
                            isBlocksProcessing={isBlocksProcessing}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}