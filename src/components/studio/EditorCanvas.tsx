// src/components/studio/EditorCanvas.tsx
'use client';

import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react"; // تم حذف Type, Edit3, MoreHorizontal لأننا حذفنا الشريط
import { TTSCardData, Voice } from "@/lib/types";
import SortableEditorBlock from "../SortableEditorBlock";

interface EditorCanvasProps {
    cards: TTSCardData[];
    setCards: (cards: TTSCardData[] | ((prev: TTSCardData[]) => TTSCardData[])) => void;
    voices: Voice[];
    activeCardId: string | null;
    setActiveCardId: (id: string | null) => void;
    updateCard: (id: string, data: Partial<TTSCardData>) => void;
    removeCard: (id: string) => void;
    addCard: () => void;
    error: string | null;
    pageMessage: string | null;
}

export default function EditorCanvas({ 
    cards, setCards, voices, activeCardId, setActiveCardId, 
    updateCard, removeCard, addCard, error, pageMessage
}: EditorCanvasProps) {

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex(item => item.id === active.id);
            const newIndex = cards.findIndex(item => item.id === over.id);
            setCards(arrayMove(cards, oldIndex, newIndex));
        }
    }

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            
            {/* === تم حذف الشريط الأبيض الخاص بـ "Speech Synthesis" والأزرار المصاحبة له === */}

            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900 transition-colors duration-200"> {/* تم تطبيق تنسيقات الوضع الداكن هنا أيضاً لضمان التناسق */}
                {(error || pageMessage) && (
                    <div className={`max-w-4xl mx-auto w-full mb-4 p-3 rounded-lg text-center text-sm font-medium ${error ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                        {error || pageMessage}
                    </div>
                )}
                
                <div className="w-full max-w-4xl mx-auto">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                            {cards.map((card) => (
                                <SortableEditorBlock 
                                    key={card.id} 
                                    cardData={card} 
                                    voices={voices} 
                                    onUpdate={updateCard} 
                                    onRemove={removeCard} 
                                    isActive={activeCardId === card.id} 
                                    onClick={setActiveCardId} 
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    {cards.length === 0 && !error && !pageMessage && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-16">
                            <p>أضف نصًا لتوليد الصوت، أو انتظر انتهاء العملية الحالية.</p>
                        </div>
                    )}
                    <div className="flex justify-center mt-4 p-4">
                        <button onClick={addCard} className="p-3 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Plus size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}